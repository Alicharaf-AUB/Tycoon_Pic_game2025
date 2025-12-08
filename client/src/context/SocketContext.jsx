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
    // Check if we're in production by looking at the hostname
    const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
    const socketUrl = import.meta.env.VITE_API_URL || (isProduction ? window.location.origin : 'http://localhost:3001');

    // Get app access token
    const accessToken = sessionStorage.getItem('app_access_token');

    console.log('🔌 Connecting to socket:', socketUrl);
    console.log('🌍 Environment:', isProduction ? 'PRODUCTION' : 'DEVELOPMENT');
    console.log('🌐 Window location:', window.location.origin);
    console.log('🏠 Hostname:', window.location.hostname);
    console.log('🔑 Access token:', accessToken ? 'Present' : 'Missing');

    const socketInstance = io(socketUrl, {
      path: '/socket.io/',
      transports: ['polling', 'websocket'], // Try polling first for Railway
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 30000, // Increased to 30 seconds for Railway
      forceNew: true,
      autoConnect: true,
      withCredentials: false,
      auth: {
        accessToken: accessToken
      }
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
      console.warn('⚠️ Socket.IO connection error:', error.message);
      console.warn('📊 Error details:', {
        type: error.type,
        description: error.description,
        context: error.context
      });
      // Only show warning on first error, not every retry
      if (!isConnected) {
        console.warn('💡 App will continue to work, but real-time updates are disabled');
      }
      setIsConnected(false);
      // Don't throw - let the app work without real-time updates
    });
    
    socketInstance.on('reconnect_attempt', (attemptNumber) => {
      console.log(`🔄 Reconnection attempt ${attemptNumber}...`);
    });
    
    socketInstance.on('reconnect', (attemptNumber) => {
      console.log(`✅ Reconnected successfully after ${attemptNumber} attempts`);
      setIsConnected(true);
    });
    
    socketInstance.on('reconnect_failed', () => {
      console.error('❌ All reconnection attempts failed');
      console.error('💡 Reload the page to try connecting again');
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
