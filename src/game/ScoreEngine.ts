export interface ScoreCalculationResult {
  earnedScore: number;
  newScore: number;
  combo: number;
}

export class ScoreEngine {
  public static calculateFoundScore(
    baseScore: number,
    currentCombo: number,
    currentScore: number
  ): ScoreCalculationResult {
    const comboMultiplier = Math.max(1, currentCombo);
    const comboBonus = (comboMultiplier - 1) * 50;
    const earnedScore = baseScore * comboMultiplier + comboBonus;

    return {
      earnedScore,
      newScore: Math.max(0, currentScore + earnedScore),
      combo: comboMultiplier,
    };
  }

  public static calculateMistakePenalty(currentScore: number): number {
    return Math.max(0, currentScore - 20);
  }

  public static calculateHintPenalty(currentScore: number, hintLevel: number): number {
    const penalty = hintLevel === 1 ? 50 : hintLevel === 2 ? 100 : 150;
    return Math.max(0, currentScore - penalty);
  }

  public static calculateCompletionBonus(
    remainingTime: number,
    mistakes: number,
    hintsUsed: number
  ): { timeBonus: number; stars: number } {
    const timeBonus = Math.max(0, Math.floor(remainingTime * 4));

    let stars = 1;
    if (mistakes <= 2 && hintsUsed <= 1 && remainingTime > 60) {
      stars = 3;
    } else if (mistakes <= 5 && hintsUsed <= 2) {
      stars = 2;
    }

    return { timeBonus, stars };
  }
}
