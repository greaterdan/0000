import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';

export interface MerkleProof {
  path: string[];
  leafHash: string;
  root: string;
}

@Injectable()
export class MerkleService {
  private buildMerkleTree(hashes: string[]): { root: string; tree: string[][] } {
    if (hashes.length === 0) {
      return { root: '', tree: [] };
    }

    if (hashes.length === 1) {
      return { root: hashes[0], tree: [hashes] };
    }

    const tree: string[][] = [hashes];
    let currentLevel = hashes;

    while (currentLevel.length > 1) {
      const nextLevel: string[] = [];
      
      for (let i = 0; i < currentLevel.length; i += 2) {
        const left = currentLevel[i];
        const right = i + 1 < currentLevel.length ? currentLevel[i + 1] : left;
        const combined = left + right;
        const hash = createHash('sha256').update(combined).digest('hex');
        nextLevel.push(hash);
      }
      
      tree.push(nextLevel);
      currentLevel = nextLevel;
    }

    return { root: currentLevel[0], tree };
  }

  generateMerkleRoot(hashes: string[]): string {
    const { root } = this.buildMerkleTree(hashes);
    return root;
  }

  generateProof(hashes: string[], targetIndex: number): MerkleProof {
    const { tree } = this.buildMerkleTree(hashes);
    
    if (targetIndex >= hashes.length) {
      throw new Error('Target index out of bounds');
    }

    const path: string[] = [];
    let currentIndex = targetIndex;

    for (let level = 0; level < tree.length - 1; level++) {
      const currentLevel = tree[level];
      const siblingIndex = currentIndex % 2 === 0 ? currentIndex + 1 : currentIndex - 1;
      
      if (siblingIndex < currentLevel.length) {
        path.push(currentLevel[siblingIndex]);
      }
      
      currentIndex = Math.floor(currentIndex / 2);
    }

    return {
      path,
      leafHash: hashes[targetIndex],
      root: tree[tree.length - 1][0],
    };
  }

  verifyProof(proof: MerkleProof, targetHash: string): boolean {
    let currentHash = targetHash;
    
    for (const siblingHash of proof.path) {
      const combined = currentHash + siblingHash;
      currentHash = createHash('sha256').update(combined).digest('hex');
    }
    
    return currentHash === proof.root;
  }

  generateConsistencyProof(oldHashes: string[], newHashes: string[]): string[] {
    const oldRoot = this.generateMerkleRoot(oldHashes);
    const newRoot = this.generateMerkleRoot(newHashes);
    
    // Simple consistency proof - in production, this would be more sophisticated
    return [oldRoot, newRoot];
  }
}
