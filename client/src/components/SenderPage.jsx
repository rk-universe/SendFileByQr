import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { socket } from '../socketService';
import { Link } from 'react-router-dom';
import ChatInterface from './ChatInterface'; // Import the new component


function SenderPage() {
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [isConnected, setIsConnected] = useState(false);
  const [connectionDetails, setConnectionDetails] = useState(null);

   // Function to reset the component's state
  const handleDisconnect = () => {
    setIsConnected(false);
    setConnectionDetails(null);
  };

  useEffect(() => {
    const onConnect = () => setConnectionStatus('connected');

    const onConnectionSuccess = (data) => {
      setIsConnected(true);
      setConnectionDetails(data); // Store connection details
    };

    socket.on('connect', onConnect);
    socket.on('connection-success', onConnectionSuccess);

    if (socket.connected) onConnect();
    else socket.connect();

    return () => {
      socket.off('connect', onConnect);
      socket.off('connection-success', onConnectionSuccess);
    };
  }, []);

 if (isConnected) {
    return (
      <div>
        <h3>✅ Receiver Connected!</h3>
        <p>You can now send files and messages.</p>
         <ChatInterface
        connectionDetails={connectionDetails}
        onDisconnect={handleDisconnect} // Pass the function as a prop
      />
      </div>
    );
  }

  if (connectionStatus !== 'connected') {
    return <p>Connecting to server...</p>;
  }
  
  const shareUrl = `${window.location.origin}/receive?code=${socket.id}`;
  return (
    <div>
      <Link to="/">&larr; Back to Home</Link>
      <h3>Share this code with the receiver:</h3>
      <div className="qr-code-container">
        <QRCodeSVG value={shareUrl} size={200} />
      </div>
      <p>Your Code: <strong>{socket.id}</strong></p>
      <p><i>Waiting for a receiver to connect...</i></p>
    </div>
  );
}

export default SenderPage;