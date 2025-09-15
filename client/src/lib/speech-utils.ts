// Speech recognition utilities and pronunciation analysis

export interface PronunciationAnalysis {
  accuracy: number;
  feedback: string;
  recognizedWord: string;
  targetWord: string;
}

// Simple similarity calculation using Levenshtein distance
function levenshteinDistance(str1: string, str2: string): number {
  const matrix = [];
  const len1 = str1.length;
  const len2 = str2.length;

  for (let i = 0; i <= len2; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= len1; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= len2; i++) {
    for (let j = 1; j <= len1; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[len2][len1];
}

// Calculate pronunciation accuracy
export function calculatePronunciationAccuracy(target: string, recognized: string): number {
  if (!target || !recognized) return 0;

  const targetLower = target.toLowerCase().trim();
  const recognizedLower = recognized.toLowerCase().trim();
  
  if (targetLower === recognizedLower) return 100;

  const maxLength = Math.max(targetLower.length, recognizedLower.length);
  const distance = levenshteinDistance(targetLower, recognizedLower);
  const accuracy = Math.max(0, (1 - distance / maxLength) * 100);

  return Math.round(accuracy);
}

// Generate pronunciation feedback
export function generatePronunciationFeedback(
  target: string, 
  recognized: string, 
  accuracy: number
): string {
  if (accuracy >= 90) {
    return "素晴らしい発音です！";
  } else if (accuracy >= 70) {
    return "良い発音です。もう少し練習してみましょう。";
  } else if (accuracy >= 50) {
    const targetLower = target.toLowerCase();
    const recognizedLower = recognized.toLowerCase();
    
    // Try to identify common pronunciation issues
    if (targetLower.includes('th') && !recognizedLower.includes('th')) {
      return '"th"の音に注意してください。舌の位置を意識しましょう。';
    } else if (targetLower.includes('r') && recognizedLower.includes('l')) {
      return 'RとLの発音を区別してください。Rは舌を丸めます。';
    } else if (targetLower.includes('l') && recognizedLower.includes('r')) {
      return 'LとRの発音を区別してください。Lは舌先を上の歯茎につけます。';
    } else {
      return "発音をもう一度確認してみてください。ゆっくりと話してみましょう。";
    }
  } else {
    return "もう一度挑戦してみましょう。音声をよく聞いて真似してみてください。";
  }
}

// Analyze pronunciation and return detailed results
export function analyzePronunciation(target: string, recognized: string): PronunciationAnalysis {
  const accuracy = calculatePronunciationAccuracy(target, recognized);
  const feedback = generatePronunciationFeedback(target, recognized, accuracy);

  return {
    accuracy,
    feedback,
    recognizedWord: recognized,
    targetWord: target,
  };
}

// Language code mappings for speech synthesis
export const speechLanguageCodes = {
  en: 'en-US',
  ja: 'ja-JP',
  ko: 'ko-KR',
  fr: 'fr-FR',
  zh: 'zh-CN',
} as const;

// Get appropriate language code for speech synthesis
export function getSpeechLanguageCode(language: string): string {
  return speechLanguageCodes[language as keyof typeof speechLanguageCodes] || 'en-US';
}

// Text cleaning for better speech recognition
export function cleanTextForSpeech(text: string): string {
  return text
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()
    .toLowerCase();
}
