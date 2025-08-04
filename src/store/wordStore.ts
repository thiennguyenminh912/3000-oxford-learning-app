import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  processWordData,
  getCustomWords,
  getWordNotes,
} from "../utils/wordUtils";
import type { WordData } from "../utils/wordUtils";
import type { WordDefinition, QuizQuestion } from "../services/apiService";
import { REQUIRED_WORD_ENCOUNTERS } from "../utils/constants";

interface WordStore {
  words: WordData[];
  levels: string[];
  selectedLevel: string | null;
  selectedLearningLevels: string[]; // Multiple select for learning filter
  selectedLearningStatuses: string[]; // Multiple select for learning status filter
  searchTerm: string;
  selectedStatus: string | null;
  definitionCache: Record<string, WordDefinition>;
  quizCache: Record<string, QuizQuestion>;
  isDataLoaded: boolean;
  reviewQueue: string[]; // Queue of words to review later
  sessionLength: number;
  useSmart: boolean;
  // Actions
  loadWords: () => void;
  setSelectedLevel: (level: string | null) => void;
  setSelectedLearningLevels: (levels: string[]) => void;
  setSelectedLearningStatuses: (statuses: string[]) => void;
  setSelectedStatus: (status: string | null) => void;
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
  getSmartLearningWords: (sessionLength: number) => WordData[];
  addToReviewQueue: (wordId: string) => void;
  cacheDefinition: (word: string, definition: WordDefinition) => void;
  getCachedDefinition: (word: string) => WordDefinition | undefined;
  cacheQuizQuestion: (word: string, quiz: QuizQuestion) => void;
  getCachedQuizQuestion: (word: string) => QuizQuestion | undefined;
  setSessionLength: (length: number) => void;
  setUseSmart: (useSmart: boolean) => void;
}

