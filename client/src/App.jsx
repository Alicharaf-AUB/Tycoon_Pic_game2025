import { Outlet } from 'react-router-dom'
import { SocketProvider } from './context/SocketContext'
import { ThemeProvider } from './context/ThemeContext'

function App() {
  return (
    <ThemeProvider>
      <SocketProvider>
        <div className="min-h-screen">
          <Outlet />
        </div>
      </SocketProvider>
    </ThemeProvider>
  )
}

export default App
