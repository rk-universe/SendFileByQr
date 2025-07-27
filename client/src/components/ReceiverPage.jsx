import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { socket } from '../socketService';
import ChatInterface from './ChatInterface';

function ReceiverPage() {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState('');
  const [searchParams] = useSearchParams();
  const [connectionDetails, setConnectionDetails] = useState(null);

   const handleDisconnect = () => {
    setIsConnected(false);
    setConnectionDetails(null);
  };

  useEffect(() => {
    const onConnectionSuccess = (data) => {
      setIsConnected(true);
      setConnectionDetails(data);
    };
    const onInvalidCode = (data) => setError(data.message);

    socket.on('connection-success', onConnectionSuccess);
    socket.on('invalid-code', onInvalidCode);

    // --- REFINED LOGIC ---
    const codeFromUrl = searchParams.get('code');
    if (codeFromUrl) {
      // If the socket is already connected, join immediately.
      if (socket.connected) {
        socket.emit('receiver-join', { senderId: codeFromUrl });
      } else {
        // Otherwise, wait for the 'connect' event before joining.
        socket.once('connect', () => {
          socket.emit('receiver-join', { senderId: codeFromUrl });
        });
        socket.connect();
      }
    }

    return () => {
      socket.off('connection-success', onConnectionSuccess);
      socket.off('invalid-code', onInvalidCode);
    };
  }, [searchParams]);

  const handleConnect = (e) => {
    e.preventDefault();
    setError('');
    const code = e.target.code.value;
    if (code) {
      if (!socket.connected) socket.connect();
      socket.emit('receiver-join', { senderId: code });
    }
  };

  if (isConnected) {
    return (
      <div>
        <h3>✅ Connected!</h3>
        <p>Ready to receive files and messages.</p>
         <ChatInterface
                connectionDetails={connectionDetails}
                onDisconnect={handleDisconnect} // Pass the function as a prop
              />
      </div>
    );
  }

  return (
    <div>
      <Link to="/">&larr; Back to Home</Link>
      <h3>Enter Sender's Code</h3>
      <form onSubmit={handleConnect}>
        <input
          name="code"
          type="text"
          placeholder="Enter code here..."
          defaultValue={searchParams.get('code') || ''} // Pre-fill the input if code is in URL
          required
        />
        <button type="submit">Connect</button>
      </form>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}

export default ReceiverPage;