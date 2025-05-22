import { useWordStore } from "../store/wordStore";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

export const ProgressPage = () => {
  const { resetProgress, getCompletionStats, setSelectedStatus } =
    useWordStore();
  const navigate = useNavigate();

  const stats = getCompletionStats();
  const notStarted = useMemo(
    () => stats.total - stats.completed - stats.inProgress,
    [stats]
  );

  const handleResetProgress = () => {
    if (
      window.confirm(
        "Are you sure you want to reset all your progress? This cannot be undone."
      )
    ) {
      resetProgress();
    }
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
      <h1 className="text-2xl font-bold mb-6">Your Learning Progress</h1>

      <div className="card mb-8">
        <h2 className="text-xl font-semibold mb-4">Overall Progress</h2>

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
      </div>

      <div className="mt-8 text-center">
        <button onClick={handleResetProgress} className="btn btn-danger">
          Reset All Progress
        </button>
        <p className="mt-2 text-sm text-gray-500">
          This will reset all your learning progress and cannot be undone.
        </p>
      </div>
    </div>
  );
};
