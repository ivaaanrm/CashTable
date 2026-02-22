import { BrowserRouter, Routes, Route } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import GameList from './pages/GameList'
import GameDetail from './pages/GameDetail'
import Settlement from './pages/Settlement'
import Login from './pages/Login'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<ProtectedRoute><GameList /></ProtectedRoute>} />
        <Route path="/games/:id" element={<ProtectedRoute><GameDetail /></ProtectedRoute>} />
        <Route path="/games/:id/settlement" element={<ProtectedRoute><Settlement /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  )
}
