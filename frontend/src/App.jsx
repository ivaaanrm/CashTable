import { BrowserRouter, Routes, Route } from 'react-router-dom'
import GameList from './pages/GameList'
import GameDetail from './pages/GameDetail'
import Settlement from './pages/Settlement'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<GameList />} />
        <Route path="/games/:id" element={<GameDetail />} />
        <Route path="/games/:id/settlement" element={<Settlement />} />
      </Routes>
    </BrowserRouter>
  )
}
