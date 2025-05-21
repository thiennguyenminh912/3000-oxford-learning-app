import { useWordStore } from "../store/wordStore";
import { useMemo } from "react";

export const ProgressPage = () => {
  const { resetProgress, getCompletionStats } = useWordStore();

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
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {stats.total}
            </div>
            <div className="text-sm text-gray-600">Total Words</div>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {stats.completed}
            </div>
            <div className="text-sm text-gray-600">Learned</div>
          </div>
          <div className="p-4 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">
              {stats.inProgress}
            </div>
            <div className="text-sm text-gray-600">In Progress</div>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-600">{notStarted}</div>
            <div className="text-sm text-gray-600">Not Started</div>
          </div>
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
