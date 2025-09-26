import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PqSignerService } from '../pq-signer/pq-signer.service';
import { JournalType, generateLeafHash } from '../shared';
import { v4 as uuidv4 } from 'uuid';

export interface AppendEntryRequest {
  type: JournalType;
  payload: Record<string, any>;
  prevHash: string;
}

export interface AppendEntryResponse {
  transactionId: string;
  leafHash: string;
  merkleRoot: string;
  sigDilithium: string;
  sigSphincs: string;
}

@Injectable()
export class JournalService {
  constructor(
    private prisma: PrismaService,
    private pqSigner: PqSignerService,
  ) {}

  async appendEntry(request: AppendEntryRequest): Promise<AppendEntryResponse> {
    const transactionId = uuidv4();
    const timestamp = new Date();
    
    // Generate leaf hash
    const leafHash = generateLeafHash(
      request.type,
      request.payload,
      request.prevHash,
      timestamp
    );

    // For MVP, we'll use a simple merkle root (in production, this would be computed from the tree)
    const merkleRoot = leafHash;

    // Get dual signatures from pqsigner
    const [sigDilithium, sigSphincs] = await Promise.all([
      this.pqSigner.sign(leafHash, 'dilithium_ledger_dev'),
      this.pqSigner.sign(leafHash, 'sphincs_ledger_dev'),
    ]);

    // Create journal entry in database
    const journalEntry = await this.prisma.journalEntry.create({
      data: {
        id: transactionId,
        type: request.type,
        payload: request.payload,
        prevHash: Buffer.from(request.prevHash, 'hex'),
        leafHash: Buffer.from(leafHash, 'hex'),
        merkleRoot: Buffer.from(merkleRoot, 'hex'),
        sigDilithium: Buffer.from(sigDilithium, 'hex'),
        sigSphincs: Buffer.from(sigSphincs, 'hex'),
        signerId: request.payload.account_id || 'system',
      },
    });

    return {
      transactionId: journalEntry.id,
      leafHash,
      merkleRoot,
      sigDilithium,
      sigSphincs,
    };
  }

  async getLatestEntry() {
    return this.prisma.journalEntry.findFirst({
      orderBy: { ts: 'desc' },
    });
  }

  async getEntriesByType(type: JournalType, limit: number = 100) {
    return this.prisma.journalEntry.findMany({
      where: { type },
      orderBy: { ts: 'desc' },
      take: limit,
    });
  }

  async getEntriesByAccount(accountId: string, limit: number = 100) {
    return this.prisma.journalEntry.findMany({
      where: { signerId: accountId },
      orderBy: { ts: 'desc' },
      take: limit,
    });
  }

  async getEntryById(id: string) {
    return this.prisma.journalEntry.findUnique({
      where: { id },
    });
  }

  async getEntriesInPeriod(startDate: Date, endDate: Date) {
    return this.prisma.journalEntry.findMany({
      where: {
        ts: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { ts: 'asc' },
    });
  }
}
