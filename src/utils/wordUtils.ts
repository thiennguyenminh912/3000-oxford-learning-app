import data from "../oxford-5000.json";
import nlp from "compromise";

export interface WordData {
  word: string;
  level?: string;
  type?: string;
  phonetics?: {
    us?: string;
    uk?: string;
  };
  encounters?: number;
  status?: "new" | "learning" | "known" | "skipped" | "focus";
  lastSeen?: string;
  vn_meaning?: string;
  eng_explanation?: string;
  example?: string | string[];
  note?: string;
}

export interface ProcessedData {
  words: WordData[];
  levels: string[];
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
}

export interface FillInTheBlankQuestion {
  question: string;
  sentence: string;
  options: string[];
  correctAnswer: string;
}

export type QuizType = "meaning" | "fillInTheBlank";

// Cache for word type explanations to avoid repeated processing
let explanationsByType: Map<string, string[]> | null = null;
// Cache for words by type to get distractors for fill-in-the-blank
let wordsByType: Map<string, string[]> | null = null;

// Initialize explanations by type
const initializeExplanationsByType = () => {
  if (explanationsByType) return explanationsByType;

  explanationsByType = new Map();
  wordsByType = new Map();

  data.forEach((word: WordData) => {
    if (word.type && word.eng_explanation) {
      const type = word.type.toLowerCase();
      if (!explanationsByType!.has(type)) {
        explanationsByType!.set(type, []);
      }
      explanationsByType!.get(type)!.push(word.eng_explanation);
    }

    if (word.type && word.word) {
      const type = word.type.toLowerCase();
      if (!wordsByType!.has(type)) {
        wordsByType!.set(type, []);
      }
      wordsByType!.get(type)!.push(word.word);
    }
  });

  return explanationsByType;
};

// Get random explanations for a specific type
const getRandomExplanations = (
  type: string,
  count: number,
  excludeExplanation?: string
): string[] => {
  const explanations = initializeExplanationsByType();
  const typeExplanations = explanations.get(type.toLowerCase()) || [];

  // Filter out the correct answer to avoid duplicates
  const availableExplanations = excludeExplanation
    ? typeExplanations.filter((exp) => exp !== excludeExplanation)
    : typeExplanations;

  // Shuffle and take the required number
  const shuffled = [...availableExplanations].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
};

// Get random words for a specific type (for fill-in-the-blank distractors)
const getRandomWords = (
  type: string,
  count: number,
  excludeWord?: string
): string[] => {
  if (!wordsByType) {
    initializeExplanationsByType();
  }

  const typeWords = wordsByType!.get(type.toLowerCase()) || [];

  // Filter out the correct word to avoid duplicates
  const availableWords = excludeWord
    ? typeWords.filter((word) => word !== excludeWord)
    : typeWords;

  // Shuffle and take the required number
  const shuffled = [...availableWords].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
};

// Generate word variations using compromise
const generateWordVariations = (word: string): string[] => {
  try {
    const doc = nlp(word);
    const variations = new Set<string>();

    // Add original word
    variations.add(word);

    // Get all conjugations/forms
    const conjugations = doc.verbs().conjugate();
    if (conjugations && conjugations.length > 0) {
      conjugations.forEach((conj) => {
        if (conj.Infinitive) variations.add(conj.Infinitive);
        if (conj.Present) variations.add(conj.Present);
        if (conj.Past) variations.add(conj.Past);
        if (conj.Gerund) variations.add(conj.Gerund);
        if (conj.PastTense) variations.add(conj.PastTense);
        if (conj.PresentTense) variations.add(conj.PresentTense);
      });
    }

    // Get noun forms
    const nouns = doc.nouns().toPlural();
    if (nouns.length > 0) {
      nouns.forEach((noun) => {
        const nounText = (noun as any).text();
        if (nounText) variations.add(nounText);
      });
    }

    // Get adjective forms
    const adjectives = doc.adjectives().toComparative();
    if (adjectives.length > 0) {
      adjectives.forEach((adj) => {
        const adjText = (adj as any).text();
        if (adjText) variations.add(adjText);
      });
    }

    return Array.from(variations);
  } catch (error) {
    console.error("Error generating word variations:", error);
    return [word];
  }
};

// Find the correct word form in the example sentence
const findWordInSentence = (
  word: string,
  sentence: string
): { foundWord: string; sentence: string } => {
  const variations = generateWordVariations(word);

  // Try to find any variation in the sentence
  for (const variation of variations) {
    const regex = new RegExp(`\\b${variation}\\b`, "gi");
    if (regex.test(sentence)) {
      // Replace the found variation with blank
      const newSentence = sentence.replace(regex, "___");
      return {
        foundWord: variation,
        sentence: newSentence,
      };
    }
  }

  // If no variation found, use the original word
  const regex = new RegExp(`\\b${word}\\b`, "gi");
  const newSentence = sentence.replace(regex, "___");
  return {
    foundWord: word,
    sentence: newSentence,
  };
};

