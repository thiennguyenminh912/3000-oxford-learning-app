import { useState, useEffect } from "react";
import { useVoices } from "../hooks/useVoices";
import type { WordData } from "../utils/wordUtils";
import {
  createRandomQuiz,
  type QuizQuestion,
  type FillInTheBlankQuestion,
} from "../utils/wordUtils";

interface QuizGameProps {
  word: WordData;
  alternatives: WordData[];
  onComplete: () => void;
  onSkip: () => void;
  onKnown: () => void;
}

export const QuizGame: React.FC<QuizGameProps> = ({
  word,
  onComplete,
  onKnown,
}) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [quizData, setQuizData] = useState<
    QuizQuestion | FillInTheBlankQuestion
  >({
    question: "",
    options: [],
    correctAnswer: "",
  });
  const [isFillInTheBlank, setIsFillInTheBlank] = useState(false);
  const { speakWord } = useVoices();

  useEffect(() => {
    // Reset state when word changes
    setSelectedOption(null);
    setIsCorrect(null);

    // Create random quiz question from word data
    const quiz = createRandomQuiz(word);
    setQuizData(quiz);
    setIsFillInTheBlank("sentence" in quiz);
  }, [word]);

  const playAudio = () => {
    if (audioPlaying) return;

    setAudioPlaying(true);
    speakWord(word.word);

    setTimeout(() => {
      setAudioPlaying(false);
    }, 500);
  };

  const handleOptionSelect = (option: string) => {
    setSelectedOption(option);
    const correct = option === quizData.correctAnswer;
    setIsCorrect(correct);

    if (correct) {
      // Wait a moment before moving to next
      setTimeout(() => {
        onComplete();
      }, 500);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="card mb-6">
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            {!isFillInTheBlank && (
              <h3 className="text-xl font-semibold">{word.word}</h3>
            )}
            <div className="flex items-center gap-2">
              {!isFillInTheBlank && (
                <button
                  onClick={playAudio}
                  disabled={audioPlaying}
                  className="text-blue-500 hover:text-blue-700 flex items-center gap-1"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53L5 15.75m-4-5h8-8z"
                    />
                  </svg>
                  {audioPlaying ? "Playing..." : "Listen"}
                </button>
              )}
            </div>
          </div>

          <p className="text-lg mb-4">{quizData.question}</p>

          {isFillInTheBlank && "sentence" in quizData && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-gray-700 font-medium">{quizData.sentence}</p>
            </div>
          )}

          <div className="flex flex-col gap-3">
            {quizData.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleOptionSelect(option)}
                disabled={isCorrect !== null}
                className={`p-3 rounded-lg text-left transition-colors ${
                  selectedOption === option
                    ? isCorrect
                      ? "bg-green-100 border border-green-500"
                      : "bg-red-100 border border-red-500"
                    : "bg-gray-100 hover:bg-gray-200"
                } ${
                  isCorrect === false && option === quizData.correctAnswer
                    ? "bg-green-100 border border-green-500"
                    : ""
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        {isCorrect === false && (
          <div className="mb-4 p-3 bg-red-50 rounded-lg">
            <p className="text-red-700">
              Not quite right. The correct answer is:
            </p>
            <p className="font-semibold mt-1">{quizData.correctAnswer}</p>
          </div>
        )}

        <div className="flex gap-3">
          {isCorrect === null && (
            <button onClick={onComplete} className="flex-1 btn btn-primary">
              Next
            </button>
          )}
          {isCorrect === null && (
            <button
              onClick={onKnown}
              className="flex-1 btn bg-green-600 text-white hover:bg-green-700"
            >
              Got it
            </button>
          )}
          {isCorrect === false && (
            <button onClick={onComplete} className="w-full btn btn-primary">
              Continue
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
