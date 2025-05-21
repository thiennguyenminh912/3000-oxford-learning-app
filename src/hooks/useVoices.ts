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

  // Khởi tạo SpeechSynthesis và đảm bảo nó đã sẵn sàng
  useEffect(() => {
    // Hack để khởi tạo SpeechSynthesis API
    if (typeof window !== "undefined" && window.speechSynthesis) {
      // Trên một số trình duyệt, SpeechSynthesis cần được khởi tạo bằng cách gọi để đảm bảo hoạt động
      window.speechSynthesis.cancel();
    }
  }, []);

  useEffect(() => {
    // Hàm lấy voices từ Speech API
    const loadVoices = () => {
      try {
        console.log("Loading voices...");
        const availableVoices = window.speechSynthesis.getVoices();

        if (availableVoices && availableVoices.length > 0) {
          console.log(`Loaded ${availableVoices.length} voices`);
          setVoices(availableVoices);

          // Ưu tiên tìm giọng anh-anh (British English)
          const britishVoice = availableVoices.find(
            (voice) => voice.lang === "en-GB" || voice.name.includes("British")
          );

          // Nếu không có, tìm bất kỳ giọng tiếng Anh nào
          const anyEnglishVoice = availableVoices.find((voice) =>
            voice.lang.startsWith("en")
          );

          const selectedVoice = britishVoice || anyEnglishVoice || null;
          setEnglishVoice(selectedVoice);

          if (selectedVoice) {
            console.log(
              `Selected voice: ${selectedVoice.name} (${selectedVoice.lang})`
            );
          } else {
            console.warn("No English voice found");
          }

          setIsLoading(false);
        } else {
          console.warn("No voices available yet");
          // Nếu không có voices, thử lại sau một khoảng thời gian (đề phòng trường hợp trình duyệt chậm load voices)
          if (typeof window !== "undefined" && !availableVoices?.length) {
            setTimeout(loadVoices, 100);
          }
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
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Fix cho vấn đề Chrome/Safari không phát hết từ
  const fixSpeechSynthesisBug = useCallback(() => {
    const synth = window.speechSynthesis;

    if (synth.speaking) {
      synth.pause();
      synth.resume();

      // Lặp lại việc fix này mỗi 250ms
      setTimeout(fixSpeechSynthesisBug, 250);
    }
  }, []);

  // Hàm đọc từ được cải tiến để tránh lặp lại
  const speakWord = useCallback(
    (word: string) => {
      if (!word || typeof window === "undefined" || !window.speechSynthesis) {
        console.error("Speech synthesis not available");
        return;
      }

      console.log(`Attempting to speak: "${word}"`);

      const currentTime = Date.now();
      // Nếu đang đọc từ này hoặc chưa quá 500ms từ lần gọi cuối, bỏ qua
      if (
        (isSpeakingRef.current && lastWordRef.current === word) ||
        (lastWordRef.current === word &&
          currentTime - lastTimeRef.current < 500)
      ) {
        console.log("Skipping duplicate speak request");
        return;
      }

      // Cập nhật từ và thời gian cuối cùng được gọi
      lastWordRef.current = word;
      lastTimeRef.current = currentTime;

      // Hủy bất kỳ phát âm đang diễn ra nào
      if (window.speechSynthesis.speaking) {
        console.log("Canceling previous speech");
        window.speechSynthesis.cancel();
      }

      // Tạo utterance mới
      const utterance = new SpeechSynthesisUtterance(word);

      if (englishVoice) {
        utterance.voice = englishVoice;
        console.log(`Using voice: ${englishVoice.name}`);
      } else {
        console.warn("No English voice available, using default");
      }

      utterance.rate = 0.9; // Đọc chậm hơn một chút
      utterance.pitch = 1;
      utterance.lang = englishVoice?.lang || "en-GB";
      utterance.volume = 1.0; // Đảm bảo âm lượng tối đa

      // Đặt trạng thái và lưu utterance hiện tại
      isSpeakingRef.current = true;
      currentUtteranceRef.current = utterance;

      // Xử lý khi phát âm kết thúc
      utterance.onend = () => {
        console.log("Speech ended");
        isSpeakingRef.current = false;
        currentUtteranceRef.current = null;
      };

      // Xử lý lỗi
      utterance.onerror = (event) => {
        console.error("Speech error:", event);
        isSpeakingRef.current = false;
        currentUtteranceRef.current = null;
      };

      // Phát âm
      try {
        console.log("Speaking now...");
        window.speechSynthesis.speak(utterance);

        // Fix cho bug của Chrome không phát hết
        fixSpeechSynthesisBug();
      } catch (err) {
        console.error("Error speaking:", err);
      }
    },
    [englishVoice, fixSpeechSynthesisBug]
  );

  // Thêm hàm kiểm tra xem có đang đọc không
  const isSpeaking = useCallback(() => {
    return isSpeakingRef.current;
  }, []);

  // Thêm hàm dừng đọc
  const stopSpeaking = useCallback(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      isSpeakingRef.current = false;
      currentUtteranceRef.current = null;
      console.log("Speech stopped");
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
