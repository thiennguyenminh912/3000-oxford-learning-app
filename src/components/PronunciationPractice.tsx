import { useState, useEffect } from "react";
import { useVoices } from "../hooks/useVoices";
import { useSpeechRecognition } from "../hooks/useSpeechRecognition";
import type { WordData } from "../utils/wordUtils";

interface PronunciationPracticeProps {
  word: WordData;
  onComplete: () => void;
  onSkip: () => void;
}

export const PronunciationPractice: React.FC<PronunciationPracticeProps> = ({
  word,
  onComplete,
  onSkip,
}) => {
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [hasPlayedInitialAudio, setHasPlayedInitialAudio] = useState(false);
  const [attemptResult, setAttemptResult] = useState<
    "correct" | "incorrect" | null
  >(null);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const { speakWord } = useVoices();
  const { isListening, transcript, error, isSupported, startListening } =
    useSpeechRecognition();

  useEffect(() => {
    // Reset state khi word thay đổi
    setAttemptResult(null);
    setFeedbackMessage("");
    setHasPlayedInitialAudio(false);

    // Đặt một timeout ngắn để đảm bảo không bị phát âm trùng lặp với component khác
    const timer = setTimeout(() => {
      if (!hasPlayedInitialAudio) {
        playAudio();
        setHasPlayedInitialAudio(true);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [word]);

  const playAudio = () => {
    if (audioPlaying) return;

    setAudioPlaying(true);
    speakWord(word.word);

    // Đảm bảo nút không bị vô hiệu hóa quá lâu
    setTimeout(() => {
      setAudioPlaying(false);
    }, 1000);
  };

  const handleStartListening = () => {
    if (!isSupported) {
      setFeedbackMessage(
        "Speech recognition is not supported in this browser."
      );
      return;
    }

    startListening(word.word, (result) => {
      if (result.isCorrect) {
        setAttemptResult("correct");
        setFeedbackMessage(
          `Great job! You pronounced "${word.word}" correctly.`
        );
        setTimeout(() => {
          onComplete();
        }, 1000);
      } else {
        setAttemptResult("incorrect");
        setFeedbackMessage(`You said: "${result.text}". Try again!`);
      }
    });
  };

  const handleTryAgain = () => {
    setAttemptResult(null);
    setFeedbackMessage("");
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="card mb-6">
        <h2 className="text-xl font-semibold mb-4">Practice Pronunciation</h2>

        <div className="p-4 bg-blue-50 rounded-lg mb-6 text-center">
          <h3 className="text-3xl font-bold mb-2">{word.word}</h3>
          {word.level && (
            <span className="inline-block mr-2 px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
              {word.level}
            </span>
          )}
          {word.category && (
            <span className="inline-block px-2 py-1 bg-green-100 text-green-800 rounded-full">
              {word.category}
            </span>
          )}
        </div>

        <div className="flex flex-col gap-4 mb-6">
          <button
            onClick={playAudio}
            disabled={audioPlaying}
            className="flex items-center justify-center gap-2 w-full p-3 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors"
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
              {audioPlaying ? "Playing..." : "Listen to Pronunciation"}
            </span>
          </button>

          <button
            onClick={handleStartListening}
            disabled={isListening || !isSupported}
            className={`flex items-center justify-center gap-2 w-full p-3 rounded-lg hover:bg-indigo-200 transition-colors ${
              isListening ? "bg-indigo-300 animate-pulse" : "bg-indigo-100"
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-indigo-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
              />
            </svg>
            <span className="font-medium">
              {isListening ? "Listening..." : "Record Your Pronunciation"}
            </span>
          </button>
        </div>

        {transcript && (
          <div
            className={`p-3 mb-4 rounded-lg ${
              attemptResult === "correct"
                ? "bg-green-50 text-green-700"
                : attemptResult === "incorrect"
                ? "bg-red-50 text-red-700"
                : "bg-gray-50 text-gray-700"
            }`}
          >
            <p className="text-center">{feedbackMessage}</p>
          </div>
        )}

        {error && (
          <div className="p-3 mb-4 bg-red-50 text-red-700 rounded-lg">
            <p className="text-center">Error: {error}</p>
          </div>
        )}

        <div className="flex gap-3">
          {attemptResult === null ? (
            <button onClick={onSkip} className="w-full btn btn-secondary">
              Skip
            </button>
          ) : attemptResult === "incorrect" ? (
            <>
              <button
                onClick={handleTryAgain}
                className="flex-1 btn btn-secondary"
              >
                Try Again
              </button>
              <button onClick={onComplete} className="flex-1 btn btn-primary">
                Continue
              </button>
            </>
          ) : null}
        </div>
      </div>

      <div className="text-center text-gray-500">
        <p>Practice speaking clearly. Say the word exactly as you hear it.</p>
        {!isSupported && (
          <p className="text-red-500 mt-2">
            Note: Speech recognition is not supported in your browser. Try using
            Chrome or Edge for best experience.
          </p>
        )}
      </div>
    </div>
  );
};
