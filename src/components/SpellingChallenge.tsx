import { useState, useRef, useEffect } from "react";
import type { WordData } from "../utils/wordUtils";
import { useVoices } from "../hooks/useVoices";

interface SpellingChallengeProps {
  word: WordData;
  onComplete: () => void;
  onSkip: () => void;
}

export const SpellingChallenge: React.FC<SpellingChallengeProps> = ({
  word,
  onComplete,
  onSkip,
}) => {
  const [userInput, setUserInput] = useState("");
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [hasPlayedInitialAudio, setHasPlayedInitialAudio] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { speakWord } = useVoices();

  useEffect(() => {
    // Focus the input field when the component mounts
    if (inputRef.current) {
      inputRef.current.focus();
    }
    setUserInput("");
    setIsCorrect(null);
    setShowHint(false);
    setHasPlayedInitialAudio(false);

    // Đặt một timeout ngắn để đảm bảo không bị phát âm trùng lặp với component khác
    const timer = setTimeout(() => {
      if (!hasPlayedInitialAudio) {
        // playAudio();
        setHasPlayedInitialAudio(true);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [word]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserInput(e.target.value);
    setIsCorrect(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const normalizedInput = userInput.trim().toLowerCase();
    const normalizedWord = word.word.toLowerCase();
    const correct = normalizedInput === normalizedWord;

    setIsCorrect(correct);

    if (correct) {
      // Wait a moment before proceeding to the next word
      setTimeout(() => {
        onComplete();
      }, 1000);
    }
  };

  const playAudio = () => {
    if (audioPlaying) return;

    setAudioPlaying(true);

    // Phát âm từ sử dụng hook useVoices
    speakWord(word.word);

    // Thiết lập timeout để đảm bảo nút không bị vô hiệu hóa quá lâu
    setTimeout(() => {
      setAudioPlaying(false);
    }, 1000);
  };

  const handleRevealHint = () => {
    setShowHint(true);
  };

  const handleTryAgain = () => {
    setUserInput("");
    setIsCorrect(null);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const generateHint = () => {
    if (!showHint) return "";

    // Show first and last letter, and dashes for the rest
    const letters = word.word.split("");
    const hintLetters = letters.map((letter, index) => {
      if (index === 0 || index === letters.length - 1) {
        return letter;
      }
      return "_";
    });

    return hintLetters.join(" ");
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="card mb-6">
        <h2 className="text-xl font-semibold mb-4">Spell the word you hear:</h2>

        <button
          onClick={playAudio}
          disabled={audioPlaying}
          className="flex items-center justify-center gap-2 w-full p-4 mb-6 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-blue-600"
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
          <span className="font-medium">
            {audioPlaying ? "Playing..." : "Listen Again"}
          </span>
        </button>

        {showHint && (
          <div className="bg-yellow-50 p-3 rounded-lg mb-4 text-center">
            <p className="text-lg font-mono">{generateHint()}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <input
              ref={inputRef}
              type="text"
              value={userInput}
              onChange={handleInputChange}
              className={`w-full input text-lg ${
                isCorrect === true
                  ? "border-green-500 bg-green-50"
                  : isCorrect === false
                  ? "border-red-500 bg-red-50"
                  : ""
              }`}
              placeholder="Type the word..."
              disabled={isCorrect === true}
            />
          </div>

          {isCorrect === false && (
            <p className="text-red-600 mb-4">That's not correct. Try again!</p>
          )}

          {isCorrect === true && (
            <p className="text-green-600 mb-4">Correct! Great job.</p>
          )}

          <div className="flex gap-3">
            {isCorrect === null && (
              <>
                <button
                  type="button"
                  onClick={onSkip}
                  className="flex-1 btn btn-secondary"
                >
                  Skip
                </button>
                <button
                  type="button"
                  onClick={handleRevealHint}
                  className="flex-1 btn btn-secondary"
                  disabled={showHint}
                >
                  Hint
                </button>
                <button type="submit" className="flex-1 btn btn-primary">
                  Check
                </button>
              </>
            )}

            {isCorrect === false && (
              <>
                <button
                  type="button"
                  onClick={handleTryAgain}
                  className="flex-1 btn btn-secondary"
                >
                  Try Again
                </button>
                <button
                  type="button"
                  onClick={onComplete}
                  className="flex-1 btn btn-primary"
                >
                  Skip & Continue
                </button>
              </>
            )}
          </div>
        </form>
      </div>

      <div className="text-center text-gray-500">
        <p>Complete the spelling correctly to continue.</p>
      </div>
    </div>
  );
};
