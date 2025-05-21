import { useState, useEffect, useRef } from "react";
import { useWordStore } from "../store/wordStore";
import { Flashcard } from "../components/Flashcard";
import { QuizGame } from "../components/QuizGame";
import { SpellingChallenge } from "../components/SpellingChallenge";
import { PronunciationPractice } from "../components/PronunciationPractice";
import type { WordData } from "../utils/wordUtils";
import {
  generateQuizQuestion,
  getWordDefinition,
} from "../services/apiService";
import { useVoices } from "../hooks/useVoices";

type LearningMode = "flashcard" | "quiz" | "spelling" | "pronunciation";

export const LearnPage = () => {
  const {
    getFilteredWords,
    incrementEncounters,
    updateWordStatus,
    selectedLevel,
    selectedCategory,
  } = useWordStore();

  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [learningMode, setLearningMode] = useState<LearningMode>("flashcard");
  const [availableWords, setAvailableWords] = useState<WordData[]>([]);
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [sessionLength, setSessionLength] = useState(10);
  const [isPreloading, setIsPreloading] = useState(false);
  const previousWordIndexRef = useRef<number>(0);
  const previousModeRef = useRef<LearningMode>("flashcard");
  const lastSpeakTimeRef = useRef<number>(0);
  const { speakWord, stopSpeaking } = useVoices();

  useEffect(() => {
    const words = getFilteredWords()
      .filter((word) => word.status !== "known" && word.status !== "skipped")
      .sort((a, b) => {
        // Prioritize words with fewer encounters
        const aEncounters = a.encounters || 0;
        const bEncounters = b.encounters || 0;
        return aEncounters - bEncounters;
      });

    setAvailableWords(words);
    setCurrentWordIndex(0);
    setSessionCompleted(false);
  }, [getFilteredWords, selectedLevel, selectedCategory]);

  // Tự động đọc từ mới khi chuyển từ
  useEffect(() => {
    // Đảm bảo chỉ đọc khi chuyển từ mới, không đọc khi khởi tạo
    if (
      currentWordIndex !== previousWordIndexRef.current &&
      availableWords.length > 0
    ) {
      const currentWord = availableWords[currentWordIndex];
      if (currentWord) {
        // Hủy bỏ âm thanh đang phát nếu có
        stopSpeaking();

        // Đọc từ mới sau một khoảng thời gian nhỏ
        setTimeout(() => {
          speakWord(currentWord.word);
          lastSpeakTimeRef.current = Date.now();
        }, 100);
      }
    }

    // Cập nhật giá trị tham chiếu để theo dõi thay đổi
    previousWordIndexRef.current = currentWordIndex;
  }, [currentWordIndex, availableWords, speakWord, stopSpeaking]);

  // Thêm effect để preload dữ liệu cho từ tiếp theo
  useEffect(() => {
    // Chỉ preload nếu:
    // 1. Đang ở chế độ quiz hoặc flashcard
    // 2. Chưa hoàn thành phiên học
    // 3. Có từ tiếp theo để preload
    // 4. Không đang trong quá trình preload
    const shouldPreload =
      (learningMode === "quiz" || learningMode === "flashcard") &&
      !sessionCompleted &&
      currentWordIndex <
        Math.min(sessionLength - 1, availableWords.length - 1) &&
      !isPreloading;

    if (shouldPreload) {
      const preloadNextWordData = async () => {
        try {
          setIsPreloading(true);
          const nextWordIndex = currentWordIndex + 1;
          const nextWord = availableWords[nextWordIndex];

          if (nextWord) {
            // Preload khác nhau dựa trên chế độ học
            if (learningMode === "quiz") {
              console.log(`Preloading quiz for next word: ${nextWord.word}`);
              await generateQuizQuestion(nextWord);
            } else if (learningMode === "flashcard") {
              console.log(
                `Preloading definition for next word: ${nextWord.word}`
              );
              await getWordDefinition(nextWord);
            }
          }
        } catch (error) {
          console.error("Error preloading next word data:", error);
        } finally {
          setIsPreloading(false);
        }
      };

      preloadNextWordData();
    }
  }, [
    currentWordIndex,
    learningMode,
    sessionCompleted,
    availableWords,
    sessionLength,
    isPreloading,
  ]);

  const handleSessionLengthChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setSessionLength(Number(e.target.value));
  };

  const handleModeChange = (mode: LearningMode) => {
    // Chỉ cập nhật nếu mode thay đổi
    if (mode !== learningMode) {
      setLearningMode(mode);

      // Khi chuyển sang chế độ quiz, preload quiz cho từ hiện tại
      if (mode === "quiz" && availableWords.length > 0) {
        const currentWord = availableWords[currentWordIndex];
        generateQuizQuestion(currentWord).catch((error) =>
          console.error("Error preloading current word quiz:", error)
        );

        // Nếu có từ tiếp theo, preload luôn
        if (
          currentWordIndex <
          Math.min(sessionLength - 1, availableWords.length - 1)
        ) {
          const nextWord = availableWords[currentWordIndex + 1];
          generateQuizQuestion(nextWord).catch((error) =>
            console.error("Error preloading next word quiz:", error)
          );
        }
      }

      // Tương tự cho chế độ flashcard
      if (mode === "flashcard" && availableWords.length > 0) {
        const currentWord = availableWords[currentWordIndex];
        getWordDefinition(currentWord).catch((error) =>
          console.error("Error preloading current word definition:", error)
        );

        // Nếu có từ tiếp theo, preload luôn
        if (
          currentWordIndex <
          Math.min(sessionLength - 1, availableWords.length - 1)
        ) {
          const nextWord = availableWords[currentWordIndex + 1];
          getWordDefinition(nextWord).catch((error) =>
            console.error("Error preloading next word definition:", error)
          );
        }
      }

      // Đọc từ hiện tại khi chuyển tab chỉ nếu đã qua đủ thời gian
      if (availableWords.length > 0) {
        const currentWord = availableWords[currentWordIndex];
        if (currentWord) {
          const now = Date.now();
          // Chỉ đọc từ nếu đã qua ít nhất 1 giây kể từ lần đọc cuối
          if (now - lastSpeakTimeRef.current > 1000) {
            // Dừng âm thanh hiện tại nếu có
            stopSpeaking();

            // Đọc từ mới
            speakWord(currentWord.word);
            lastSpeakTimeRef.current = now;
          }
        }
      }

      // Cập nhật mode trước đó
      previousModeRef.current = mode;
    }
  };

  const handleWordComplete = () => {
    const currentWord = availableWords[currentWordIndex];

    if (currentWord) {
      incrementEncounters(currentWord.word);
    }

    // Move to next word or end session
    if (
      currentWordIndex < Math.min(sessionLength - 1, availableWords.length - 1)
    ) {
      setCurrentWordIndex((prevIndex) => prevIndex + 1);

      // Khi hoàn thành từ hiện tại và đang ở chế độ quiz, preload cho từ tiếp theo nữa (từ thứ 3)
      if (
        learningMode === "quiz" &&
        currentWordIndex + 1 <
          Math.min(sessionLength - 1, availableWords.length - 1)
      ) {
        const wordToPreload = availableWords[currentWordIndex + 2]; // Preload từ thứ 3 (sau từ tiếp theo)
        if (wordToPreload) {
          generateQuizQuestion(wordToPreload).catch((error) =>
            console.error("Error preloading future word quiz:", error)
          );
        }
      }

      // Tương tự cho flashcard
      if (
        learningMode === "flashcard" &&
        currentWordIndex + 1 <
          Math.min(sessionLength - 1, availableWords.length - 1)
      ) {
        const wordToPreload = availableWords[currentWordIndex + 2]; // Preload từ thứ 3
        if (wordToPreload) {
          getWordDefinition(wordToPreload).catch((error) =>
            console.error("Error preloading future word definition:", error)
          );
        }
      }
    } else {
      setSessionCompleted(true);
    }
  };

  const handleWordKnown = () => {
    const currentWord = availableWords[currentWordIndex];

    if (currentWord) {
      updateWordStatus(currentWord.word, "known");
    }

    // Move to next word or end session
    if (
      currentWordIndex < Math.min(sessionLength - 1, availableWords.length - 1)
    ) {
      setCurrentWordIndex((prevIndex) => prevIndex + 1);
    } else {
      setSessionCompleted(true);
    }
  };

  const handleWordSkip = () => {
    // Just move to the next word without incrementing
    if (
      currentWordIndex < Math.min(sessionLength - 1, availableWords.length - 1)
    ) {
      setCurrentWordIndex((prevIndex) => prevIndex + 1);
    } else {
      setSessionCompleted(true);
    }
  };

  const startNewSession = () => {
    setCurrentWordIndex(0);
    setSessionCompleted(false);
  };

  // Get alternatives for quiz mode
  const getAlternativeWords = () => {
    const alternatives = [...availableWords].filter(
      (word) => word.word !== availableWords[currentWordIndex]?.word
    );

    // Shuffle and take first few
    return alternatives.sort(() => 0.5 - Math.random()).slice(0, 5);
  };

  // Render the appropriate learning component based on mode
  const renderLearningComponent = () => {
    if (availableWords.length === 0) {
      return (
        <div className="text-center p-8">
          <h2 className="text-xl font-semibold mb-4">No Words Available</h2>
          <p className="text-gray-600 mb-6">
            You've learned all the words in this category or level!
          </p>
          <p>Try selecting a different level or category.</p>
        </div>
      );
    }

    const currentWord = availableWords[currentWordIndex];

    switch (learningMode) {
      case "flashcard":
        return (
          <Flashcard
            word={currentWord}
            onComplete={handleWordComplete}
            onKnown={handleWordKnown}
            onSkip={handleWordSkip}
          />
        );
      case "quiz":
        return (
          <QuizGame
            word={currentWord}
            alternatives={getAlternativeWords()}
            onComplete={handleWordComplete}
            onSkip={handleWordSkip}
          />
        );
      case "spelling":
        return (
          <SpellingChallenge
            word={currentWord}
            onComplete={handleWordComplete}
            onSkip={handleWordSkip}
          />
        );
      case "pronunciation":
        return (
          <PronunciationPractice
            word={currentWord}
            onComplete={handleWordComplete}
            onSkip={handleWordSkip}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Learn Oxford 5000+ Words</h1>

      <div className="card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mb-4">
          <div>
            <label
              htmlFor="session-length"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Session Length (words)
            </label>
            <input
              id="session-length"
              type="number"
              min="1"
              max="50"
              className="input w-full"
              value={sessionLength}
              onChange={handleSessionLengthChange}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-3 mb-6">
        <button
          onClick={() => handleModeChange("flashcard")}
          className={`btn ${
            learningMode === "flashcard" ? "btn-primary" : "btn-secondary"
          }`}
        >
          Flashcards
        </button>
        <button
          onClick={() => handleModeChange("quiz")}
          className={`btn ${
            learningMode === "quiz" ? "btn-primary" : "btn-secondary"
          }`}
        >
          Quiz
        </button>
        <button
          onClick={() => handleModeChange("spelling")}
          className={`btn ${
            learningMode === "spelling" ? "btn-primary" : "btn-secondary"
          }`}
        >
          Spelling
        </button>
        <button
          onClick={() => handleModeChange("pronunciation")}
          className={`btn ${
            learningMode === "pronunciation" ? "btn-primary" : "btn-secondary"
          }`}
        >
          Pronunciation
        </button>
      </div>

      <div className="card">
        {!sessionCompleted ? (
          <>
            <div className="mb-4 flex justify-between items-center">
              <span className="text-sm text-gray-500">
                Word {currentWordIndex + 1} of{" "}
                {Math.min(sessionLength, availableWords.length)}
              </span>
              <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full"
                  style={{
                    width: `${
                      (currentWordIndex /
                        Math.max(
                          1,
                          Math.min(sessionLength, availableWords.length) - 1
                        )) *
                      100
                    }%`,
                  }}
                />
              </div>
            </div>

            {renderLearningComponent()}
          </>
        ) : (
          <div className="text-center p-8">
            <h2 className="text-xl font-semibold mb-4">Session Completed!</h2>
            <p className="text-gray-600 mb-6">
              You've completed this learning session.
            </p>
            <button onClick={startNewSession} className="btn btn-primary">
              Start New Session
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
