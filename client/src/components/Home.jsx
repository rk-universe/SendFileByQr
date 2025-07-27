import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { socket } from '../socketService';

function Home() {
  const navigate = useNavigate();

  useEffect(() => {
    // Establish connection when the user first visits
    if (!socket.connected) {
      socket.connect();
    }
  }, []);

  return ( 
    <div>
      <p>A fast, secure, and serverless way to share files.</p>
      <div className="button-group">
        <button onClick={() => navigate('/send')}>Send</button>
        <button onClick={() => navigate('/receive')}>Receive</button>
      </div>
    </div>
  );
}

export default Home;