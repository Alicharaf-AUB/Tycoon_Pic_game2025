import { Outlet } from 'react-router-dom'
import { SocketProvider } from './context/SocketContext'

function App() {
  return (
    <SocketProvider>
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50">
        <Outlet />
      </div>
    </SocketProvider>
  )
}

export default App
