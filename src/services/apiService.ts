import type { WordData } from "../utils/wordUtils";
import { useWordStore } from "../store/wordStore";

const GEMINI_API_KEY = "AIzaSyBm9M3ptHeP00x4F-vb5OZZi6r0Ql4f9Xc";

// List of available Gemini models
const GEMINI_MODELS = [
  "gemma-3-1b-it",
  "gemma-3-4b-it",
  "gemma-3-12b-it",
  "gemma-3n-e4b-it",
  "gemma-3-27b-it",
];

// Function to get a random model
const getRandomModel = () => {
  const randomIndex = Math.floor(Math.random() * GEMINI_MODELS.length);
  return GEMINI_MODELS[randomIndex];
};

// Generate API URL with random model
const getGeminiApiUrl = () => {
  const model = getRandomModel();
  console.log(`Using Gemini model: ${model}`);
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
};

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

// Theo dõi những từ đang được xử lý để tránh gọi API lặp lại
const processingDefinitions = new Set<string>();
const processingQuizzes = new Set<string>();

// Hàm chung để gọi Gemini API
const callGeminiAPI = async (prompt: string): Promise<string> => {
  try {
    const response = await fetch(`${getGeminiApiUrl()}?key=${GEMINI_API_KEY}`, {
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
      console.log(`Definition for "${word.word}" loaded from cache`);
      return cachedDefinition;
    }

    // Nếu từ này đang được xử lý, chờ một chút và thử lại cache
    if (processingDefinitions.has(word.word)) {
      console.log(
        `Definition for "${word.word}" is already being processed, waiting...`
      );

      // Chờ 500ms và thử lại từ cache
      await new Promise((resolve) => setTimeout(resolve, 500));

      const updatedCache = wordStore.getCachedDefinition(word.word);
      if (updatedCache) {
        return updatedCache;
      }

      // Nếu vẫn không có trong cache, tiếp tục xử lý (nhưng có thể gây gọi API trùng lặp)
    }

    // Đánh dấu từ này đang được xử lý
    processingDefinitions.add(word.word);
    console.log(`Fetching definition for "${word.word}" from API`);

    // Cập nhật prompt để yêu cầu phản hồi JSON
    const prompt = `Define the word "${word.word}" including its English definition, Vietnamese translation, and usage examples.

Please respond with a JSON object in EXACTLY this format (no additional text before or after):
{
  "englishDefinition": "A concise definition in English, including part of speech and key meanings",
  "vietnameseDefinition": "A concise Vietnamese translation",
  "examples": [
    "An example sentence using the word",
    "Another example sentence if available",
    "A third example if available"
  ]
}

Make sure:
1. The JSON is valid and properly formatted
2. englishDefinition includes the word's part of speech and primary meaning
3. vietnameseDefinition is an accurate translation
4. examples array contains 1-3 practical usage examples
5. All fields are properly populated with appropriate content`;

    let response = await callGeminiAPI(prompt);

    // Làm sạch phản hồi để đảm bảo chỉ lấy JSON
    response = response.trim();

    // Xóa các backticks nếu Gemini bọc JSON trong code block
    if (response.startsWith("```json")) {
      response = response.replace(/```json\n|```/g, "");
    } else if (response.startsWith("```")) {
      response = response.replace(/```\n|```/g, "");
    }

    try {
      // Parse JSON từ phản hồi
      const parsedDefinition = JSON.parse(response) as WordDefinition;

      // Đảm bảo tất cả các trường đều có dữ liệu
      const definition: WordDefinition = {
        englishDefinition:
          parsedDefinition.englishDefinition || "Definition not available",
        vietnameseDefinition:
          parsedDefinition.vietnameseDefinition || "Không có bản dịch",
        examples:
          Array.isArray(parsedDefinition.examples) &&
          parsedDefinition.examples.length > 0
            ? parsedDefinition.examples
            : ["No examples available"],
      };

      // Lưu kết quả vào cache
      wordStore.cacheDefinition(word.word, definition);
      console.log(`Definition for "${word.word}" saved to cache`);

      // Xóa từ khỏi danh sách đang xử lý
      processingDefinitions.delete(word.word);

      return definition;
    } catch (jsonError) {
      console.error("Error parsing JSON response:", jsonError);
      console.log("Raw response:", response);

      // Trả về dữ liệu mặc định nếu không thể parse JSON
      const fallbackDefinition: WordDefinition = {
        englishDefinition: "Failed to parse definition",
        vietnameseDefinition: "Không thể phân tích định nghĩa",
        examples: ["Failed to load examples"],
      };

      // Xóa từ khỏi danh sách đang xử lý
      processingDefinitions.delete(word.word);

      return fallbackDefinition;
    }
  } catch (error) {
    // Xóa từ khỏi danh sách đang xử lý trong trường hợp lỗi
    processingDefinitions.delete(word.word);

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
      console.log(`Quiz for "${word.word}" loaded from cache`);
      return cachedQuiz;
    }

    // Nếu từ này đang được xử lý, chờ một chút và thử lại cache
    if (processingQuizzes.has(word.word)) {
      console.log(
        `Quiz for "${word.word}" is already being processed, waiting...`
      );

      // Chờ 500ms và thử lại từ cache
      await new Promise((resolve) => setTimeout(resolve, 500));

      const updatedCache = wordStore.getCachedQuizQuestion(word.word);
      if (updatedCache) {
        return updatedCache;
      }

      // Nếu vẫn không có trong cache, tiếp tục xử lý
    }

    // Đánh dấu từ này đang được xử lý
    processingQuizzes.add(word.word);
    console.log(`Fetching quiz for "${word.word}" from API`);

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
    console.log(`Quiz for "${word.word}" saved to cache`);

    // Xóa từ khỏi danh sách đang xử lý
    processingQuizzes.delete(word.word);

    return quizQuestion;
  } catch (error) {
    // Xóa từ khỏi danh sách đang xử lý trong trường hợp lỗi
    processingQuizzes.delete(word.word);

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
