import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { BalanceService } from '../balance/balance.service';
import { calculateDemurrage } from '../shared';

@Injectable()
export class DemurrageService {
  constructor(
    private prisma: PrismaService,
    private balanceService: BalanceService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async applyDemurrage() {
    console.log('Starting demurrage calculation...');

    try {
      // Get demurrage policy
      const demurragePolicy = await this.prisma.policy.findUnique({
        where: { key: 'demurrage.annual' },
      });

      const annualRate = demurragePolicy ? parseFloat(demurragePolicy.value.toString()) : 0.02;

      // Get exempt accounts
      const exemptPolicy = await this.prisma.policy.findUnique({
        where: { key: 'demurrage.exempt_accounts' },
      });

      const exemptAccounts = exemptPolicy ? JSON.parse(exemptPolicy.value.toString()) : ['treasury', 'witnesses'];

      // Get min balance threshold
      const minBalancePolicy = await this.prisma.policy.findUnique({
        where: { key: 'demurrage.min_balance' },
      });

      const minBalance = minBalancePolicy ? BigInt(minBalancePolicy.value.toString()) : BigInt(1000);

      // Get all accounts with balances above minimum
      const accounts = await this.prisma.account.findMany({
        where: {
          kind: {
            notIn: exemptAccounts,
          },
        },
        include: {
          balances: true,
        },
      });

      let totalDemurrage = BigInt(0);
      let processedAccounts = 0;

      for (const account of accounts) {
        const balance = account.balances[0];
        if (!balance) continue;

        const balanceAmount = BigInt(balance.microAmount.toString());
        if (balanceAmount <= minBalance) continue;

        // Calculate demurrage for 1 day
        const demurrageAmount = calculateDemurrage(
          balance.microAmount.toString(),
          annualRate,
          1
        );

        const demurrageBigInt = BigInt(demurrageAmount);
        if (demurrageBigInt > 0) {
          // Apply demurrage as negative adjustment
          await this.balanceService.adjustBalance(
            account.id,
            (-demurrageBigInt).toString(),
            'demurrage'
          );

          totalDemurrage += demurrageBigInt;
          processedAccounts++;
        }
      }

      console.log(`Demurrage applied: ${totalDemurrage} microAIM to ${processedAccounts} accounts`);
    } catch (error) {
      console.error('Error applying demurrage:', error);
    }
  }

  async calculateDemurrageForAccount(accountId: string, days: number = 1) {
    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
      include: { balances: true },
    });

    if (!account || !account.balances[0]) {
      return { demurrageAmount: '0', balance: '0' };
    }

    const balance = account.balances[0];
    const demurragePolicy = await this.prisma.policy.findUnique({
      where: { key: 'demurrage.annual' },
    });

    const annualRate = demurragePolicy ? parseFloat(demurragePolicy.value.toString()) : 0.02;
    const demurrageAmount = calculateDemurrage(
      balance.microAmount.toString(),
      annualRate,
      days
    );

    return {
      demurrageAmount,
      balance: balance.microAmount.toString(),
    };
  }
}
