import { Outlet } from 'react-router-dom'
import { SocketProvider } from './context/SocketContext'

function App() {
  return (
    <SocketProvider>
      <div className="min-h-screen">
        <Outlet />
      </div>
    </SocketProvider>
  )
}

export default App
