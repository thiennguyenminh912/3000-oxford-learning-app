import { useState, useCallback, useEffect } from "react";

interface SpeechRecognitionResult {
  text: string;
  confidence: number;
  isCorrect: boolean;
}

export const useSpeechRecognition = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);

  // Kiểm tra xem trình duyệt có hỗ trợ Speech Recognition không
  useEffect(() => {
    if (
      !("webkitSpeechRecognition" in window) &&
      !("SpeechRecognition" in window)
    ) {
      setIsSupported(false);
      setError("Speech recognition is not supported in this browser");
    }
  }, []);

  // Hàm bắt đầu nhận dạng giọng nói
  const startListening = useCallback(
    (
      targetWord: string,
      callback?: (result: SpeechRecognitionResult) => void
    ) => {
      if (!isSupported) return;

      const SpeechRecognition =
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).SpeechRecognition ||
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();

      recognition.lang = "en-GB";
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      setIsListening(true);
      setTranscript("");
      setError(null);

      recognition.onresult = (event: any) => {
        const result = event.results[0][0];
        const text = result.transcript.trim().toLowerCase();
        const confidence = result.confidence;
        const targetText = targetWord.toLowerCase();

        setTranscript(text);

        if (callback) {
          callback({
            text,
            confidence,
            isCorrect: text === targetText,
          });
        }
      };

      recognition.onerror = (event: any) => {
        setError(event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();

      return () => {
        recognition.abort();
        setIsListening(false);
      };
    },
    [isSupported]
  );

  return {
    isListening,
    transcript,
    error,
    isSupported,
    startListening,
  };
};
