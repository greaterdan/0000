import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JournalService } from '../journal/journal.service';
import { validateMicroAimAmount, JournalType } from '../shared';

export interface TransferRequest {
  from: string;
  to: string;
  microAmount: string;
  memo?: string;
}

export interface MintRequest {
  accountId: string;
  microAmount: string;
  jobId?: string;
  reason?: string;
}

@Injectable()
export class BalanceService {
  constructor(
    private prisma: PrismaService,
    private journalService: JournalService,
  ) {}

  async getBalance(accountId: string) {
    const balance = await this.prisma.balance.findUnique({
      where: { accountId },
    });

    if (!balance) {
      throw new NotFoundException(`Balance for account ${accountId} not found`);
    }

    return balance;
  }

  async transfer(request: TransferRequest) {
    // Validate amount
    if (!validateMicroAimAmount(request.microAmount)) {
      throw new BadRequestException('Invalid micro amount');
    }

    const amount = BigInt(request.microAmount);
    if (amount <= 0) {
      throw new BadRequestException('Transfer amount must be positive');
    }

    // Check if accounts exist
    const [fromAccount, toAccount] = await Promise.all([
      this.prisma.account.findUnique({ where: { id: request.from } }),
      this.prisma.account.findUnique({ where: { id: request.to } }),
    ]);

    if (!fromAccount) {
      throw new NotFoundException(`From account ${request.from} not found`);
    }
    if (!toAccount) {
      throw new NotFoundException(`To account ${request.to} not found`);
    }

    // Use database transaction for ACID compliance
    return await this.prisma.$transaction(async (tx) => {
      // Lock and check from balance
      const fromBalance = await tx.balance.findUnique({
        where: { accountId: request.from },
      });

      if (!fromBalance) {
        throw new NotFoundException(`Balance for account ${request.from} not found`);
      }

      const fromAmount = BigInt(fromBalance.microAmount.toString());
      if (fromAmount < amount) {
        throw new BadRequestException('Insufficient balance');
      }

      // Update balances
      await tx.balance.update({
        where: { accountId: request.from },
        data: { microAmount: (fromAmount - amount).toString() },
      });

      await tx.balance.upsert({
        where: { accountId: request.to },
        create: { accountId: request.to, microAmount: amount.toString() },
        update: { microAmount: (BigInt((await tx.balance.findUnique({ where: { accountId: request.to } }))?.microAmount.toString() || '0') + amount).toString() },
      });

      // Get latest journal entry for prev hash
      const latestEntry = await tx.journalEntry.findFirst({
        orderBy: { ts: 'desc' },
      });

      const prevHash = latestEntry ? Buffer.from(latestEntry.leafHash).toString('hex') : '00';

      // Create journal entry
      const journalResponse = await this.journalService.appendEntry({
        type: JournalType.transfer,
        payload: {
          from: request.from,
          to: request.to,
          micro_amount: request.microAmount,
          memo: request.memo,
        },
        prevHash,
      });

      return {
        transactionId: journalResponse.transactionId,
        fromBalance: (fromAmount - amount).toString(),
        toBalance: (BigInt((await tx.balance.findUnique({ where: { accountId: request.to } }))?.microAmount.toString() || '0')).toString(),
      };
    });
  }

  async mint(request: MintRequest) {
    // Validate amount
    if (!validateMicroAimAmount(request.microAmount)) {
      throw new BadRequestException('Invalid micro amount');
    }

    const amount = BigInt(request.microAmount);
    if (amount <= 0) {
      throw new BadRequestException('Mint amount must be positive');
    }

    // Check if account exists
    const account = await this.prisma.account.findUnique({
      where: { id: request.accountId },
    });

    if (!account) {
      throw new NotFoundException(`Account ${request.accountId} not found`);
    }

    // Use database transaction for ACID compliance
    return await this.prisma.$transaction(async (tx) => {
      // Update balance
      await tx.balance.upsert({
        where: { accountId: request.accountId },
        create: { accountId: request.accountId, microAmount: amount.toString() },
        update: { microAmount: (BigInt((await tx.balance.findUnique({ where: { accountId: request.accountId } }))?.microAmount.toString() || '0') + amount).toString() },
      });

      // Get latest journal entry for prev hash
      const latestEntry = await tx.journalEntry.findFirst({
        orderBy: { ts: 'desc' },
      });

      const prevHash = latestEntry ? Buffer.from(latestEntry.leafHash).toString('hex') : '00';

      // Create journal entry
      const journalResponse = await this.journalService.appendEntry({
        type: JournalType.mint,
        payload: {
          account_id: request.accountId,
          micro_amount: request.microAmount,
          job_id: request.jobId,
          reason: request.reason || 'mint',
        },
        prevHash,
      });

      return {
        transactionId: journalResponse.transactionId,
        newBalance: (BigInt((await tx.balance.findUnique({ where: { accountId: request.accountId } }))?.microAmount.toString() || '0')).toString(),
      };
    });
  }

  async adjustBalance(accountId: string, microAmount: string, reason: string) {
    // Validate amount
    if (!validateMicroAimAmount(microAmount)) {
      throw new BadRequestException('Invalid micro amount');
    }

    const amount = BigInt(microAmount);

    // Use database transaction for ACID compliance
    return await this.prisma.$transaction(async (tx) => {
      // Update balance
      await tx.balance.upsert({
        where: { accountId },
        create: { accountId, microAmount: amount.toString() },
        update: { microAmount: (BigInt((await tx.balance.findUnique({ where: { accountId } }))?.microAmount.toString() || '0') + amount).toString() },
      });

      // Get latest journal entry for prev hash
      const latestEntry = await tx.journalEntry.findFirst({
        orderBy: { ts: 'desc' },
      });

      const prevHash = latestEntry ? Buffer.from(latestEntry.leafHash).toString('hex') : '00';

      // Create journal entry
      const journalResponse = await this.journalService.appendEntry({
        type: JournalType.adjust,
        payload: {
          account_id: accountId,
          micro_amount: microAmount,
          reason,
        },
        prevHash,
      });

      return {
        transactionId: journalResponse.transactionId,
        newBalance: (BigInt((await tx.balance.findUnique({ where: { accountId } }))?.microAmount.toString() || '0')).toString(),
      };
    });
  }
}
