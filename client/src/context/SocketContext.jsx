import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';

const SocketContext = createContext(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [gameState, setGameState] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socketInstance = io(import.meta.env.VITE_API_URL || 'http://localhost:3001', {
      transports: ['websocket', 'polling']
    });

    socketInstance.on('connect', () => {
      console.log('Connected to server');
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('Disconnected from server');
      setIsConnected(false);
    });

    socketInstance.on('gameStateUpdate', (state) => {
      console.log('Game state updated', state);
      setGameState(state);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, gameState, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};
