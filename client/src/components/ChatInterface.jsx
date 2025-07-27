import React, { useState, useEffect, useRef } from 'react';
import { socket } from '../socketService';

const CHUNK_SIZE = 64 * 1024; // 64KB

function ChatInterface({ connectionDetails , onDisconnect}) {
 const [message, setMessage] = useState('');
  const [file, setFile] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);

  // SIMPLIFIED: State for a single file transfer
  const [isSending, setIsSending] = useState(false);
  const [isReceiving, setIsReceiving] = useState(false);
  const [progress, setProgress] = useState(0);

  // SIMPLIFIED: Refs no longer need to be objects
  const fileInputRef = useRef(null);
  const receivedChunksRef = useRef([]);
  const incomingFileInfoRef = useRef(null);
  const chatEndRef = useRef(null);
  const room = connectionDetails.peerId;

  useEffect(() => {
     const handlePeerDisconnected = () => {
      alert("Your peer has disconnected.");
      onDisconnect(); // Call the parent's reset function
    };

    
    const handleReceiveMessage = (data) => setChatHistory(prev => [...prev, data]);
    
    // SIMPLIFIED: No fileId needed
    const handleReceiveFileMeta = (data) => {
      setIsReceiving(true);
      setProgress(0);
      incomingFileInfoRef.current = data.metadata;
      receivedChunksRef.current = [];
      setChatHistory(prev => [...prev, { authorId: data.authorId, type: 'file', content: `Receiving: ${data.metadata.name}` }]);
    };

    // SIMPLIFIED: No fileId needed
    const handleReceiveFileChunk = (chunk) => {
      if (!incomingFileInfoRef.current) return;
      receivedChunksRef.current.push(chunk);
      const receivedSize = receivedChunksRef.current.reduce((acc, c) => acc + c.byteLength, 0);
      const calculatedProgress = Math.round((receivedSize / incomingFileInfoRef.current.size) * 100);
      setProgress(calculatedProgress);
    };

    // SIMPLIFIED: No fileId needed
    const handleReceiveFileComplete = () => {
      const fileInfo = incomingFileInfoRef.current;
      const fileBlob = new Blob(receivedChunksRef.current, { type: fileInfo.type });
      const url = URL.createObjectURL(fileBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileInfo.name;
      a.click();
      URL.revokeObjectURL(url);
      setIsReceiving(false);
      setChatHistory(prev => [...prev, { message: `File "${fileInfo.name}" downloaded.` }]);
    };
    socket.on('peer-disconnected', handlePeerDisconnected);
    socket.on('receive-message', handleReceiveMessage);
    socket.on('receive-file-meta', handleReceiveFileMeta);
    socket.on('receive-file-chunk', handleReceiveFileChunk);
    socket.on('receive-file-complete', handleReceiveFileComplete);
    
    return () => {
      socket.off('peer-disconnected', handlePeerDisconnected);
      socket.off('receive-message', handleReceiveMessage);
      socket.off('receive-file-meta', handleReceiveFileMeta);
      socket.off('receive-file-chunk', handleReceiveFileChunk);
      socket.off('receive-file-complete', handleReceiveFileComplete);
    };
  }, [onDisconnect]);


   useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const handleFileSelect = (e) => {
    setFile(e.target.files[0]);
  };
  
  const sendMessage = () => {
    const messageData = { authorId: socket.id, type: 'text', content: message };
    setChatHistory(prev => [...prev, messageData]);
    socket.emit('send-message', { room, message });
    setMessage('');
  };
  
  // SIMPLIFIED: sendFile no longer uses fileId
  const sendFile = () => {
    if (!file) return;
    setIsSending(true);
    setProgress(0);

    const metadata = { name: file.name, size: file.size, type: file.type };
    setChatHistory(prev => [...prev, { authorId: socket.id, type: 'file', content: `Sending: ${file.name}` }]);
    socket.emit('send-file-meta', { room, metadata });
    
    let offset = 0;
    const reader = new FileReader();
    reader.onload = (e) => {
      socket.emit('send-file-chunk', { room, chunk: e.target.result });
      offset += e.target.result.byteLength;
      setProgress(Math.round((offset / file.size) * 100));
      
      if (offset < file.size) {
        reader.readAsArrayBuffer(file.slice(offset, offset + CHUNK_SIZE));
      } else {
        socket.emit('send-file-complete', { room });
        setChatHistory(prev => [...prev, { message: `File "${file.name}" sent.` }]);
        setIsSending(false);
        setFile(null);
      }
    };
    reader.readAsArrayBuffer(file.slice(0, CHUNK_SIZE));
  };
  
  const handleSend = () => {
    if (file) sendFile();
    else if (message.trim()) sendMessage();
  };
  
  return (
    <div className="chat-interface">
      <div className="chat-history">
        {chatHistory.map((item, index) => {
        // NEW: Determine if this specific message is the one being transferred
        const isActiveSending = isSending && item.authorId === socket.id && index === chatHistory.length - 1;
        const isActiveReceiving = isReceiving && item.authorId !== socket.id && index === chatHistory.length - 1;

        return (
          <div key={index} className={`chat-bubble ${item.authorId === socket.id ? 'sent' : 'received'}`}>
            {item.type === 'file' ? (
              <div>
                <p>{item.content}</p>
                {/* UPDATED: Only show progress bar if this is the active transfer */}
                {(isActiveSending || isActiveReceiving) && (
                  <progress value={progress} max="100" style={{ width: '100%' }} />
                )}
              </div>
            ) : (
              item.content
            )}
          </div>
        );
       })}
      <div ref={chatEndRef}></div>
     </div>

      {file && (
        <div className="file-preview">
          <span>{file.name}</span>
          <button onClick={() => setFile(null)}>✖</button>
        </div>
      )}

      <div className="chat-input-area">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          style={{ display: 'none' }}
          disabled={isSending || isReceiving} // UPDATED
        />
        <button className="icon-button" onClick={() => fileInputRef.current.click()} disabled={isSending || isReceiving}>
          📎
        </button>
        <input
          type="text"
          placeholder="Type a message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          disabled={!!file || isSending || isReceiving} // UPDATED
        />
        <button className="icon-button" onClick={handleSend} disabled={isSending || isReceiving || (!file && !message.trim())}>
          {isSending ? `${progress}%` : '➤'}
        </button>
      </div>
    </div>
  );
}

export default ChatInterface;