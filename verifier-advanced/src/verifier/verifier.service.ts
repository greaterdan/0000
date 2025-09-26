import { Injectable } from '@nestjs/common';

export interface ScoreRequest {
  jobId: string;
  inputsHash: string;
  spec: Record<string, any>;
}

export interface ScoreResponse {
  score: number;
  report: Record<string, any>;
}

@Injectable()
export class VerifierService {
  async scoreJob(request: ScoreRequest): Promise<ScoreResponse> {
    console.log(`Advanced verifier scoring job ${request.jobId}`);

    // Ensemble scoring with multiple models
    const scores = await Promise.all([
      this.summarizeV1Score(request.spec),
      this.classificationV1Score(request.spec),
      this.qualityScore(request.spec),
      this.manipulationDetectionScore(request.spec),
    ]);

    // Calculate ensemble score (median of all scores)
    const sortedScores = scores.sort((a, b) => a - b);
    const medianScore = this.calculateMedian(sortedScores);

    // Apply quality gates
    const finalScore = this.applyQualityGates(medianScore, scores);

    const report = {
      jobId: request.jobId,
      inputsHash: request.inputsHash,
      ensembleScore: medianScore,
      finalScore,
      individualScores: {
        summarize: scores[0],
        classification: scores[1],
        quality: scores[2],
        manipulation: scores[3],
      },
      qualityGates: {
        passed: finalScore >= 0.85,
        threshold: 0.85,
      },
      timestamp: new Date().toISOString(),
    };

    console.log(`Job ${request.jobId} scored: ${finalScore.toFixed(3)} (ensemble: ${medianScore.toFixed(3)})`);
    
    return {
      score: finalScore,
      report,
    };
  }

  private async summarizeV1Score(spec: Record<string, any>): Promise<number> {
    // ROUGE/BERTScore evaluation for summarization tasks
    if (spec.type !== 'summarize') {
      return 0.5; // Neutral score for non-summarization tasks
    }

    const inputs = spec.inputs || [];
    const gold = spec.gold || [];
    
    if (inputs.length === 0 || gold.length === 0) {
      return 0.0; // No data to evaluate
    }

    // Simulate ROUGE-L score calculation
    let rougeScore = 0;
    for (let i = 0; i < Math.min(inputs.length, gold.length); i++) {
      const inputText = inputs[i].text || '';
      const goldText = gold[i].text || '';
      
      // Simple word overlap calculation (simplified ROUGE)
      const inputWords = inputText.toLowerCase().split(/\s+/);
      const goldWords = goldText.toLowerCase().split(/\s+/);
      const overlap = inputWords.filter(word => goldWords.includes(word)).length;
      const precision = overlap / inputWords.length;
      const recall = overlap / goldWords.length;
      const f1 = (2 * precision * recall) / (precision + recall) || 0;
      
      rougeScore += f1;
    }
    
    return Math.min(rougeScore / Math.min(inputs.length, gold.length), 1.0);
  }

  private async classificationV1Score(spec: Record<string, any>): Promise<number> {
    // F1 score evaluation for classification tasks
    if (spec.type !== 'classification' && spec.type !== 'label') {
      return 0.5; // Neutral score for non-classification tasks
    }

    const inputs = spec.inputs || [];
    const gold = spec.gold || [];
    
    if (inputs.length === 0 || gold.length === 0) {
      return 0.0; // No data to evaluate
    }

    // Calculate F1 score
    let truePositives = 0;
    let falsePositives = 0;
    let falseNegatives = 0;

    for (let i = 0; i < Math.min(inputs.length, gold.length); i++) {
      const predictedLabel = inputs[i].label || '';
      const trueLabel = gold[i].label || '';
      
      if (predictedLabel === trueLabel) {
        truePositives++;
      } else {
        falsePositives++;
        falseNegatives++;
      }
    }

    const precision = truePositives / (truePositives + falsePositives) || 0;
    const recall = truePositives / (truePositives + falseNegatives) || 0;
    const f1 = (2 * precision * recall) / (precision + recall) || 0;

    return f1;
  }

  private async qualityScore(spec: Record<string, any>): Promise<number> {
    // Quality assessment based on various factors
    let qualityScore = 0.5; // Base score

    // Check for required fields
    if (spec.type && spec.inputs && spec.gold) {
      qualityScore += 0.2;
    }

    // Check input quality
    const inputs = spec.inputs || [];
    if (inputs.length >= 3) {
      qualityScore += 0.1; // Minimum samples
    }

    // Check for validation criteria
    if (spec.validation) {
      qualityScore += 0.1;
      
      if (spec.validation.required_accuracy) {
        qualityScore += 0.1;
      }
    }

    // Check for diversity in inputs
    if (inputs.length > 0) {
      const uniqueLabels = new Set(inputs.map((input: any) => input.label || input.text));
      if (uniqueLabels.size > 1) {
        qualityScore += 0.1; // Diversity bonus
      }
    }

    return Math.min(qualityScore, 1.0);
  }

  private async manipulationDetectionScore(spec: Record<string, any>): Promise<number> {
    // Detect potential manipulation attempts
    const inputs = spec.inputs || [];
    const gold = spec.gold || [];
    
    let manipulationScore = 1.0; // Start with perfect score

    // Check for identical inputs (potential copy-paste)
    const inputTexts = inputs.map((input: any) => input.text || '').filter(text => text.length > 0);
    const uniqueInputs = new Set(inputTexts);
    if (uniqueInputs.size < inputTexts.length * 0.8) {
      manipulationScore -= 0.3; // Penalty for duplicate inputs
    }

    // Check for suspicious patterns
    for (const input of inputs) {
      const text = input.text || '';
      
      // Check for very short inputs
      if (text.length < 10) {
        manipulationScore -= 0.1;
      }
      
      // Check for repeated characters
      const repeatedChars = text.match(/(.)\1{4,}/g);
      if (repeatedChars) {
        manipulationScore -= 0.2;
      }
      
      // Check for random-looking text
      const randomPattern = /[a-z]{1,3}[0-9]{1,3}[a-z]{1,3}/g;
      if (randomPattern.test(text)) {
        manipulationScore -= 0.1;
      }
    }

    // Check for gold standard quality
    if (gold.length > 0) {
      const goldTexts = gold.map((g: any) => g.text || '').filter(text => text.length > 0);
      if (goldTexts.length === 0) {
        manipulationScore -= 0.2; // No gold standard
      }
    }

    return Math.max(manipulationScore, 0.0);
  }

  private calculateMedian(scores: number[]): number {
    if (scores.length === 0) return 0;
    
    const sorted = [...scores].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    
    if (sorted.length % 2 === 0) {
      return (sorted[mid - 1] + sorted[mid]) / 2;
    } else {
      return sorted[mid];
    }
  }

  private applyQualityGates(score: number, individualScores: number[]): number {
    // Apply quality gates to prevent low-quality jobs from passing
    
    // Gate 1: Minimum ensemble score
    if (score < 0.3) {
      return 0.0;
    }
    
    // Gate 2: No individual score should be too low
    const minIndividualScore = Math.min(...individualScores);
    if (minIndividualScore < 0.1) {
      return Math.max(score - 0.2, 0.0);
    }
    
    // Gate 3: Manipulation detection penalty
    const manipulationScore = individualScores[3];
    if (manipulationScore < 0.5) {
      return Math.max(score - 0.3, 0.0);
    }
    
    // Gate 4: Quality threshold
    const qualityScore = individualScores[2];
    if (qualityScore < 0.4) {
      return Math.max(score - 0.1, 0.0);
    }
    
    return score;
  }
}