export const useWordStore = create<WordStore>()(
  persist(
    (set, get) => ({
      words: [],
      levels: ["A1", "A2", "B1", "B2", "C1", "C2"],
      selectedLevel: null,
      selectedLearningLevels: [], // Multiple select for learning filter
      selectedLearningStatuses: [], // Multiple select for learning status filter
      selectedStatus: null,
      searchTerm: "",
      definitionCache: {},
      quizCache: {},
      isDataLoaded: false,
      reviewQueue: [],
      sessionLength: 20,
      useSmart: true,
      loadWords: () => {
        if (get().words.length === 0) {
          const { words, levels } = processWordData();

          // Load custom words from localStorage
          const customWords = getCustomWords();

          // Load word notes from localStorage
          const wordNotes = getWordNotes();

          // Combine words, with custom words taking precedence
          const allWords = [...words, ...customWords];
          const uniqueWords = allWords.filter(
            (word, index, self) =>
              index === self.findIndex((w) => w.word === word.word)
          );

          // Merge notes with words
          const wordsWithNotes = uniqueWords.map((word) => ({
            ...word,
            note: wordNotes[word.word] || word.note,
          }));

          set({ words: wordsWithNotes, levels, isDataLoaded: true });
        } else {
          // Reload custom words even if words are already loaded
          const customWords = getCustomWords();
          const wordNotes = getWordNotes();
          const currentWords = get().words;

          // Add any new custom words that aren't already in the list
          const newCustomWords = customWords.filter(
            (customWord) =>
              !currentWords.some((word) => word.word === customWord.word)
          );

          if (newCustomWords.length > 0) {
            const updatedWords = [...currentWords, ...newCustomWords];
            // Merge notes with updated words
            const wordsWithNotes = updatedWords.map((word) => ({
              ...word,
              note: wordNotes[word.word] || word.note,
            }));
            set({ words: wordsWithNotes });
          } else {
            // Update notes for existing words
            const wordsWithNotes = currentWords.map((word) => ({
              ...word,
              note: wordNotes[word.word] || word.note,
            }));
            set({ words: wordsWithNotes });
          }

          set({ isDataLoaded: true });
        }
      },

      setSelectedLevel: (level) => {
        set({ selectedLevel: level });
      },

      setSelectedLearningLevels: (levels) => {
        set({ selectedLearningLevels: levels });
      },

      setSelectedLearningStatuses: (statuses) => {
        set({ selectedLearningStatuses: statuses });
      },

      setSelectedStatus: (status) => {
        set({ selectedStatus: status });
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

        // Nếu từ chưa thuộc, thêm vào hàng đợi ôn tập
        if (status === "learning") {
          get().addToReviewQueue(wordId);
        }
      },

      incrementEncounters: (wordId) => {
        set((state) => {
          const updatedWords = state.words.map((word) => {
            if (word.word === wordId) {
              const newEncounters = (word.encounters || 0) + 1;
              const newStatus =
                newEncounters >= REQUIRED_WORD_ENCOUNTERS
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

        // Thêm từ vào hàng đợi ôn tập nếu người dùng vẫn chưa thuộc
        const word = get().words.find((w) => w.word === wordId);
        if (word && (word.encounters || 0) < REQUIRED_WORD_ENCOUNTERS) {
          get().addToReviewQueue(wordId);
        }
      },

      addToReviewQueue: (wordId) => {
        set((state) => {
          // Loại bỏ từ khỏi queue nếu đã tồn tại
          const filteredQueue = state.reviewQueue.filter((id) => id !== wordId);

          // Thêm từ vào cuối hàng đợi
          return {
            reviewQueue: [...filteredQueue, wordId],
          };
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
          reviewQueue: [], // Reset review queue
        }));
      },

      getFilteredWords: () => {
        const state = get();
        let filteredWords = [...state.words];

        // Apply level filter
        if (state.selectedLevel) {
          filteredWords = filteredWords.filter(
            (word) => word.level === state.selectedLevel
          );
        }

        // Apply status filter
        if (state.selectedStatus) {
          filteredWords = filteredWords.filter(
            (word) => word.status === state.selectedStatus
          );
        }

        // Apply search filter
        if (state.searchTerm) {
          const searchLower = state.searchTerm.toLowerCase();
          filteredWords = filteredWords.filter(
            (word) =>
              word.word.toLowerCase().includes(searchLower) ||
              word.vn_meaning?.toLowerCase().includes(searchLower) ||
              word.eng_explanation?.toLowerCase().includes(searchLower)
          );
        }

        return filteredWords;
      },

      getSmartLearningWords: (sessionLength: number) => {
        const state = get();
        let allWords = [...state.words];

        // Apply learning level filters
        if (state.selectedLearningLevels.length > 0) {
          allWords = allWords.filter((word) =>
            state.selectedLearningLevels.includes(word.level || "")
          );
        }

        // Apply learning status filters
        if (state.selectedLearningStatuses.length > 0) {
          allWords = allWords.filter((word) =>
            state.selectedLearningStatuses.includes(word.status || "new")
          );
        }

        // Filter out known and skipped words for learning
        allWords = allWords.filter(
          (word) => word.status !== "known" && word.status !== "skipped"
        );

        // Sort by encounters (fewer encounters first)
        allWords.sort((a, b) => {
          const aEncounters = a.encounters || 0;
          const bEncounters = b.encounters || 0;
          return aEncounters - bEncounters;
        });

        // Take the first sessionLength words
        return allWords.slice(0, sessionLength);
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

      setSessionLength: (length) => {
        set({ sessionLength: length });
      },

      setUseSmart: (useSmart) => {
        set({ useSmart });
      },
    }),
    {
      name: "oxford-5000-storage",
      partialize: (state) => ({
        words: state.words,
        selectedLevel: state.selectedLevel,
        selectedLearningLevels: state.selectedLearningLevels,
        selectedLearningStatuses: state.selectedLearningStatuses,
        selectedStatus: state.selectedStatus,
        definitionCache: state.definitionCache,
        quizCache: state.quizCache,
        levels: state.levels,
        reviewQueue: state.reviewQueue,
        sessionLength: state.sessionLength,
        useSmart: state.useSmart,
      }),
    }
  )
);
