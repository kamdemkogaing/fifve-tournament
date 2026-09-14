import { Link, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import { useAuth } from './context/AuthContext.jsx'
import AdminTournament from './pages/AdminTournament.jsx'
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import PublicTournament from './pages/PublicTournament.jsx'

export default function App() {
  const { user, loading, signOut } = useAuth()

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <Link to="/" className="font-semibold">
            FIFVE Tournament
          </Link>

          {!loading && (
            <div className="flex items-center gap-3 text-sm">
              {user ? (
                <>
                  <span className="hidden text-gray-500 sm:inline">{user.email}</span>
                  <button
                    className="rounded-xl border border-gray-300 px-3 py-1.5 hover:bg-gray-50"
                    onClick={signOut}
                    type="button"
                  >
                    Abmelden
                  </button>
                </>
              ) : (
                <Link className="rounded-xl bg-black px-3 py-1.5 text-white" to="/login">
                  Anmelden
                </Link>
              )}
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/t/:slug" element={<PublicTournament />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Home />} />
            <Route path="/admin/:slug" element={<AdminTournament />} />
          </Route>
        </Routes>
      </main>
    </div>
  )
}
