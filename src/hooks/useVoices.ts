import { useState, useEffect, useCallback, useRef } from "react";

// Custom hook để lấy danh sách giọng nói từ Web Speech API
export const useVoices = () => {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [englishVoice, setEnglishVoice] = useState<SpeechSynthesisVoice | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Thêm ref để theo dõi trạng thái đọc hiện tại
  const isSpeakingRef = useRef(false);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const lastWordRef = useRef<string>("");
  const lastTimeRef = useRef<number>(0);

  useEffect(() => {
    // Hàm lấy voices từ Speech API
    const loadVoices = () => {
      try {
        const availableVoices = window.speechSynthesis.getVoices();
        if (availableVoices.length > 0) {
          setVoices(availableVoices);

          // Ưu tiên tìm giọng anh-anh (British English)
          const britishVoice = availableVoices.find(
            (voice) => voice.lang === "en-GB" || voice.name.includes("British")
          );

          // Nếu không có, tìm bất kỳ giọng tiếng Anh nào
          const anyEnglishVoice = availableVoices.find((voice) =>
            voice.lang.startsWith("en")
          );

          setEnglishVoice(britishVoice || anyEnglishVoice || null);
          setIsLoading(false);
        }
      } catch (err) {
        console.error("Error loading voices:", err);
        setError("Could not load speech synthesis voices");
        setIsLoading(false);
      }
    };

    loadVoices();

    // Chrome cần event này để tải voices
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    // Cleanup khi component unmount
    return () => {
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = null;
      }
      // Dừng mọi speech đang phát khi unmount
      window.speechSynthesis.cancel();
    };
  }, []);

  // Hàm đọc từ được cải tiến để tránh lặp lại
  const speakWord = useCallback(
    (word: string) => {
      if (!word) return;

      const currentTime = Date.now();
      // Nếu đang đọc từ này hoặc chưa quá 500ms từ lần gọi cuối, bỏ qua
      if (
        (isSpeakingRef.current && lastWordRef.current === word) ||
        (lastWordRef.current === word &&
          currentTime - lastTimeRef.current < 500)
      ) {
        return;
      }

      // Cập nhật từ và thời gian cuối cùng được gọi
      lastWordRef.current = word;
      lastTimeRef.current = currentTime;

      // Hủy bất kỳ phát âm đang diễn ra nào
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
      }

      // Tạo utterance mới
      const utterance = new SpeechSynthesisUtterance(word);
      if (englishVoice) {
        utterance.voice = englishVoice;
      }
      utterance.rate = 0.9; // Đọc chậm hơn một chút
      utterance.pitch = 1;
      utterance.lang = englishVoice?.lang || "en-GB";

      // Đặt trạng thái và lưu utterance hiện tại
      isSpeakingRef.current = true;
      currentUtteranceRef.current = utterance;

      // Xử lý khi phát âm kết thúc
      utterance.onend = () => {
        isSpeakingRef.current = false;
        currentUtteranceRef.current = null;
      };

      // Xử lý lỗi
      utterance.onerror = () => {
        isSpeakingRef.current = false;
        currentUtteranceRef.current = null;
      };

      // Phát âm
      window.speechSynthesis.speak(utterance);
    },
    [englishVoice]
  );

  // Thêm hàm kiểm tra xem có đang đọc không
  const isSpeaking = useCallback(() => {
    return isSpeakingRef.current;
  }, []);

  // Thêm hàm dừng đọc
  const stopSpeaking = useCallback(() => {
    if (isSpeakingRef.current) {
      window.speechSynthesis.cancel();
      isSpeakingRef.current = false;
      currentUtteranceRef.current = null;
    }
  }, []);

  return {
    voices,
    englishVoice,
    isLoading,
    error,
    speakWord,
    isSpeaking,
    stopSpeaking,
  };
};
