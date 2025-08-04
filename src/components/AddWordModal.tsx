import { useState, useEffect } from "react";
import type { WordData } from "../utils/wordUtils";

interface AddWordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddWord: (word: WordData) => void;
  initialWord?: string;
}

export const AddWordModal: React.FC<AddWordModalProps> = ({
  isOpen,
  onClose,
  onAddWord,
  initialWord = "",
}) => {
  const [formData, setFormData] = useState({
    word: initialWord,
    vn_meaning: "",
    eng_explanation: "",
    example: "",
    note: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      setFormData({
        word: initialWord,
        vn_meaning: "",
        eng_explanation: "",
        example: "",
        note: "",
      });
      setErrors({});
    }
  }, [isOpen, initialWord]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.word?.trim()) {
      newErrors.word = "Word is required";
    }

    if (!formData.vn_meaning?.trim()) {
      newErrors.vn_meaning = "Vietnamese meaning is required";
    }

    if (!formData.eng_explanation?.trim()) {
      newErrors.eng_explanation = "English explanation is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const newWord: WordData = {
      word: formData.word.trim(),
      vn_meaning: formData.vn_meaning.trim(),
      eng_explanation: formData.eng_explanation.trim(),
      example: formData.example.trim() || undefined,
      note: formData.note.trim() || undefined,
      status: "new",
      encounters: 0,
      type: "custom", // Mark as custom word
    };

    onAddWord(newWord);
    onClose();
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Add New Word
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg
                className="w-6 h-6"
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

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Word */}
            <div>
              <label
                htmlFor="word"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Word *
              </label>
              <input
                type="text"
                id="word"
                name="word"
                value={formData.word}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.word ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Enter word"
              />
              {errors.word && (
                <p className="text-red-500 text-sm mt-1">{errors.word}</p>
              )}
            </div>

            {/* Vietnamese Meaning */}
            <div>
              <label
                htmlFor="vn_meaning"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Vietnamese Meaning *
              </label>
              <input
                type="text"
                id="vn_meaning"
                name="vn_meaning"
                value={formData.vn_meaning}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.vn_meaning ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Enter Vietnamese meaning"
              />
              {errors.vn_meaning && (
                <p className="text-red-500 text-sm mt-1">{errors.vn_meaning}</p>
              )}
            </div>

            {/* English Explanation */}
            <div>
              <label
                htmlFor="eng_explanation"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                English Explanation *
              </label>
              <textarea
                id="eng_explanation"
                name="eng_explanation"
                value={formData.eng_explanation}
                onChange={handleInputChange}
                rows={3}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.eng_explanation ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Enter English explanation"
              />
              {errors.eng_explanation && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.eng_explanation}
                </p>
              )}
            </div>

            {/* Example */}
            <div>
              <label
                htmlFor="example"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Example (Optional)
              </label>
              <textarea
                id="example"
                name="example"
                value={formData.example}
                onChange={handleInputChange}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter example sentence"
              />
            </div>

            {/* Note */}
            <div>
              <label
                htmlFor="note"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Note (Optional)
              </label>
              <textarea
                id="note"
                name="note"
                value={formData.note}
                onChange={handleInputChange}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Add a personal note about this word"
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Add Word
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
