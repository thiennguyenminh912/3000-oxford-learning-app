import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import type { WordData } from "../utils/wordUtils";
import { useVoices } from "../hooks/useVoices";
import { getWordDefinition } from "../services/apiService";
import type { WordDefinition } from "../services/apiService";
import { useWordStore } from "../store/wordStore";
import { REQUIRED_WORD_ENCOUNTERS } from "../utils/constants";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const MotionDiv = motion.div as any;

interface FlashcardProps {
  word: WordData;
  onComplete: () => void;
  onKnown: () => void;
  onSkip: () => void;
}

export const Flashcard: React.FC<FlashcardProps> = ({
  word,
  onComplete,
  onKnown,
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFromCache, setIsFromCache] = useState(false);
  const [definition, setDefinition] = useState<WordDefinition>({
    englishDefinition: "",
    vietnameseDefinition: "",
    examples: [""],
  });
  const { speakWord } = useVoices();

  useEffect(() => {
    // Reset definition state when word changes to prevent showing previous word's definition
    setDefinition({
      englishDefinition: "",
      vietnameseDefinition: "",
      examples: [""],
    });

    // Lấy định nghĩa từ API khi từ thay đổi
    const fetchDefinition = async () => {
      if (!word) return;

      // Kiểm tra cache trước
      const wordStore = useWordStore.getState();
      const cachedDefinition = wordStore.getCachedDefinition(word.word);

      if (cachedDefinition) {
        // Nếu có trong cache, sử dụng ngay
        setDefinition(cachedDefinition);
        setIsFromCache(true);
        setIsLoading(false);
        return;
      }

      // Không có trong cache, thì hiển thị loading
      setIsFromCache(false);
      if (isFlipped) {
        setIsLoading(true);
      }

      try {
        const result = await getWordDefinition(word);
        setDefinition(result);
      } catch (error) {
        console.error("Error fetching definition:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDefinition();
    // Reset trạng thái lật thẻ khi từ mới được hiển thị
    setIsFlipped(false);
  }, [word]);

  const handleFlip = () => {
    // Nếu chưa lật thẻ và chưa có dữ liệu, hiển thị trạng thái loading khi lật
    if (!isFlipped && !definition.englishDefinition && !isFromCache) {
      setIsLoading(true);

      // Nếu API trả về quá nhanh, đảm bảo hiển thị loading ít nhất 300ms
      // để tránh nhấp nháy UI
      setTimeout(() => {
        if (definition.englishDefinition) {
          setIsLoading(false);
        }
      }, 300);
    }

    // Luôn lật thẻ khi người dùng click
    setIsFlipped(!isFlipped);
  };

  const playAudio = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (audioPlaying) return;

    setAudioPlaying(true);

    // Phát âm từ sử dụng hook useVoices
    speakWord(word.word);

    // Thiết lập timeout để đảm bảo nút không bị vô hiệu hóa quá lâu nếu sự kiện onend không được gọi
    setTimeout(() => {
      setAudioPlaying(false);
    }, 500);
  };

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-md mx-auto">
      <div className="w-full aspect-[3/2] relative">
        <MotionDiv
          className="absolute inset-0 w-full h-full rounded-xl"
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.6 }}
          onClick={handleFlip}
          style={{ transformStyle: "preserve-3d" }}
        >
          {/* Front of card - Word */}
          <MotionDiv
            className="absolute inset-0 p-8 bg-white rounded-xl shadow-lg flex flex-col items-center justify-center"
            style={{ backfaceVisibility: "hidden" }}
            animate={{ opacity: isFlipped ? 0 : 1 }}
          >
            <h2 className="text-3xl font-bold mb-2">{word.word}</h2>

            {word.type && (
              <p className="text-gray-500 mb-2 italic">{word.type}</p>
            )}

            {word.phonetics && (
              <div className="flex gap-4 mb-4 text-sm">
                {word.phonetics.uk && (
                  <span className="text-blue-600">UK: {word.phonetics.uk}</span>
                )}
                {word.phonetics.us && (
                  <span className="text-red-600">US: {word.phonetics.us}</span>
                )}
              </div>
            )}

            <button
              onClick={playAudio}
              className="text-blue-500 hover:text-blue-700 flex items-center gap-2"
              disabled={audioPlaying}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
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

            <div className="mt-2 text-sm text-gray-500">
              {word.level && (
                <span className="mr-2 px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                  {word.level}
                </span>
              )}
            </div>
          </MotionDiv>

          {/* Back of card - Definition */}
          <MotionDiv
            className={
              "absolute inset-0 p-8 bg-white rounded-xl shadow-lg flex flex-col items-center justify-center"
            }
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}
            animate={{ opacity: isFlipped ? 1 : 0 }}
          >
            {isLoading || !definition.englishDefinition ? (
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p>Loading definition...</p>
              </div>
            ) : (
              <>
                <div className="overflow-y-auto max-h-full w-full">
                  {isFromCache && (
                    <div className="text-right mb-2">
                      <span className="text-xs px-2 py-1 bg-purple-100 text-purple-800 rounded-full">
                        Cached
                      </span>
                    </div>
                  )}
                  <h3 className="text-xl text-gray-700 mb-2">Definition:</h3>
                  <p className="text-center mb-4">
                    {definition.englishDefinition}
                  </p>

                  <div className="mt-3">
                    <p className="text-sm text-gray-600 mb-2">Examples:</p>
                    <ul className="list-disc pl-4">
                      {definition.examples.map((example, idx) => (
                        <li key={idx} className="italic text-gray-700 mb-1">
                          {example}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-4 border-t pt-3">
                    <p className="text-sm text-gray-600 mb-1">Vietnamese:</p>
                    <p className="font-medium">
                      {definition.vietnameseDefinition}
                    </p>
                  </div>
                </div>
              </>
            )}
          </MotionDiv>
        </MotionDiv>
      </div>

      <div className="flex gap-3 mt-4 w-full">
        {/* <button onClick={onSkip} className="flex-1 btn btn-secondary">
          Skip
        </button> */}
        <button onClick={onComplete} className="flex-1 btn btn-primary">
          Next
        </button>
        <button
          onClick={onKnown}
          className="flex-1 btn bg-green-600 text-white hover:bg-green-700"
        >
          Got it
        </button>
      </div>

      <div className="flex items-center gap-2 text-gray-600">
        <span className="font-medium">Progress:</span>
        <span>
          {word.encounters || 0}/{REQUIRED_WORD_ENCOUNTERS}
        </span>
        <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 rounded-full"
            style={{
              width: `${Math.min(
                ((word.encounters || 0) / REQUIRED_WORD_ENCOUNTERS) * 100,
                100
              )}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
};
