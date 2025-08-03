import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "./components/Layout";
import { HomePage } from "./pages/HomePage";
import { WordsListPage } from "./pages/WordsListPage";
import { LearnPage } from "./pages/LearnPage";
import { SettingsPage } from "./pages/SettingsPage";
import { useWordStore } from "./store/wordStore";

function App() {
  const { loadWords, isDataLoaded } = useWordStore();

  useEffect(() => {
    // Load words data on app startup
    if (!isDataLoaded) {
      loadWords();
    }
  }, [loadWords, isDataLoaded]);

  return (
    <BrowserRouter basename="/3000-oxford-learning-app/">
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/words" element={<WordsListPage />} />
          <Route path="/learn" element={<LearnPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
