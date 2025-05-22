import { useState, useEffect } from "react";
import { useWordStore } from "../store/wordStore";
import type { WordData } from "../utils/wordUtils";

export const WordsListPage = () => {
  const {
    selectedLevel,
    selectedCategory,

    updateWordStatus,
    getFilteredWords,
  } = useWordStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [displayWords, setDisplayWords] = useState<WordData[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const wordsPerPage = 20;

  useEffect(() => {
    const filteredWords = getFilteredWords().filter((word) =>
      word.word.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setDisplayWords(filteredWords);
    setCurrentPage(1);
  }, [searchQuery, getFilteredWords, selectedLevel, selectedCategory]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleStatusChange = (wordId: string, status: WordData["status"]) => {
    updateWordStatus(wordId, status);
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
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Oxford 4999+ Words List</h1>

      <div className="card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label
              htmlFor="search"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Search
            </label>
            <input
              type="text"
              id="search"
              className="input w-full"
              placeholder="Search words..."
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Word
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Level
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Category
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Progress
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentWords.length > 0 ? (
                currentWords.map((word) => (
                  <tr key={word.word} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium">{word.word}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                        {word.level}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-500">
                        {word.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-full h-2 bg-gray-200 rounded-full mr-2">
                          <div
                            className="h-2 bg-green-500 rounded-full"
                            style={{
                              width: `${Math.min(
                                ((word.encounters || 0) / 22) * 100,
                                100
                              )}%`,
                            }}
                          />
                        </div>
                        <span className="text-xs text-gray-500">
                          {word.encounters || 0}/22
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        className="text-sm border-gray-300 rounded-md"
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

      {totalPages > 1 && (
        <div className="flex justify-between items-center">
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="btn btn-secondary disabled:opacity-50"
          >
            Previous
          </button>

          <span className="text-sm text-gray-700">
            Page {currentPage} of {totalPages}
          </span>

          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="btn btn-secondary disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};
