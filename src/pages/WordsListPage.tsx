import { useState, useEffect } from "react";
import { useWordStore } from "../store/wordStore";
import type { WordData } from "../utils/wordUtils";
import { REQUIRED_WORD_ENCOUNTERS } from "../utils/constants";

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
  } = useWordStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [displayWords, setDisplayWords] = useState<WordData[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const wordsPerPage = 20;

  // Status options for filtering
  const statusOptions = [
    { value: null, label: "All Statuses" },
    { value: "new", label: "New" },
    { value: "learning", label: "Learning" },
    { value: "known", label: "Known" },
    { value: "skipped", label: "Skipped" },
  ];

  useEffect(() => {
    // Update search term in store when local search query changes
    setSearchTerm(searchQuery);

    // Get filtered words based on current filters
    const filteredWords = getFilteredWords();
    setDisplayWords(filteredWords);
    setCurrentPage(1);
  }, [
    searchQuery,
    getFilteredWords,
    selectedLevel,
    selectedStatus,
    setSearchTerm,
  ]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleStatusChange = (wordId: string, status: WordData["status"]) => {
    updateWordStatus(wordId, status);
  };

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
      value === "known" ||
      value === "skipped"
    ) {
      setSelectedStatus(value);
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
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-2 mb-6">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Word List</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Search Input */}
          <div>
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
          {searchQuery && ` matching "${searchQuery}"`}
        </div>

        {/* Word List */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6 border border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-1 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Word
                  </th>
                  <th
                    scope="col"
                    className="px-1 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Progress
                  </th>
                  <th
                    scope="col"
                    className="px-1 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentWords.length > 0 ? (
                  currentWords.map((word, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-1 py-3 whitespace-nowrap">
                        <div className="font-medium text-gray-900">
                          {word.word}
                        </div>
                        {word.phonetics && (
                          <div className="text-xs text-gray-500">
                            {word.phonetics.uk}
                          </div>
                        )}
                      </td>
                      <td className="px-1 py-3 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-24 h-2 bg-gray-200 rounded-full mr-2">
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
                      <td className="px-1 py-3 whitespace-nowrap">
                        <select
                          className="text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          value={word.status || "new"}
                          onChange={(e) =>
                            handleStatusChange(
                              word.word,
                              e.target.value as WordData["status"]
                            )
                          }
                        >
                          <option value="new">New</option>
                          <option value="learning">Learning</option>
                          <option value="known">Known</option>
                          <option value="skipped">Skip</option>
                        </select>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={5}
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
    </div>
  );
};
