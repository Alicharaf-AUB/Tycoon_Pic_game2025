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
    // Use relative path in production (same domain), localhost in development
    const socketUrl = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? window.location.origin : 'http://localhost:3001');
    
    console.log('🔌 Connecting to socket:', socketUrl);
    console.log('🌍 Environment:', import.meta.env.PROD ? 'PRODUCTION' : 'DEVELOPMENT');
    
    const socketInstance = io(socketUrl, {
      transports: ['polling', 'websocket'], // Try polling first for Railway
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 20000,
      forceNew: true
    });

    socketInstance.on('connect', () => {
      console.log('✅ Socket.IO connected successfully!');
      console.log('📡 Transport:', socketInstance.io.engine.transport.name);
      setIsConnected(true);
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('❌ Socket.IO disconnected:', reason);
      setIsConnected(false);
    });
    
    socketInstance.on('connect_error', (error) => {
      console.error('❌ Socket.IO connection error:', error.message);
      console.error('📊 Error details:', {
        type: error.type,
        description: error.description,
        context: error.context
      });
      setIsConnected(false);
    });
    
    socketInstance.on('reconnect_attempt', (attemptNumber) => {
      console.log(`🔄 Reconnection attempt ${attemptNumber}...`);
    });
    
    socketInstance.on('reconnect_failed', () => {
      console.error('❌ All reconnection attempts failed');
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
