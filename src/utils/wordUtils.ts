import data from "../oxford-5000.json";

export interface WordData {
  word: string;
  level?: string;
  type?: string;
  phonetics?: {
    us?: string;
    uk?: string;
  };
  encounters?: number;
  status?: "new" | "learning" | "known" | "skipped";
  lastSeen?: string;
}

export interface ProcessedData {
  words: WordData[];
  levels: string[];
}

// Extract levels A1, A2, B1, B2, C1 from word data
const extractLevelsFromData = (wordList: WordData[]): string[] => {
  const levels = new Set<string>();

  wordList.forEach((word) => {
    if (word.level) {
      levels.add(word.level);
    }
  });

  return Array.from(levels).sort();
};

// Process the word data
export const processWordData = (): ProcessedData => {
  try {
    // Type assertion for the imported JSON data
    const wordList = data as WordData[];

    // Enhance each word with additional properties
    const enhancedWords = wordList.map((word) => ({
      ...word,
      encounters: 0,
      status: "new" as const,
    }));

    const levels = extractLevelsFromData(wordList);

    return {
      words: enhancedWords,
      levels,
    };
  } catch (error) {
    console.error("Error processing word data:", error);
    return { words: [], levels: [] };
  }
};
