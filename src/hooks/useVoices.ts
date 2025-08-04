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
  const isIOSRef = useRef(false);

  // Detect iOS device
  useEffect(() => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    isIOSRef.current = isIOS;
    console.log("iOS device detected:", isIOS);
  }, []);

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
        const availableVoices = window.speechSynthesis.getVoices();

        if (availableVoices && availableVoices.length > 0) {
          setVoices(availableVoices);

          // Make a copy of voices array for selection to avoid mutating the original
          const voicesList = [...availableVoices];
          let selectedVoice = null;

          // For iOS devices
          if (isIOSRef.current) {
            // Try high-quality iOS English voices first
            const iosEnglishVoices = [
              voicesList.find(
                (v) => v.name.includes("Daniel") && v.lang.startsWith("en")
              ),
              voicesList.find(
                (v) => v.name.includes("Alex") && v.lang.startsWith("en")
              ),
              voicesList.find(
                (v) => v.name.includes("Samantha") && v.lang.startsWith("en")
              ),
              // Find any English US voice
              voicesList.find((v) => v.lang === "en-US"),
              // Find any English voice
              voicesList.find((v) => v.lang.startsWith("en")),
            ].filter(Boolean);

            selectedVoice = iosEnglishVoices[0] || null;
          } else {
            // For non-iOS devices - try a broader selection approach
            // First try to find Google UK English voices (high quality)
            const googleUKVoice = voicesList.find(
              (v) =>
                v.name.includes("Google UK English") ||
                (v.name.includes("Google") && v.lang === "en-GB")
            );

            // Try Microsoft voices which are often good quality
            const microsoftVoice = voicesList.find(
              (v) => v.name.includes("Microsoft") && v.lang.startsWith("en")
            );

            // Next try any British English voice
            const ukVoice = voicesList.find((v) => v.lang === "en-GB");

            // Next try any US English voice
            const usVoice = voicesList.find((v) => v.lang === "en-US");

            // Finally, any English voice
            const anyEnglishVoice = voicesList.find((v) =>
              v.lang.startsWith("en")
            );

            // Use the first voice that matches our criteria
            selectedVoice =
              googleUKVoice ||
              microsoftVoice ||
              ukVoice ||
              usVoice ||
              anyEnglishVoice ||
              null;
          }

          // If we still don't have a voice, use the default voice or first available
          if (!selectedVoice) {
            selectedVoice =
              voicesList.find((v) => v.default) || voicesList[0] || null;
          }

          setEnglishVoice(selectedVoice);

          if (selectedVoice) {
            console.log(
              `Selected voice: ${selectedVoice.name} (${selectedVoice.lang})`
            );
          } else {
            console.warn("No voice selected");
          }

          setIsLoading(false);
        } else {
          console.warn("No voices available yet");
          // Nếu không có voices, thử lại sau một khoảng thời gian (đề phòng trường hợp trình duyệt chậm load voices)
          if (typeof window !== "undefined") {
            setTimeout(loadVoices, 100);
          }
        }
      } catch (err) {
        console.error("Error loading voices:", err);
        setError("Could not load speech synthesis voices");
        setIsLoading(false);
      }
    };

    // Try to load voices immediately
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

      // Always use English language to prevent using device language
      if (isIOSRef.current) {
        // For iOS, always use en-US explicitly
        utterance.lang = "en-US";
      } else if (englishVoice?.lang) {
        // Use the language of the selected voice
        utterance.lang = englishVoice.lang;
      } else {
        // Fallback to en-US
        utterance.lang = "en-US";
      }

      // Set speech parameters for better quality
      utterance.volume = 1.0;
      // Slightly slower on iOS for better quality, normal speed elsewhere
      utterance.rate = isIOSRef.current ? 0.7 : 0.8;
      utterance.pitch = 1.0;

      console.log(
        `Speaking with: lang=${utterance.lang}, rate=${utterance.rate}, voice=${
          utterance.voice?.name || "default"
        }`
      );

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

        // Apply fix for Chrome and desktop Safari
        if (!isIOSRef.current) {
          fixSpeechSynthesisBug();
        }
      } catch (err) {
        console.error("Error speaking:", err);
        isSpeakingRef.current = false;
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
