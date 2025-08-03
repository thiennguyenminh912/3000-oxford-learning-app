import { useWordStore } from "../store/wordStore";

export const SettingsPage = () => {
  const {
    levels,
    selectedLearningLevels,
    setSelectedLearningLevels,
    selectedLearningStatuses,
    setSelectedLearningStatuses,
    useSmart,
    sessionLength,
    setSessionLength,
    setUseSmart,
  } = useWordStore();

  console.log("selectedLearningLevels", selectedLearningLevels);

  const handleSessionLengthChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setSessionLength(Number(e.target.value));
  };

  const toggleLearningMode = () => {
    setUseSmart(!useSmart);
  };

  const handleLevelChange = (level: string) => {
    setSelectedLearningLevels(
      selectedLearningLevels.includes(level)
        ? selectedLearningLevels.filter((l) => l !== level)
        : [...selectedLearningLevels, level]
    );
  };

  const selectAllLevels = () => {
    setSelectedLearningLevels([...levels]);
  };

  const clearAllLevels = () => {
    setSelectedLearningLevels([]);
  };

  const handleStatusChange = (status: string) => {
    setSelectedLearningStatuses(
      selectedLearningStatuses.includes(status)
        ? selectedLearningStatuses.filter((s) => s !== status)
        : [...selectedLearningStatuses, status]
    );
  };

  const selectAllStatuses = () => {
    setSelectedLearningStatuses(["new", "learning", "focus", "known"]);
  };

  const clearAllStatuses = () => {
    setSelectedLearningStatuses([]);
  };

  const statusOptions = [
    { value: "new", label: "New", color: "text-gray-600" },
    { value: "learning", label: "Learning", color: "text-blue-600" },
    { value: "focus", label: "Focus", color: "text-purple-600" },
    { value: "known", label: "Known", color: "text-green-600" },
  ];

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-center">Settings</h1>

      <div className="card mb-6">
        <h2 className="text-xl font-semibold mb-4">Learning Preferences</h2>

        <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mb-4">
          <div>
            <label
              htmlFor="session-length"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Session Length (words)
            </label>
            <input
              id="session-length"
              type="number"
              min="1"
              max="50"
              className="input w-full"
              value={sessionLength}
              onChange={handleSessionLengthChange}
            />
            <p className="text-xs text-gray-500 mt-1">
              Number of words to study in each learning session
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            Smart Learning
          </span>
          <button
            onClick={toggleLearningMode}
            className={`relative inline-flex items-center h-6 rounded-full w-11 ${
              useSmart ? "bg-blue-600" : "bg-gray-300"
            }`}
          >
            <span className="sr-only">Toggle Smart Learning</span>
            <span
              className={`${
                useSmart ? "translate-x-6" : "translate-x-1"
              } inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-200 ease-in-out`}
            />
          </button>
        </div>
        <p className="text-xs text-gray-500 mb-4">
          {useSmart
            ? "Smart mode: mixes new words and words that need review to help you remember better."
            : "Traditional mode: words are sorted by encounter count."}
        </p>
      </div>

      <div className="card mb-6">
        <h2 className="text-xl font-semibold mb-4">Learning Levels</h2>
        <p className="text-sm text-gray-600 mb-4">
          Select which levels you want to study in the Learn page. Leave empty
          to study all levels.
        </p>

        <div className="space-y-3">
          <div className="flex gap-2 mb-3">
            <button
              onClick={selectAllLevels}
              className="btn btn-secondary text-xs"
            >
              Select All
            </button>
            <button
              onClick={clearAllLevels}
              className="btn btn-secondary text-xs"
            >
              Clear All
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {levels.map((level) => (
              <label
                key={level}
                className="flex items-center space-x-2 cursor-pointer p-2 rounded border hover:bg-gray-50"
              >
                <input
                  type="checkbox"
                  checked={selectedLearningLevels.includes(level)}
                  onChange={() => handleLevelChange(level)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium">{level}</span>
              </label>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {selectedLearningLevels.length === 0
              ? "All levels will be included in learning sessions"
              : `Selected levels: ${selectedLearningLevels.join(", ")}`}
          </p>
        </div>
      </div>

      <div className="card mb-6">
        <h2 className="text-xl font-semibold mb-4">Learning Statuses</h2>
        <p className="text-sm text-gray-600 mb-4">
          Select which statuses you want to study in the Learn page. Leave empty
          to study all statuses.
        </p>

        <div className="space-y-3">
          <div className="flex gap-2 mb-3">
            <button
              onClick={selectAllStatuses}
              className="btn btn-secondary text-xs"
            >
              Select All
            </button>
            <button
              onClick={clearAllStatuses}
              className="btn btn-secondary text-xs"
            >
              Clear All
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {statusOptions.map((status) => (
              <label
                key={status.value}
                className="flex items-center space-x-2 cursor-pointer p-2 rounded border hover:bg-gray-50"
              >
                <input
                  type="checkbox"
                  checked={selectedLearningStatuses.includes(status.value)}
                  onChange={() => handleStatusChange(status.value)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span className={`text-sm font-medium ${status.color}`}>
                  {status.label}
                </span>
              </label>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {selectedLearningStatuses.length === 0
              ? "All statuses will be included in learning sessions"
              : `Selected statuses: ${selectedLearningStatuses.join(", ")}`}
          </p>
        </div>
      </div>

      <div className="card">
        <h2 className="text-xl font-semibold mb-4">About</h2>
        <div className="space-y-3 text-sm text-gray-600">
          <p>
            <strong>Oxford 5000+ Vocabulary Builder</strong> helps you learn the
            most important English words from the Oxford 3000™ and beyond.
          </p>
          <p>
            The app uses spaced repetition and smart learning algorithms to help
            you remember words more effectively.
          </p>
          <p>
            Your learning progress is saved locally in your browser and will
            persist between sessions.
          </p>
        </div>
      </div>
    </div>
  );
};
