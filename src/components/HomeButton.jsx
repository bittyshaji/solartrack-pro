import { useNavigate } from 'react-router-dom'
import { Home } from 'lucide-react'

export default function HomeButton() {
  const navigate = useNavigate()

  return (
    <button
      onClick={() => navigate('/dashboard')}
      className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition-colors"
      title="Go to Home"
    >
      <Home className="w-5 h-5" />
      Home
    </button>
  )
}