// Create fill-in-the-blank question
const createFillInTheBlankQuestion = (
  word: WordData
): FillInTheBlankQuestion => {
  // Get examples for the word
  const examples = Array.isArray(word.example) ? word.example : [word.example];

  if (!examples || examples.length === 0 || !examples[0]) {
    // Fallback if no examples
    return {
      question: `Fill in the blank`,
      sentence: "I like this ___.",
      options: [word.word, "thing", "item", "object"],
      correctAnswer: word.word,
    };
  }

  // Pick a random example
  const randomExample = examples[Math.floor(Math.random() * examples.length)];

  // Ensure randomExample is a string
  if (typeof randomExample !== "string") {
    return {
      question: `Fill in the blank`,
      sentence: "I like this ___.",
      options: [word.word, "thing", "item", "object"],
      correctAnswer: word.word,
    };
  }

  // Find the correct word form in the sentence
  const { foundWord, sentence } = findWordInSentence(word.word, randomExample);

  // Get 3 random wrong words from the same type
  const wrongWords = getRandomWords(word.type || "noun", 3, foundWord);

  // If we don't have enough wrong words, add some generic ones
  const allOptions = [foundWord, ...wrongWords];
  while (allOptions.length < 4) {
    allOptions.push("thing");
  }

  // Shuffle the options
  const shuffledOptions = allOptions.sort(() => Math.random() - 0.5);

  return {
    question: `Fill in the blank`,
    sentence,
    options: shuffledOptions,
    correctAnswer: foundWord,
  };
};

// Create quiz question based on word data
export const createQuizQuestion = (word: WordData): QuizQuestion => {
  const question = `What is the meaning of "${word.word}"?`;
  const correctAnswer = word.eng_explanation || "No explanation available";

  // Get 3 random wrong answers from the same word type
  const wrongAnswers = getRandomExplanations(
    word.type || "noun",
    3,
    correctAnswer
  );

  // If we don't have enough wrong answers, add some generic ones
  const allOptions = [correctAnswer, ...wrongAnswers];
  while (allOptions.length < 4) {
    allOptions.push("No explanation available");
  }

  // Shuffle the options
  const shuffledOptions = allOptions.sort(() => Math.random() - 0.5);

  return {
    question,
    options: shuffledOptions,
    correctAnswer,
  };
};

// Randomly choose quiz type and create appropriate question
export const createRandomQuiz = (
  word: WordData
): QuizQuestion | FillInTheBlankQuestion => {
  const quizType: QuizType = Math.random() < 0.5 ? "meaning" : "fillInTheBlank";

  if (quizType === "meaning") {
    return createQuizQuestion(word);
  } else {
    return createFillInTheBlankQuestion(word);
  }
};

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

// Local storage functions for custom words
const CUSTOM_WORDS_KEY = "custom_words";
const WORD_NOTES_KEY = "word_notes";

export const getCustomWords = (): WordData[] => {
  try {
    const stored = localStorage.getItem(CUSTOM_WORDS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Error loading custom words:", error);
    return [];
  }
};
export const saveCustomWord = (word: WordData): void => {
  try {
    const customWords = getCustomWords();
    const existingIndex = customWords.findIndex((w) => w.word === word.word);

    if (existingIndex >= 0) {
      // Update existing word
      customWords[existingIndex] = { ...customWords[existingIndex], ...word };
    } else {
      // Add new word
      customWords.push(word);
    }

    localStorage.setItem(CUSTOM_WORDS_KEY, JSON.stringify(customWords));
  } catch (error) {
    console.error("Error saving custom word:", error);
  }
};

export const deleteCustomWord = (wordId: string): void => {
  try {
    const customWords = getCustomWords();
    const filteredWords = customWords.filter((w) => w.word !== wordId);
    localStorage.setItem(CUSTOM_WORDS_KEY, JSON.stringify(filteredWords));

    // Also remove from word notes
    const notes = getWordNotes();
    delete notes[wordId];
    localStorage.setItem(WORD_NOTES_KEY, JSON.stringify(notes));
  } catch (error) {
    console.error("Error deleting custom word:", error);
  }
};

export const updateCustomWordNote = (wordId: string, note: string): void => {
  try {
    const customWords = getCustomWords();
    const wordIndex = customWords.findIndex((w) => w.word === wordId);

    if (wordIndex >= 0) {
      customWords[wordIndex].note = note;
      localStorage.setItem(CUSTOM_WORDS_KEY, JSON.stringify(customWords));
    }
  } catch (error) {
    console.error("Error updating custom word note:", error);
  }
};

// Word notes system for all words
export const getWordNotes = (): Record<string, string> => {
  try {
    const stored = localStorage.getItem(WORD_NOTES_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error("Error loading word notes:", error);
    return {};
  }
};

export const saveWordNote = (wordId: string, note: string): void => {
  try {
    const notes = getWordNotes();
    if (note.trim()) {
      notes[wordId] = note.trim();
    } else {
      delete notes[wordId];
    }
    localStorage.setItem(WORD_NOTES_KEY, JSON.stringify(notes));
  } catch (error) {
    console.error("Error saving word note:", error);
  }
};

export const deleteWordNote = (wordId: string): void => {
  try {
    const notes = getWordNotes();
    delete notes[wordId];
    localStorage.setItem(WORD_NOTES_KEY, JSON.stringify(notes));
  } catch (error) {
    console.error("Error deleting word note:", error);
  }
};

export const normalizeNoAccent = (str: string) => {
  return str
    .normalize("NFD") // tách glyph + dấu
    .replace(/[\u0300-\u036f]/g, "") // xoá dấu tổ hợp
    .toLowerCase();
};
