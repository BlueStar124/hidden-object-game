/** Points: finds (with combo), penalties, and the bonus & stars for closing a case. */

export interface FoundScore {
  earnedScore: number;
  newScore: number;
  combo: number;
}

/** Finds in quick succession multiply: ×2, ×3… plus 50 points per step of the combo. */
export function foundScore(baseScore: number, currentCombo: number, currentScore: number): FoundScore {
  const comboMultiplier = Math.max(1, currentCombo);
  const comboBonus = (comboMultiplier - 1) * 50;
  const earnedScore = baseScore * comboMultiplier + comboBonus;

  return {
    earnedScore,
    newScore: Math.max(0, currentScore + earnedScore),
    combo: comboMultiplier,
  };
}

/** A wrong guess costs 20 points. */
export function mistakePenalty(currentScore: number): number {
  return Math.max(0, currentScore - 20);
}

/** Each hint tier costs more: 50, 100, 150 points. */
export function hintPenalty(currentScore: number, hintLevel: number): number {
  const penalty = hintLevel === 1 ? 50 : hintLevel === 2 ? 100 : 150;
  return Math.max(0, currentScore - penalty);
}

/** Closing the case: 4 points per second left, and up to three stars. */
export function completionBonus(
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
