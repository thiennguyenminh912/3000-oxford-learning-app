import { useState } from "react";
import { Link } from "react-router-dom";
import { useWordStore } from "../store/wordStore";

export const HomePage = () => {
  const { getCompletionStats, resetProgress } = useWordStore();
  const stats = getCompletionStats();
  const [showConfirm, setShowConfirm] = useState(false);

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

  return (
    <div className="max-w-2xl mx-auto">
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
          <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full"
              style={{ width: `${stats.percentComplete}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {stats.total}
            </div>
            <div className="text-sm text-gray-600">Total Words</div>
          </div>
          <div className="p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {stats.completed}
            </div>
            <div className="text-sm text-gray-600">Learned</div>
          </div>
          <div className="p-3 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">
              {stats.inProgress}
            </div>
            <div className="text-sm text-gray-600">In Progress</div>
          </div>
        </div>

        <div className="mt-6 flex flex-col md:flex-row gap-3">
          <Link to="/progress" className="btn btn-secondary text-center flex-1">
            View Detailed Progress
          </Link>
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
