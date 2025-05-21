import data from "../oxford-5000.json";

export interface WordData {
  word: string;
  level?: string;
  category?: string;
  encounters?: number;
  status?: "new" | "learning" | "known" | "skipped";
  lastSeen?: string;
}

export interface ProcessedData {
  words: WordData[];
  levels: string[];
  categories: string[];
}

// Extract levels A1, A2, B1, B2, C1 from word data if available
const extractLevelsFromData = (): string[] => {
  const levels = new Set<string>();

  // Mock levels for demonstration, in a real app these would come from the data
  levels.add("A1");
  levels.add("A2");
  levels.add("B1");
  levels.add("B2");
  levels.add("C1");
  levels.add("C2");

  return Array.from(levels);
};

// Extract categories from word data if available
const extractCategoriesFromData = (): string[] => {
  const categories = new Set<string>();

  // Mock categories for demonstration
  categories.add("General");
  categories.add("Academic");
  categories.add("Business");
  categories.add("Travel");
  categories.add("Technology");

  return Array.from(categories);
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
      level: assignRandomLevel(), // Mock function for demonstration
      category: assignRandomCategory(), // Mock function for demonstration
    }));

    const levels = extractLevelsFromData();
    const categories = extractCategoriesFromData();

    return {
      words: enhancedWords,
      levels,
      categories,
    };
  } catch (error) {
    console.error("Error processing word data:", error);
    return { words: [], levels: [], categories: [] };
  }
};

// Helper functions for mock data
function assignRandomLevel(): string {
  const levels = ["A1", "A2", "B1", "B2", "C1", "C2"];
  return levels[Math.floor(Math.random() * levels.length)];
}

function assignRandomCategory(): string {
  const categories = [
    "General",
    "Academic",
    "Business",
    "Travel",
    "Technology",
  ];
  return categories[Math.floor(Math.random() * categories.length)];
}
