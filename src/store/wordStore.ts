import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  processWordData,
  getCustomWords,
  getWordNotes,
  normalizeNoAccent,
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
  removeWord: (wordId: string) => void;
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

          // Load last_updated from localStorage
          const lastUpdated = JSON.parse(
            localStorage.getItem("word_last_updated") || "{}"
          );

          // Combine words, with custom words taking precedence
          const allWords = [...words, ...customWords];
          const uniqueWords = allWords.filter(
            (word, index, self) =>
              index === self.findIndex((w) => w.word === word.word)
          );

          // Merge notes and last_updated with words
          const wordsWithNotes = uniqueWords.map((word) => ({
            ...word,
            note: wordNotes[word.word] || word.note,
            last_updated: lastUpdated[word.word] || word.last_updated,
          }));

          set({ words: wordsWithNotes, levels, isDataLoaded: true });
        } else {
          // Reload custom words even if words are already loaded
          const customWords = getCustomWords();
          const wordNotes = getWordNotes();
          const lastUpdated = JSON.parse(
            localStorage.getItem("word_last_updated") || "{}"
          );
          const currentWords = get().words;

          // Add any new custom words that aren't already in the list
          const newCustomWords = customWords.filter(
            (customWord) =>
              !currentWords.some((word) => word.word === customWord.word)
          );

          if (newCustomWords.length > 0) {
            const updatedWords = [...currentWords, ...newCustomWords];
            // Merge notes and last_updated with updated words
            const wordsWithNotes = updatedWords.map((word) => ({
              ...word,
              note: wordNotes[word.word] || word.note,
              last_updated: lastUpdated[word.word] || word.last_updated,
            }));
            set({ words: wordsWithNotes });
          } else {
            // Update notes and last_updated for existing words
            const wordsWithNotes = currentWords.map((word) => ({
              ...word,
              note: wordNotes[word.word] || word.note,
              last_updated: lastUpdated[word.word] || word.last_updated,
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
              ? {
                  ...word,
                  status,
                  lastSeen: new Date().toISOString(),
                  last_updated: new Date().toISOString(),
                }
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
              normalizeNoAccent(word.word).includes(
                normalizeNoAccent(searchLower)
              ) ||
              normalizeNoAccent(word.vn_meaning || "").includes(
                normalizeNoAccent(searchLower)
              )
          );
        }

        return filteredWords;
      },

      getSmartLearningWords: (sessionLength) => {
        const {
          selectedLearningLevels,
          selectedLearningStatuses,
          reviewQueue,
        } = get();

        const state = get();
        const words = [...state.words];

        console.log("words", words);

        // Lọc danh sách từ theo learning levels và statuses nếu đã chọn
        const filteredWords = words.filter((word) => {
          // Level filter
          const levelMatch =
            selectedLearningLevels.length === 0 ||
            selectedLearningLevels.includes(word.level as string) ||
            !word.level;

          // Status filter
          const statusMatch =
            selectedLearningStatuses.length === 0 ||
            selectedLearningStatuses.includes(word.status || "new");

          return levelMatch && statusMatch;
        });

        // Chia thành các nhóm: từ mới, từ cần ôn tập, từ đã biết
        const newWords = filteredWords.filter(
          (w) => w.status === "new" || !w.status
        );
        const learningWords = filteredWords.filter(
          (w) => w.status === "learning"
        );
        const focusWords = filteredWords.filter((w) => w.status === "focus");

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

        // Tính tỉ lệ: 50% từ mới, 30% từ focus, 20% từ ôn tập
        const newWordsCount = Math.ceil(sessionLength * 0.5);
        const focusWordsCount = Math.ceil(sessionLength * 0.3);
        const reviewWordsCount =
          sessionLength - newWordsCount - focusWordsCount;

        // Thêm từ mới vào, chọn ngẫu nhiên
        const shuffledNewWords = [...newWords].sort(() => Math.random() - 0.5);
        for (
          let i = 0;
          i < Math.min(newWordsCount, shuffledNewWords.length);
          i++
        ) {
          sessionWords.push(shuffledNewWords[i]);
        }

        // Thêm từ focus vào
        const shuffledFocusWords = [...focusWords].sort(
          () => Math.random() - 0.5
        );
        for (
          let i = 0;
          i < Math.min(focusWordsCount, shuffledFocusWords.length);
          i++
        ) {
          if (
            !sessionWords.some(
              (word) => word.word === shuffledFocusWords[i].word
            )
          ) {
            sessionWords.push(shuffledFocusWords[i]);
          }
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

      setSessionLength: (length) => {
        set({ sessionLength: length });
      },

      setUseSmart: (useSmart) => {
        set({ useSmart });
      },

      removeWord: (wordId) => {
        set((state) => ({
          words: state.words.filter((word) => word.word !== wordId),
        }));

        // Force persist the updated state
        const currentState = get();
        localStorage.setItem(
          "oxford-5000-storage",
          JSON.stringify({
            words: currentState.words,
            selectedLevel: currentState.selectedLevel,
            selectedLearningLevels: currentState.selectedLearningLevels,
            selectedLearningStatuses: currentState.selectedLearningStatuses,
            selectedStatus: currentState.selectedStatus,
            definitionCache: currentState.definitionCache,
            quizCache: currentState.quizCache,
            levels: currentState.levels,
            reviewQueue: currentState.reviewQueue,
            sessionLength: currentState.sessionLength,
            useSmart: currentState.useSmart,
          })
        );
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
