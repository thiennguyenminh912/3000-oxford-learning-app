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
  reviewQueue: string[]; // Queue of words to review later

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
  getSmartLearningWords: (sessionLength: number) => WordData[];
  addToReviewQueue: (wordId: string) => void;
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
      reviewQueue: [],

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

        // Thêm từ vào hàng đợi ôn tập nếu người dùng vẫn chưa thuộc
        const word = get().words.find((w) => w.word === wordId);
        if (word && (word.encounters || 0) < 22) {
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

      // Triển khai thuật toán thông minh chọn từ
      getSmartLearningWords: (sessionLength) => {
        const { words, selectedLevel, selectedCategory, reviewQueue } = get();

        // Lọc danh sách từ theo level và category nếu đã chọn
        const filteredWords = words.filter((word) => {
          const levelMatch = !selectedLevel || word.level === selectedLevel;
          const categoryMatch =
            !selectedCategory || word.category === selectedCategory;
          return levelMatch && categoryMatch;
        });

        // Chia thành các nhóm: từ mới, từ cần ôn tập, từ đã biết
        const newWords = filteredWords.filter(
          (w) => w.status === "new" || !w.status
        );
        const learningWords = filteredWords.filter(
          (w) => w.status === "learning"
        );

        // Tìm những từ cần ôn tập trong hàng đợi
        const reviewWords = reviewQueue
          .map((wordId) => filteredWords.find((w) => w.word === wordId))
          .filter((word): word is WordData => !!word && word.status !== "known")
          // Sắp xếp theo thời gian, ưu tiên từ chưa xem lâu nhất
          .sort((a, b) => {
            const aTime = a.lastSeen ? new Date(a.lastSeen).getTime() : 0;
            const bTime = b.lastSeen ? new Date(b.lastSeen).getTime() : 0;
            return aTime - bTime;
          });

        // Tạo danh sách từ cho phiên học này
        const sessionWords: WordData[] = [];

        // Tính tỉ lệ: 60% từ mới, 40% từ ôn tập
        const newWordsCount = Math.ceil(sessionLength * 0.6);
        const reviewWordsCount = sessionLength - newWordsCount;

        // Thêm từ mới vào, chọn ngẫu nhiên
        const shuffledNewWords = [...newWords].sort(() => Math.random() - 0.5);
        for (
          let i = 0;
          i < Math.min(newWordsCount, shuffledNewWords.length);
          i++
        ) {
          sessionWords.push(shuffledNewWords[i]);
        }

        // Thêm từ cần ôn tập vào
        let remainingReviewSlots = reviewWordsCount;

        // Trước tiên lấy từ trong review queue
        for (
          let i = 0;
          i < Math.min(remainingReviewSlots, reviewWords.length);
          i++
        ) {
          if (!sessionWords.some((word) => word.word === reviewWords[i].word)) {
            sessionWords.push(reviewWords[i]);
            remainingReviewSlots--;
          }
        }

        // Sau đó lấy từ những từ đang học nếu còn slot
        if (remainingReviewSlots > 0) {
          const shuffledLearningWords = [...learningWords]
            .filter((word) => !sessionWords.some((w) => w.word === word.word))
            .sort(() => Math.random() - 0.5);

          for (
            let i = 0;
            i < Math.min(remainingReviewSlots, shuffledLearningWords.length);
            i++
          ) {
            sessionWords.push(shuffledLearningWords[i]);
          }
        }

        // Nếu vẫn chưa đủ, bổ sung thêm từ mới
        if (sessionWords.length < sessionLength) {
          const remainingNewWords = shuffledNewWords.filter(
            (word) => !sessionWords.some((w) => w.word === word.word)
          );

          for (
            let i = 0;
            i <
            Math.min(
              sessionLength - sessionWords.length,
              remainingNewWords.length
            );
            i++
          ) {
            sessionWords.push(remainingNewWords[i]);
          }
        }

        // Shuffle lại toàn bộ danh sách từ để không học theo thứ tự cố định
        return sessionWords.sort(() => Math.random() - 0.5);
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
      name: "oxford-4999-storage",
      partialize: (state) => ({
        words: state.words,
        selectedLevel: state.selectedLevel,
        selectedCategory: state.selectedCategory,
        definitionCache: state.definitionCache,
        quizCache: state.quizCache,
        levels: state.levels,
        categories: state.categories,
        reviewQueue: state.reviewQueue,
      }),
    }
  )
);
