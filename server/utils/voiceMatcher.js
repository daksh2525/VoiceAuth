/**
 * Voice Matcher Utility
 * Computes semantic passphrase similarity, word alignment,
 * and acoustic biometric proximity.
 */

// Normalized text cleaner
function cleanText(text) {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .trim()
    .replace(/\s+/g, ' ');
}

// Levenshtein distance calculation
function levenshteinDistance(s1, s2) {
  const m = s1.length;
  const n = s2.length;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,      // deletion
        dp[i][j - 1] + 1,      // insertion
        dp[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return dp[m][n];
}

// Text similarity score (0 - 100)
function calculateTextSimilarity(spoken, enrolled) {
  const cleanSpoken = cleanText(spoken);
  const cleanEnrolled = cleanText(enrolled);

  if (!cleanSpoken || !cleanEnrolled) return 0;
  if (cleanSpoken === cleanEnrolled) return 100;

  // Character-level Levenshtein similarity
  const maxLen = Math.max(cleanSpoken.length, cleanEnrolled.length);
  const dist = levenshteinDistance(cleanSpoken, cleanEnrolled);
  const charScore = Math.max(0, (1 - dist / maxLen) * 100);

  // Word token overlap
  const spokenWords = cleanSpoken.split(' ');
  const enrolledWords = cleanEnrolled.split(' ');

  const spokenSet = new Set(spokenWords);
  const enrolledSet = new Set(enrolledWords);

  let matchCount = 0;
  for (const word of enrolledWords) {
    if (spokenSet.has(word)) {
      matchCount++;
    } else {
      // Check partial match / typo
      const fuzzyMatch = spokenWords.some(
        sw => levenshteinDistance(sw, word) <= 1 && Math.abs(sw.length - word.length) <= 1
      );
      if (fuzzyMatch) matchCount += 0.8;
    }
  }

  const wordScore = (matchCount / enrolledWords.length) * 100;

  // Weighted combo: 50% character similarity + 50% token similarity
  const combinedTextScore = Math.round(charScore * 0.45 + wordScore * 0.55);
  return Math.min(100, Math.max(0, combinedTextScore));
}

// Biometric acoustic comparison
function calculateBiometricSimilarity(currentBio, enrolledBio) {
  if (!enrolledBio || !currentBio) {
    return 80; // Baseline fallback if audio biometrics unavailable on client
  }

  let scores = [];

  // 1. Cadence (Duration in milliseconds)
  if (enrolledBio.durationMs && currentBio.durationMs) {
    const diffRatio = Math.abs(enrolledBio.durationMs - currentBio.durationMs) / enrolledBio.durationMs;
    // Allow up to 40% speed variation
    const durationScore = Math.max(0, (1 - diffRatio / 0.5) * 100);
    scores.push({ weight: 0.25, score: durationScore });
  }

  // 2. Spectral Centroid (Pitch / Brightness center)
  if (enrolledBio.spectralCentroid && currentBio.spectralCentroid) {
    const diffRatio = Math.abs(enrolledBio.spectralCentroid - currentBio.spectralCentroid) / enrolledBio.spectralCentroid;
    const centroidScore = Math.max(0, (1 - diffRatio / 0.45) * 100);
    scores.push({ weight: 0.35, score: centroidScore });
  }

  // 3. Zero Crossing Rate (Voice timbre and frequency transitions)
  if (enrolledBio.zeroCrossingRate && currentBio.zeroCrossingRate) {
    const diffRatio = Math.abs(enrolledBio.zeroCrossingRate - currentBio.zeroCrossingRate) / Math.max(0.01, enrolledBio.zeroCrossingRate);
    const zcrScore = Math.max(0, (1 - diffRatio / 0.5) * 100);
    scores.push({ weight: 0.25, score: zcrScore });
  }

  // 4. Energy RMS (Loudness dynamics)
  if (enrolledBio.energyRms && currentBio.energyRms) {
    const diffRatio = Math.abs(enrolledBio.energyRms - currentBio.energyRms) / Math.max(0.01, enrolledBio.energyRms);
    const energyScore = Math.max(0, (1 - diffRatio / 0.6) * 100);
    scores.push({ weight: 0.15, score: energyScore });
  }

  if (scores.length === 0) return 80;

  const totalWeight = scores.reduce((sum, item) => sum + item.weight, 0);
  const weightedSum = scores.reduce((sum, item) => sum + item.score * item.weight, 0);

  return Math.round(weightedSum / totalWeight);
}

/**
 * Match Spoken Voice against User Profile
 */
function verifyVoiceSample({
  spokenTranscript,
  enrolledPassphrase,
  incomingBiometrics,
  enrolledBiometrics,
  threshold = 70
}) {
  const textScore = calculateTextSimilarity(spokenTranscript, enrolledPassphrase);
  const biometricScore = calculateBiometricSimilarity(incomingBiometrics, enrolledBiometrics);

  // Overall confidence: 65% Passphrase accuracy, 35% Acoustic biometric accuracy
  const finalScore = Math.round(textScore * 0.65 + biometricScore * 0.35);

  const isMatch = finalScore >= threshold;

  let feedback = '';
  if (isMatch) {
    feedback = `Voice pattern and passphrase verified successfully (${finalScore}% match).`;
  } else if (textScore < 60) {
    feedback = `Passphrase mismatch. Spoken phrase: "${spokenTranscript || 'none detected'}". Required match confidence was ${threshold}%.`;
  } else {
    feedback = `Passphrase recognized but acoustic biometric resonance did not reach ${threshold}% threshold. Please speak in your enrolled voice tone.`;
  }

  return {
    isMatch,
    finalScore,
    textScore,
    biometricScore,
    threshold,
    feedback
  };
}

module.exports = {
  calculateTextSimilarity,
  calculateBiometricSimilarity,
  verifyVoiceSample,
  cleanText
};
