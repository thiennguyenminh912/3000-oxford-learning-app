import type { WordData } from "../utils/wordUtils";
import { useWordStore } from "../store/wordStore";

const GEMINI_API_KEY = "AIzaSyBm9M3ptHeP00x4F-vb5OZZi6r0Ql4f9Xc";
const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemma-3n-e4b-it:generateContent";

interface GeminiResponse {
  candidates: {
    content: {
      parts: {
        text: string;
      }[];
    };
  }[];
}

export interface WordDefinition {
  englishDefinition: string;
  vietnameseDefinition: string;
  examples: string[];
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
}

// Hàm chung để gọi Gemini API
const callGeminiAPI = async (prompt: string): Promise<string> => {
  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          topP: 0.8,
          topK: 40,
          maxOutputTokens: 200,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error: ${response.status} ${errorText}`);
    }

    const data: GeminiResponse = await response.json();
    return data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return "Failed to get response from API.";
  }
};

// Hàm lấy định nghĩa và ví dụ của từ
export const getWordDefinition = async (
  word: WordData
): Promise<WordDefinition> => {
  try {
    // Kiểm tra cache trước
    const wordStore = useWordStore.getState();
    const cachedDefinition = wordStore.getCachedDefinition(word.word);

    // Nếu đã có trong cache, trả về ngay
    if (cachedDefinition) {
      console.log(`Using cached definition for ${word.word}`);
      return cachedDefinition;
    }

    const prompt = `Define "${word.word}" concisely:
English Definition: 
Examples:
- 
- 
Vietnamese:`;

    const response = await callGeminiAPI(prompt);

    // Phân tích phản hồi để trích xuất định nghĩa, ví dụ và dịch
    const englishDefinitionMatch = response.match(
      /English Definition:\s*(.+?)(?=Examples:|Vietnamese:)/s
    );
    const examplesMatch = response.match(/Examples:\s*(.+?)(?=Vietnamese:)/s);
    const vietnameseMatch = response.match(/Vietnamese:\s*(.+)/s);

    const englishDefinition = englishDefinitionMatch
      ? englishDefinitionMatch[1].trim()
      : "Definition not available";

    let examples: string[] = [];
    if (examplesMatch && examplesMatch[1]) {
      examples = examplesMatch[1]
        .split(/[-•*]/)
        .map((ex) => ex.trim())
        .filter((ex) => ex.length > 0);
    }

    const vietnameseDefinition = vietnameseMatch
      ? vietnameseMatch[1].trim()
      : "Không có bản dịch";

    const definition = {
      englishDefinition,
      vietnameseDefinition,
      examples: examples.length > 0 ? examples : ["No examples available"],
    };

    // Lưu kết quả vào cache
    wordStore.cacheDefinition(word.word, definition);

    return definition;
  } catch (error) {
    console.error("Error getting word definition:", error);
    return {
      englishDefinition: "Failed to load definition",
      vietnameseDefinition: "Không thể tải định nghĩa",
      examples: ["Failed to load examples"],
    };
  }
};

// Hàm tạo câu hỏi quiz cho từ
export const generateQuizQuestion = async (
  word: WordData
): Promise<QuizQuestion> => {
  try {
    // Kiểm tra cache trước
    const wordStore = useWordStore.getState();
    const cachedQuiz = wordStore.getCachedQuizQuestion(word.word);

    // Nếu đã có trong cache, trả về ngay
    if (cachedQuiz) {
      console.log(`Using cached quiz for ${word.word}`);
      return cachedQuiz;
    }

    const prompt = `Quiz for word "${word.word}":
Question: What is the meaning of "${word.word}"?
A: 
B: 
C: 
D: 
Correct:`;

    const response = await callGeminiAPI(prompt);

    // Phân tích phản hồi để trích xuất câu hỏi, các lựa chọn và câu trả lời đúng
    const questionMatch = response.match(/Question:\s*(.+)/);
    const optionAMatch = response.match(/A:\s*(.+)/);
    const optionBMatch = response.match(/B:\s*(.+)/);
    const optionCMatch = response.match(/C:\s*(.+)/);
    const optionDMatch = response.match(/D:\s*(.+)/);
    const correctMatch = response.match(/Correct:\s*([A-D])/);

    if (
      !questionMatch ||
      !optionAMatch ||
      !optionBMatch ||
      !optionCMatch ||
      !optionDMatch ||
      !correctMatch
    ) {
      throw new Error("Could not parse quiz question format from API response");
    }

    const question = questionMatch[1].trim();
    const options = [
      optionAMatch[1].trim(),
      optionBMatch[1].trim(),
      optionCMatch[1].trim(),
      optionDMatch[1].trim(),
    ];

    const correctLetter = correctMatch[1].trim();
    let correctAnswer = "";

    switch (correctLetter) {
      case "A":
        correctAnswer = options[0];
        break;
      case "B":
        correctAnswer = options[1];
        break;
      case "C":
        correctAnswer = options[2];
        break;
      case "D":
        correctAnswer = options[3];
        break;
      default:
        correctAnswer = options[0]; // Fallback to first option
    }

    const quizQuestion = {
      question,
      options,
      correctAnswer,
    };

    // Lưu kết quả vào cache
    wordStore.cacheQuizQuestion(word.word, quizQuestion);

    return quizQuestion;
  } catch (error) {
    console.error("Error generating quiz question:", error);
    // Trả về câu hỏi mặc định nếu có lỗi
    return {
      question: `What does "${word.word}" mean?`,
      options: [
        "Failed to load options from API",
        "Please try again",
        "API error occurred",
        "Check connection",
      ],
      correctAnswer: "Failed to load options from API",
    };
  }
};
