import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AccountKind, AccountStatus } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

export interface CreateAccountRequest {
  kind: AccountKind;
  displayName: string;
  reputationScore?: number;
  tpmAttested?: boolean;
}

@Injectable()
export class AccountService {
  constructor(private prisma: PrismaService) {}

  async createAccount(request: CreateAccountRequest) {
    const account = await this.prisma.account.create({
      data: {
        id: uuidv4(),
        kind: request.kind,
        displayName: request.displayName,
        reputationScore: request.reputationScore || 0.0,
        tpmAttested: request.tpmAttested || false,
      },
    });

    // Create initial balance
    await this.prisma.balance.create({
      data: {
        accountId: account.id,
        microAmount: 0,
      },
    });

    return account;
  }

  async getAccount(id: string) {
    const account = await this.prisma.account.findUnique({
      where: { id },
      include: {
        balances: true,
      },
    });

    if (!account) {
      throw new NotFoundException(`Account ${id} not found`);
    }

    return account;
  }

  async updateAccountStatus(id: string, status: AccountStatus) {
    return this.prisma.account.update({
      where: { id },
      data: { status },
    });
  }

  async updateReputationScore(id: string, score: number) {
    return this.prisma.account.update({
      where: { id },
      data: { reputationScore: score },
    });
  }

  async listAccounts(kind?: AccountKind, limit: number = 100) {
    return this.prisma.account.findMany({
      where: kind ? { kind } : {},
      include: {
        balances: true,
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAccountByDisplayName(displayName: string) {
    return this.prisma.account.findFirst({
      where: { displayName },
      include: {
        balances: true,
      },
    });
  }
}
