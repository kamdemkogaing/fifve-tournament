import { Link, Route, Routes } from 'react-router-dom'
import AdminTournament from './pages/AdminTournament.jsx'
import Home from './pages/Home.jsx'
import PublicTournament from './pages/PublicTournament.jsx'

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="border-b bg-white">
        <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">
          <Link to="/" className="font-semibold">
            FIFVE Tournament
          </Link>
          <div className="text-sm text-gray-500">Vite + Tailwind + Supabase</div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/t/:slug" element={<PublicTournament />} />
          <Route path="/admin/:slug" element={<AdminTournament />} />
        </Routes>
      </main>
    </div>
  )
}
