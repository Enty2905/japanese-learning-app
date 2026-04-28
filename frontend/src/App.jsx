import { Navigate, Route, Routes } from 'react-router-dom'
import { RequireAuth } from './components/auth/require-auth'
import { AuthPage } from './pages/auth/auth-page'
import { DashboardPage } from './pages/dashboard/dashboard-page'
import { DictionaryPage } from './pages/dictionary/dictionary-page'
import { FlashcardsPage } from './pages/flashcards/flashcards-page'
import { HiraganaPage } from './pages/hiragana/hiragana-page'
import { KatakanaPage } from './pages/katakana/katakana-page'
import { CulturePage } from './pages/culture/culture-page'
import { LessonDetailPage } from './pages/lessons/lesson-detail-page'
import { LessonsPage } from './pages/lessons/lessons-page'
import { ProfilePage } from './pages/profile/profile-page'

function App() {
  return (
    <Routes>
      <Route path="/" element={<DashboardPage />} />
      <Route path="/hiragana" element={<HiraganaPage />} />
      <Route path="/katakana" element={<KatakanaPage />} />
      <Route
        path="/lessons"
        element={(
          <RequireAuth>
            <Navigate to="/lessons/n5" replace />
          </RequireAuth>
        )}
      />
      <Route
        path="/lessons/:level"
        element={(
          <RequireAuth>
            <LessonsPage />
          </RequireAuth>
        )}
      />
      <Route
        path="/lessons/:level/:lessonNumber"
        element={(
          <RequireAuth>
            <LessonDetailPage />
          </RequireAuth>
        )}
      />
      <Route path="/dictionary" element={<DictionaryPage />} />
      <Route path="/directory" element={<DictionaryPage redirectToDictionary />} />
      <Route
        path="/flashcards"
        element={(
          <RequireAuth>
            <FlashcardsPage />
          </RequireAuth>
        )}
      />
      <Route
        path="/flashcards/:setId"
        element={(
          <RequireAuth>
            <FlashcardsPage />
          </RequireAuth>
        )}
      />
      <Route path="/culture" element={<CulturePage />} />
      <Route path="/auth" element={<AuthPage mode="login" />} />
      <Route path="/auth/register" element={<AuthPage mode="register" />} />
      <Route
        path="/profile"
        element={(
          <RequireAuth>
            <ProfilePage />
          </RequireAuth>
        )}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
