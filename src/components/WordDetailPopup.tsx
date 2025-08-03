import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import type { WordData } from "../utils/wordUtils";
import { useVoices } from "../hooks/useVoices";
import { getWordDefinition } from "../services/apiService";
import type { WordDefinition } from "../services/apiService";
import { useWordStore } from "../store/wordStore";
import { REQUIRED_WORD_ENCOUNTERS } from "../utils/constants";

interface WordDetailPopupProps {
  word: WordData;
  isOpen: boolean;
  onClose: () => void;
}

export const WordDetailPopup: React.FC<WordDetailPopupProps> = ({
  word,
  isOpen,
  onClose,
}) => {
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
    if (!isOpen) return;

    // Reset definition state when word changes
    setDefinition({
      englishDefinition: "",
      vietnameseDefinition: "",
      examples: [""],
    });

    // Lấy định nghĩa từ API khi từ thay đổi
    const fetchDefinition = async () => {
      if (!word) return;

      // Kiểm tra xem word object có sẵn các field cần thiết không
      if (word.vn_meaning && word.eng_explanation && word.example) {
        // Nếu có sẵn trong JSON, sử dụng trực tiếp
        setDefinition({
          englishDefinition: word.eng_explanation,
          vietnameseDefinition: word.vn_meaning,
          examples: Array.isArray(word.example) ? word.example : [word.example],
        });
        setIsFromCache(false);
        setIsLoading(false);
        return;
      }

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
      setIsLoading(true);

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
  }, [word, isOpen]);

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

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex justify-between items-center p-3 border-b">
          <h2 className="text-lg font-semibold text-gray-800">Word Details</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-3 overflow-y-auto max-h-[calc(90vh-70px)]">
          {/* Word Header */}
          <div className="text-center mb-4">
            <div className="flex items-center justify-center gap-2 mb-2">
              <h3 className="text-2xl font-bold text-gray-900">{word.word}</h3>
              {word.type && (
                <span className="text-gray-500 italic text-sm">
                  ({word.type})
                </span>
              )}
              {word.level && (
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                  {word.level}
                </span>
              )}
            </div>

            {word.phonetics && (
              <div className="flex justify-center gap-4 mb-2 text-sm">
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
              className="text-blue-500 hover:text-blue-700 flex items-center gap-2 mx-auto mb-2"
              disabled={audioPlaying}
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
          </div>

          {/* Definition Section */}
          <div className="space-y-2">
            {isLoading ? (
              <div className="flex flex-col items-center py-6">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-gray-600">Loading definition...</p>
              </div>
            ) : (
              <>
                {isFromCache && (
                  <div className="text-right mb-2">
                    <span className="text-xs px-2 py-1 bg-purple-100 text-purple-800 rounded-full">
                      Cached
                    </span>
                  </div>
                )}

                {/* English Definition */}
                <div className="bg-gray-50 rounded-lg p-3">
                  <h4 className="font-semibold text-gray-800 mb-1">
                    Definition
                  </h4>
                  <p className="text-gray-700 leading-relaxed">
                    {definition.englishDefinition || word.eng_explanation}
                  </p>
                </div>

                {/* Vietnamese Meaning */}
                <div className="bg-blue-50 rounded-lg p-3">
                  <h4 className="font-semibold text-gray-800 mb-1">
                    Vietnamese
                  </h4>
                  <p className="text-gray-700 leading-relaxed">
                    {definition.vietnameseDefinition || word.vn_meaning}
                  </p>
                </div>

                {/* Examples */}
                <div className="bg-green-50 rounded-lg p-3">
                  <h4 className="font-semibold text-gray-800 mb-1">Examples</h4>
                  <div className="space-y-1">
                    {(definition.examples.length > 0
                      ? definition.examples
                      : [word.example]
                    ).map((example, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <span className="text-green-600 font-medium text-sm mt-1">
                          •
                        </span>
                        <p className="text-gray-700 italic leading-relaxed flex-1">
                          "{example}"
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Progress Section */}
                <div className="bg-white border rounded-lg p-3">
                  <h4 className="font-semibold text-gray-800 mb-2">
                    Learning Progress
                  </h4>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-sm text-gray-600">Progress:</span>
                    <span className="text-sm font-medium">
                      {word.encounters || 0}/{REQUIRED_WORD_ENCOUNTERS}
                    </span>
                  </div>
                  <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min(
                          ((word.encounters || 0) / REQUIRED_WORD_ENCOUNTERS) *
                            100,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                  <div className="mt-1 text-xs text-gray-500">
                    Status:{" "}
                    <span className="font-medium capitalize">
                      {word.status || "new"}
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
