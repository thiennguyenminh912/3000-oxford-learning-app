import { create } from "zustand";
import { persist } from "zustand/middleware";
import { processWordData } from "../utils/wordUtils";
import type { WordData } from "../utils/wordUtils";
import type { WordDefinition, QuizQuestion } from "../services/apiService";

interface WordStore {
  words: WordData[];
  levels: string[];
  categories: string[];
  selectedLevel: string | null;
  selectedCategory: string | null;
  searchTerm: string;
  definitionCache: Record<string, WordDefinition>;
  quizCache: Record<string, QuizQuestion>;
  isDataLoaded: boolean;

  // Actions
  loadWords: () => void;
  setSelectedLevel: (level: string | null) => void;
  setSelectedCategory: (category: string | null) => void;
  setSearchTerm: (term: string) => void;
  updateWordStatus: (wordId: string, status: WordData["status"]) => void;
  incrementEncounters: (wordId: string) => void;
  resetProgress: () => void;
  getFilteredWords: () => WordData[];
  getWordStats: () => {
    total: number;
    known: number;
    learning: number;
    percentComplete: number;
  };
  getCompletionStats: () => {
    total: number;
    completed: number;
    inProgress: number;
    percentComplete: number;
  };
  cacheDefinition: (word: string, definition: WordDefinition) => void;
  getCachedDefinition: (word: string) => WordDefinition | undefined;
  cacheQuizQuestion: (word: string, quiz: QuizQuestion) => void;
  getCachedQuizQuestion: (word: string) => QuizQuestion | undefined;
}

export const useWordStore = create<WordStore>()(
  persist(
    (set, get) => ({
      words: [],
      levels: [],
      categories: [],
      selectedLevel: null,
      selectedCategory: null,
      searchTerm: "",
      definitionCache: {},
      quizCache: {},
      isDataLoaded: false,

      loadWords: () => {
        if (get().words.length === 0) {
          const { words, levels, categories } = processWordData();
          set({ words, levels, categories, isDataLoaded: true });
        } else {
          set({ isDataLoaded: true });
        }
      },

      setSelectedLevel: (level) => {
        set({ selectedLevel: level });
      },

      setSelectedCategory: (category) => {
        set({ selectedCategory: category });
      },

      setSearchTerm: (term) => {
        set({ searchTerm: term });
      },

      updateWordStatus: (wordId, status) => {
        set((state) => ({
          words: state.words.map((word) =>
            word.word === wordId
              ? { ...word, status, lastSeen: new Date().toISOString() }
              : word
          ),
        }));
      },

      incrementEncounters: (wordId) => {
        set((state) => {
          const updatedWords = state.words.map((word) => {
            if (word.word === wordId) {
              const newEncounters = (word.encounters || 0) + 1;
              const newStatus =
                newEncounters >= 22
                  ? "known"
                  : word.status === "new"
                  ? "learning"
                  : word.status;

              return {
                ...word,
                encounters: newEncounters,
                status: newStatus,
                lastSeen: new Date().toISOString(),
              };
            }
            return word;
          });

          return { words: updatedWords };
        });
      },

      resetProgress: () => {
        set((state) => ({
          words: state.words.map((word) => ({
            ...word,
            encounters: 0,
            status: "new",
            lastSeen: undefined,
          })),
          definitionCache: {},
          quizCache: {},
        }));
      },

      getFilteredWords: () => {
        const { words, selectedLevel, selectedCategory, searchTerm } = get();

        return words.filter((word) => {
          const levelMatch = !selectedLevel || word.level === selectedLevel;
          const categoryMatch =
            !selectedCategory || word.category === selectedCategory;
          const searchMatch =
            searchTerm &&
            !word.word.toLowerCase().includes(searchTerm.toLowerCase());
          return levelMatch && categoryMatch && !searchMatch;
        });
      },

      getWordStats: () => {
        const filteredWords = get().getFilteredWords();
        const total = filteredWords.length;
        const known = filteredWords.filter((w) => w.status === "known").length;
        const learning = filteredWords.filter(
          (w) => w.status === "learning"
        ).length;
        const percentComplete =
          total > 0 ? Math.round((known / total) * 100) : 0;

        return {
          total,
          known,
          learning,
          percentComplete,
        };
      },

      getCompletionStats: () => {
        const allWords = get().words;
        const total = allWords.length;
        const completed = allWords.filter((w) => w.status === "known").length;
        const inProgress = allWords.filter(
          (w) => w.status === "learning"
        ).length;
        const percentComplete =
          total > 0 ? Math.round((completed / total) * 100) : 0;

        return {
          total,
          completed,
          inProgress,
          percentComplete,
        };
      },

      cacheDefinition: (word, definition) => {
        set((state) => ({
          definitionCache: {
            ...state.definitionCache,
            [word]: definition,
          },
        }));
      },

      getCachedDefinition: (word) => {
        return get().definitionCache[word];
      },

      cacheQuizQuestion: (word, quiz) => {
        set((state) => ({
          quizCache: {
            ...state.quizCache,
            [word]: quiz,
          },
        }));
      },

      getCachedQuizQuestion: (word) => {
        return get().quizCache[word];
      },
    }),
    {
      name: "oxford-5000-storage",
      partialize: (state) => ({
        words: state.words,
        selectedLevel: state.selectedLevel,
        selectedCategory: state.selectedCategory,
        definitionCache: state.definitionCache,
        quizCache: state.quizCache,
        levels: state.levels,
        categories: state.categories,
      }),
    }
  )
);
