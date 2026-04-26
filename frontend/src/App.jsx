import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthPage } from './pages/auth/auth-page'
import { DashboardPage } from './pages/dashboard/dashboard-page'
import { DictionaryPage } from './pages/dictionary/dictionary-page'
import { HiraganaPage } from './pages/hiragana/hiragana-page'
import { KatakanaPage } from './pages/katakana/katakana-page'
import { LessonDetailPage } from './pages/lessons/lesson-detail-page'
import { LessonsPage } from './pages/lessons/lessons-page'
import { ProfilePage } from './pages/profile/profile-page'

function App() {
  return (
    <Routes>
      <Route path="/" element={<DashboardPage />} />
      <Route path="/hiragana" element={<HiraganaPage />} />
      <Route path="/katakana" element={<KatakanaPage />} />
      <Route path="/lessons" element={<Navigate to="/lessons/n5" replace />} />
      <Route path="/lessons/:level" element={<LessonsPage />} />
      <Route path="/lessons/:level/:lessonNumber" element={<LessonDetailPage />} />
      <Route path="/dictionary" element={<DictionaryPage />} />
      <Route path="/directory" element={<DictionaryPage redirectToDictionary />} />
      <Route path="/auth" element={<AuthPage mode="login" />} />
      <Route path="/auth/register" element={<AuthPage mode="register" />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
