import { useState, useEffect, useCallback } from "react";
import { useWordStore } from "../store/wordStore";
import type { WordData } from "../utils/wordUtils";
import {
  getCustomWords,
  saveCustomWord,
  updateCustomWordNote,
  saveWordNote,
  deleteCustomWord,
} from "../utils/wordUtils";
import { WordDetailPopup } from "../components/WordDetailPopup";
import { AddWordModal } from "../components/AddWordModal";
import { REQUIRED_WORD_ENCOUNTERS } from "../utils/constants";

// Debounce hook
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

export const WordsListPage = () => {
  const {
    levels,
    selectedLevel,
    selectedStatus,
    updateWordStatus,
    getFilteredWords,
    setSelectedLevel,
    setSelectedStatus,
    setSearchTerm,
    words,
  } = useWordStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [displayWords, setDisplayWords] = useState<WordData[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [revealedMeanings, setRevealedMeanings] = useState<Set<string>>(
    new Set()
  );
  const [selectedWord, setSelectedWord] = useState<WordData | null>(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [isAddWordModalOpen, setIsAddWordModalOpen] = useState(false);
  const [customWords, setCustomWords] = useState<WordData[]>([]);
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [editingNoteValue, setEditingNoteValue] = useState("");
  const [sortField, setSortField] = useState<"word" | "last_updated" | null>(
    null
  );
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const wordsPerPage = 20;

  // Debounce search query with 300ms delay
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Load custom words from localStorage
  useEffect(() => {
    const customWordsData = getCustomWords();
    setCustomWords(customWordsData);
  }, []);

  // Handle sorting
  const handleSort = (field: "word" | "last_updated") => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // Set new field and default to asc
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Sort words based on current sort settings
  const sortWords = (words: WordData[]) => {
    if (!sortField) return words;

    return [...words].sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      if (sortField === "word") {
        aValue = a.word.toLowerCase();
        bValue = b.word.toLowerCase();
      } else if (sortField === "last_updated") {
        aValue = a.last_updated || "";
        bValue = b.last_updated || "";
      } else {
        return 0;
      }

      if (aValue < bValue) {
        return sortDirection === "asc" ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortDirection === "asc" ? 1 : -1;
      }
      return 0;
    });
  };

  // Status options for filtering
  const statusOptions = [
    { value: null, label: "All Statuses" },
    { value: "new", label: "New" },
    { value: "learning", label: "Learning" },
    { value: "focus", label: "Focus" },
    { value: "known", label: "Known" },
  ];

  // Get color based on word status
  const getWordColor = (status: string | undefined) => {
    switch (status) {
      case "new":
        return "text-gray-600"; // Gray for new words
      case "learning":
        return "text-blue-600"; // Blue for learning words
      case "focus":
        return "text-purple-600"; // Purple for focus words
      case "known":
        return "text-green-600"; // Green for known words
      case "skipped":
        return "text-red-600"; // Red for skipped words
      default:
        return "text-gray-600"; // Default gray
    }
  };

  // Get background color based on word status
  const getWordBgColor = (status: string | undefined) => {
    switch (status) {
      case "new":
        return "bg-gray-50"; // Light gray background
      case "learning":
        return "bg-blue-50"; // Light blue background
      case "focus":
        return "bg-purple-50"; // Light purple background
      case "known":
        return "bg-green-50"; // Light green background
      case "skipped":
        return "bg-red-50"; // Light red background
      default:
        return "bg-white"; // Default white
    }
  };

  useEffect(() => {
    // Update search term in store when debounced search query changes
    setSearchTerm(debouncedSearchQuery);

    // Get filtered words based on current filters
    const filteredWords = getFilteredWords();

    // Combine with custom words
    const allWords = [...filteredWords, ...customWords];

    // Remove duplicates (custom words take precedence)
    const uniqueWords = allWords.filter(
      (word, index, self) =>
        index === self.findIndex((w) => w.word === word.word)
    );

    // Apply sorting
    const sortedWords = sortWords(uniqueWords);

    setDisplayWords(sortedWords);
    setCurrentPage(1);
  }, [
    debouncedSearchQuery,
    getFilteredWords,
    selectedLevel,
    selectedStatus,
    setSearchTerm,
    words,
    customWords,
    sortField,
    sortDirection,
  ]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleStatusChange = useCallback(
    (wordId: string, status: WordData["status"]) => {
      updateWordStatus(wordId, status);

      // Update displayWords immediately to reflect the change
      setDisplayWords((prev) =>
        prev.map((word) =>
          word.word === wordId
            ? { ...word, status, last_updated: new Date().toISOString() }
            : word
        )
      );
    },
    [updateWordStatus]
  );

  const handleLevelFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedLevel(value === "all" ? null : value);
  };

  const handleStatusFilterChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const value = e.target.value;
    if (value === "all") {
      setSelectedStatus(null);
    } else if (
      value === "new" ||
      value === "learning" ||
      value === "focus" ||
      value === "known" ||
      value === "skipped"
    ) {
      setSelectedStatus(value);
    }
  };

  const toggleMeaning = (wordId: string) => {
    setRevealedMeanings((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(wordId)) {
        newSet.delete(wordId);
      } else {
        newSet.add(wordId);
      }
      return newSet;
    });
  };

  const handleWordClick = (word: WordData) => {
    setSelectedWord(word);
    setIsPopupOpen(true);
  };

  const closePopup = () => {
    setIsPopupOpen(false);
    setSelectedWord(null);
  };

  const toggleMobileFilters = () => {
    setShowMobileFilters(!showMobileFilters);
  };

  const handleAddWord = (newWord: WordData) => {
    saveCustomWord(newWord);
    setCustomWords((prev) => [...prev, newWord]);

    // Reload wordStore to include the new custom word
    const wordStore = useWordStore.getState();
    wordStore.loadWords();

    // Reload words in LearnPage if it's open
    if ((window as any).reloadLearnPageWords) {
      (window as any).reloadLearnPageWords();
    }
  };

  const openAddWordModal = () => {
    setIsAddWordModalOpen(true);
  };

  const closeAddWordModal = () => {
    setIsAddWordModalOpen(false);
  };

  // Note editing functions
  const startEditingNote = (wordId: string, currentNote: string) => {
    setEditingNote(wordId);
    setEditingNoteValue(currentNote || "");
  };

  const saveNote = (wordId: string) => {
    // Save note for all words using the new system
    saveWordNote(wordId, editingNoteValue);

    // Update custom word note if it's a custom word
    if (customWords.some((w) => w.word === wordId)) {
      updateCustomWordNote(wordId, editingNoteValue);

      // Update local state for custom words
      setCustomWords((prev) =>
        prev.map((word) =>
          word.word === wordId ? { ...word, note: editingNoteValue } : word
        )
      );
    }

    // Update display words to reflect the change
    setDisplayWords((prev) =>
      prev.map((word) =>
        word.word === wordId
          ? {
              ...word,
              note: editingNoteValue,
              last_updated: new Date().toISOString(),
            }
          : word
      )
    );

    // Reload wordStore to update notes
    const wordStore = useWordStore.getState();
    wordStore.loadWords();

    setEditingNote(null);
    setEditingNoteValue("");
  };

  const cancelEditingNote = () => {
    setEditingNote(null);
    setEditingNoteValue("");
  };

  const deleteWord = (wordId: string) => {
    // Only allow deletion of custom words
    if (customWords.some((w) => w.word === wordId)) {
      // Delete from localStorage
      deleteCustomWord(wordId);

      // Remove from local state
      setCustomWords((prev) => prev.filter((word) => word.word !== wordId));

      // Remove from display words
      setDisplayWords((prev) => prev.filter((word) => word.word !== wordId));

      // Remove from wordStore
      const wordStore = useWordStore.getState();
      wordStore.removeWord(wordId);
    }
  };

  // Pagination
  const totalPages = Math.ceil(displayWords.length / wordsPerPage);
  const indexOfLastWord = currentPage * wordsPerPage;
  const indexOfFirstWord = indexOfLastWord - wordsPerPage;
  const currentWords = displayWords.slice(indexOfFirstWord, indexOfLastWord);

  const goToPage = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  return (
    <div className="max-w-8xl mx-auto">
      {/* Desktop Add Button - Top Right */}
      <div className="hidden md:block absolute top-20 right-4 z-30 mr-10">
        <button
          onClick={openAddWordModal}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg shadow-lg hover:bg-blue-700 transition-colors"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Add Word
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-1 mb-6">
        {/* Mobile Filter Toggle */}
        <div className="md:hidden mb-4">
          <button
            onClick={toggleMobileFilters}
            className="flex items-center justify-between w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors"
          >
            <span className="text-sm font-medium text-gray-700">
              {showMobileFilters ? "Hide Filters" : "Show More Filters"}
            </span>
            <svg
              className={`h-5 w-5 text-gray-500 transition-transform ${
                showMobileFilters ? "rotate-180" : ""
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
        </div>

        {/* Search Input - Always visible on mobile */}
        <div className="mb-4 md:mb-0">
          <label
            htmlFor="search"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Search Words
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg
                className="h-5 w-5 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <input
              type="text"
              id="search"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Search words..."
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>
        </div>

        {/* Additional Filters - Hidden on mobile by default */}
        <div
          className={`grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 ${
            showMobileFilters ? "block" : "hidden md:grid"
          }`}
        >
          {/* Level Filter */}
          <div>
            <label
              htmlFor="level-filter"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Level
            </label>
            <select
              id="level-filter"
              className="block w-full border border-gray-300 rounded-md shadow-sm py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={selectedLevel || "all"}
              onChange={handleLevelFilterChange}
            >
              <option value="all">All Levels</option>
              {levels.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label
              htmlFor="status-filter"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Status
            </label>
            <select
              id="status-filter"
              className="block w-full border border-gray-300 rounded-md shadow-sm py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={selectedStatus || "all"}
              onChange={handleStatusFilterChange}
            >
              {statusOptions.map((option) => (
                <option key={option.label} value={option.value || "all"}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Results Counter */}
        <div className="text-sm text-gray-600 mb-4">
          Found {displayWords.length}{" "}
          {displayWords.length === 1 ? "word" : "words"}
          {selectedLevel && ` in level ${selectedLevel}`}
          {selectedStatus && ` with status "${selectedStatus}"`}
          {debouncedSearchQuery && ` matching "${debouncedSearchQuery}"`}
        </div>

        {/* Word List */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6 border border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {/* Word - Always visible */}
                  <th
                    scope="col"
                    className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px] cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort("word")}
                  >
                    <div className="flex items-center gap-1">
                      Word
                      {sortField === "word" && (
                        <svg
                          className={`w-4 h-4 ${
                            sortDirection === "asc" ? "rotate-180" : ""
                          }`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                          />
                        </svg>
                      )}
                    </div>
                  </th>

                  {/* Vietnamese Meaning - Always visible */}
                  <th
                    scope="col"
                    className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]"
                  >
                    Vietnamese
                  </th>

                  {/* English Explanation - Always visible */}
                  <th
                    scope="col"
                    className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[200px]  hidden lg:table-cell"
                  >
                    English Explanation
                  </th>

                  {/* Example - Desktop only */}
                  <th
                    scope="col"
                    className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[250px] hidden xl:table-cell"
                  >
                    Example
                  </th>

                  {/* Note - Desktop only */}
                  <th
                    scope="col"
                    className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[150px] hidden xl:table-cell"
                  >
                    Note
                  </th>

                  {/* Last Updated - Desktop only */}
                  <th
                    scope="col"
                    className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[150px] hidden xl:table-cell cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort("last_updated")}
                  >
                    <div className="flex items-center gap-1">
                      Last Updated
                      {sortField === "last_updated" && (
                        <svg
                          className={`w-4 h-4 ${
                            sortDirection === "asc" ? "rotate-180" : ""
                          }`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                          />
                        </svg>
                      )}
                    </div>
                  </th>

                  {/* Progress - Always visible */}
                  <th
                    scope="col"
                    className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px] hidden lg:table-cell"
                  >
                    Progress
                  </th>

                  {/* Status - Always visible */}
                  <th
                    scope="col"
                    className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]"
                  >
                    Status
                  </th>

                  {/* Actions - Always visible */}
                  <th
                    scope="col"
                    className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[80px]"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentWords.length > 0 ? (
                  currentWords.map((word, index) => (
                    <tr
                      key={index}
                      className={`hover:bg-gray-50 ${getWordBgColor(
                        word.status
                      )}`}
                    >
                      {/* Word */}
                      <td
                        className="px-3 py-4 whitespace-nowrap cursor-pointer"
                        onClick={() => handleWordClick(word)}
                      >
                        <div
                          className={`font-medium ${getWordColor(word.status)}`}
                        >
                          {word.word}
                          {word.type === "custom" && (
                            <span className="ml-2 text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                              Custom
                            </span>
                          )}
                        </div>
                        {word.phonetics && (
                          <div className="text-xs text-gray-500">
                            {word.phonetics.uk}
                          </div>
                        )}
                      </td>

                      {/* Vietnamese Meaning */}
                      <td className="px-3 py-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleMeaning(word.word);
                          }}
                          className="text-left w-full hover:text-blue-600 transition-colors"
                        >
                          {revealedMeanings.has(word.word) ? (
                            <span className="text-sm text-gray-700">
                              {word.vn_meaning}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-400">
                              ******
                            </span>
                          )}
                        </button>
                      </td>

                      {/* English Explanation */}
                      <td
                        className="px-3 py-4 cursor-pointer hidden lg:table-cell"
                        onClick={() => handleWordClick(word)}
                      >
                        <div
                          className="text-sm text-gray-700 max-w-xs"
                          title={word.eng_explanation}
                        >
                          {word.eng_explanation}
                        </div>
                      </td>

                      {/* Example */}
                      <td
                        className="px-3 py-4 hidden xl:table-cell cursor-pointer"
                        onClick={() => handleWordClick(word)}
                      >
                        <div
                          className="text-sm text-gray-600 italic max-w-xs"
                          dangerouslySetInnerHTML={{
                            __html: Array.isArray(word.example)
                              ? `· ${word.example.join("<br />· ")}`
                              : word.example || "",
                          }}
                        />
                      </td>

                      {/* Note */}
                      <td className="px-3 py-4 whitespace-nowrap hidden xl:table-cell">
                        {editingNote === word.word ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={editingNoteValue}
                              onChange={(e) =>
                                setEditingNoteValue(e.target.value)
                              }
                              className="flex-1 text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  saveNote(word.word);
                                } else if (e.key === "Escape") {
                                  cancelEditingNote();
                                }
                              }}
                              autoFocus
                            />
                            <button
                              onClick={() => saveNote(word.word)}
                              className="text-green-600 hover:text-green-800"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            </button>
                            <button
                              onClick={cancelEditingNote}
                              className="text-red-600 hover:text-red-800"
                            >
                              <svg
                                className="w-4 h-4"
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
                        ) : (
                          <div
                            className="text-sm text-gray-600 max-w-xs cursor-pointer hover:bg-gray-100 p-1 rounded"
                            onClick={() =>
                              startEditingNote(word.word, word.note || "")
                            }
                          >
                            {word.note ? (
                              <span className="text-gray-700">{word.note}</span>
                            ) : (
                              <span className="text-gray-400 italic">
                                Click to add note
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Last Updated - Desktop only */}
                      <td className="px-3 py-4 whitespace-nowrap hidden xl:table-cell">
                        <div className="text-sm text-gray-600">
                          {word.last_updated ? (
                            <span
                              title={new Date(
                                word.last_updated
                              ).toLocaleString()}
                            >
                              {new Date(word.last_updated).toLocaleDateString()}
                              <br />
                              {new Date(word.last_updated).toLocaleTimeString()}
                            </span>
                          ) : (
                            <span className="text-gray-400 italic">Never</span>
                          )}
                        </div>
                      </td>

                      {/* Progress */}
                      <td
                        className="px-3 py-4 whitespace-nowrap hidden lg:table-cell cursor-pointer"
                        onClick={() => handleWordClick(word)}
                      >
                        <div className="flex items-center">
                          <div className="w-16 h-2 bg-gray-200 rounded-full mr-2">
                            <div
                              className="h-2 bg-green-500 rounded-full"
                              style={{
                                width: `${Math.min(
                                  ((word.encounters || 0) /
                                    REQUIRED_WORD_ENCOUNTERS) *
                                    100,
                                  100
                                )}%`,
                              }}
                            />
                          </div>
                          <span className="text-xs text-gray-500">
                            {word.encounters || 0}/{REQUIRED_WORD_ENCOUNTERS}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-3 py-4 whitespace-nowrap">
                        <select
                          className="text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          value={word.status || "new"}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleStatusChange(
                              word.word,
                              e.target.value as WordData["status"]
                            );
                          }}
                        >
                          <option value="new">New</option>
                          <option value="learning">Learning</option>
                          <option value="focus">Focus</option>
                          <option value="known">Known</option>
                          <option value="skipped">Skip</option>
                        </select>
                      </td>

                      {/* Actions */}
                      <td className="px-3 py-4 whitespace-nowrap">
                        {word.type === "custom" && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (
                                window.confirm(
                                  `Are you sure you want to delete "${word.word}"?`
                                )
                              ) {
                                deleteWord(word.word);
                              }
                            }}
                            className="text-red-600 hover:text-red-800 transition-colors"
                            title="Delete word"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1H9a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-6 py-4 text-center text-gray-500"
                    >
                      No words match your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
            <div className="flex flex-1 justify-between">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="relative inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>

              <div className="text-sm text-gray-700 pt-2">
                Page <span className="font-medium">{currentPage}</span> of{" "}
                <span className="font-medium">{totalPages}</span>
              </div>

              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="relative inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Add Button - Bottom Right */}
      <div className="md:hidden fixed bottom-20 right-6 z-40">
        <button
          onClick={openAddWordModal}
          className="w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
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
              d="M12 4v16m8-8H4"
            />
          </svg>
        </button>
      </div>

      {/* Word Detail Popup */}
      {selectedWord && (
        <WordDetailPopup
          word={selectedWord}
          isOpen={isPopupOpen}
          onClose={closePopup}
        />
      )}

      {/* Add Word Modal */}
      <AddWordModal
        isOpen={isAddWordModalOpen}
        onClose={closeAddWordModal}
        onAddWord={handleAddWord}
        initialWord={debouncedSearchQuery}
      />
    </div>
  );
};
