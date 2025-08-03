import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useWordStore } from "../store/wordStore";

export const HomePage = () => {
  const { getCompletionStats, resetProgress, setSelectedStatus } =
    useWordStore();
  const navigate = useNavigate();
  const stats = getCompletionStats();
  const [showConfirm, setShowConfirm] = useState(false);

  const notStarted = useMemo(
    () => stats.total - stats.completed - stats.inProgress,
    [stats]
  );

  const handleResetClick = () => {
    setShowConfirm(true);
  };

  const confirmReset = () => {
    resetProgress();
    setShowConfirm(false);
  };

  const cancelReset = () => {
    setShowConfirm(false);
  };

  // Function to navigate to Words page with appropriate filter
  const navigateToWords = (status: string | null) => {
    // Set the filter
    setSelectedStatus(status);

    // Navigate to Words page
    navigate("/words");
  };

  // Common class for stat boxes
  const statBoxClass =
    "p-4 rounded-lg cursor-pointer transform transition-all duration-200 hover:scale-105 hover:shadow-md active:scale-95 flex flex-col items-center justify-center relative";

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-center">
        Oxford 5000+ Vocabulary Builder
      </h1>

      <div className="card mb-8">
        <h2 className="text-xl font-semibold mb-4">Your Progress</h2>

        <div className="mb-4">
          <div className="flex justify-between mb-2">
            <span>Overall Completion</span>
            <span className="font-medium">{stats.percentComplete}%</span>
          </div>
          <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full"
              style={{ width: `${stats.percentComplete}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div
            onClick={() => navigateToWords(null)}
            className={`${statBoxClass} bg-blue-50 hover:bg-blue-100 active:bg-blue-200`}
            role="button"
            aria-label="View all words"
          >
            <div className="text-2xl font-bold text-blue-600">
              {stats.total}
            </div>
            <div className="text-sm text-gray-600">Total Words</div>
            <div className="absolute top-1 right-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 text-blue-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </div>
          </div>
          <div
            onClick={() => navigateToWords("known")}
            className={`${statBoxClass} bg-green-50 hover:bg-green-100 active:bg-green-200`}
            role="button"
            aria-label="View learned words"
          >
            <div className="text-2xl font-bold text-green-600">
              {stats.completed}
            </div>
            <div className="text-sm text-gray-600">Learned</div>
            <div className="absolute top-1 right-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </div>
          </div>
          <div
            onClick={() => navigateToWords("learning")}
            className={`${statBoxClass} bg-yellow-50 hover:bg-yellow-100 active:bg-yellow-200`}
            role="button"
            aria-label="View in-progress words"
          >
            <div className="text-2xl font-bold text-yellow-600">
              {stats.inProgress}
            </div>
            <div className="text-sm text-gray-600">In Progress</div>
            <div className="absolute top-1 right-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 text-yellow-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </div>
          </div>
          <div
            onClick={() => navigateToWords("new")}
            className={`${statBoxClass} bg-gray-50 hover:bg-gray-100 active:bg-gray-200`}
            role="button"
            aria-label="View new words"
          >
            <div className="text-2xl font-bold text-gray-600">{notStarted}</div>
            <div className="text-sm text-gray-600">Not Started</div>
            <div className="absolute top-1 right-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 text-gray-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </div>
          </div>
        </div>
        <div className="mt-4 text-xs text-center text-gray-500">
          Tap on any category to view filtered words
        </div>

        <div className="mt-6 flex flex-col md:flex-row gap-3">
          <button
            onClick={handleResetClick}
            className="btn btn-danger text-center"
          >
            Reset All Progress
          </button>
        </div>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-xl font-semibold mb-4">Reset Progress</h3>
            <p className="mb-6">
              Are you sure you want to reset all your learning progress? This
              cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={cancelReset} className="btn btn-secondary">
                Cancel
              </button>
              <button onClick={confirmReset} className="btn btn-danger">
                Reset Everything
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <Link to="/learn" className="block">
          <div className="card flex items-center p-6 hover:bg-blue-50 transition-colors">
            <div className="flex-shrink-0 bg-blue-100 p-3 rounded-full mr-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-blue-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-1">Start Learning</h3>
              <p className="text-gray-600">
                Practice with flashcards, quizzes, and more
              </p>
            </div>
          </div>
        </Link>

        <Link to="/words" className="block">
          <div className="card flex items-center p-6 hover:bg-blue-50 transition-colors">
            <div className="flex-shrink-0 bg-blue-100 p-3 rounded-full mr-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-blue-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-1">Browse Words</h3>
              <p className="text-gray-600">
                Explore all 5000+ Oxford words by level or category
              </p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
};
