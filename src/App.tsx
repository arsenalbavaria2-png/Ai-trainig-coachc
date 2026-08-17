import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AppLayout from './components/AppLayout';
import HomePage from './pages/HomePage';
import WorkoutPage from './pages/WorkoutPage';
import LevelsPage from './pages/LevelsPage';
import SettingsPage from './pages/SettingsPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/workout" element={<WorkoutPage />} />
          <Route path="/levels" element={<LevelsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
