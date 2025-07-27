const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
     origin: "*", // This allows all origins
    methods: ["GET", "POST"],
  },
  maxHttpBufferSize: 1e8,
});


io.on('connection', (socket) => {
  console.log(`✅ User connected: ${socket.id}`);

  // Handler for when a receiver tries to connect to a sender
  socket.on('receiver-join', (data) => {
    const { senderId } = data;
    const senderSocket = io.sockets.sockets.get(senderId);

    // Check if the sender's socket exists
    if (!senderSocket) {
      // If not, notify the receiver of the error
      socket.emit('invalid-code', { message: 'Invalid or expired code.' });
      return;
    }
 // Store the peer's ID on each socket object
    senderSocket.peerId = socket.id;
    socket.peerId = senderSocket.id;

   
    // Notify both users in the room that the connection is successful
   io.to(senderSocket.id).emit('connection-success', { peerId: socket.id });
    io.to(socket.id).emit('connection-success', { peerId: senderSocket.id });
  });

  // --- NEW: Data Relay Handlers ---

  // Relay text messages
  socket.on('send-message', (data) => {
    const { room, message } = data;
    io.to(room).emit('receive-message', {
      authorId: socket.id,
      type: 'text',
      content: message,
    });
  
  });

  // Relay file metadata
  socket.on('send-file-meta', (data) => {
    const { room, metadata } = data;
    io.to(room).emit('receive-file-meta', {
      authorId: socket.id,
      metadata: metadata,
    });
  });

  // Relay file chunks
  socket.on('send-file-chunk', (data) => {
    const { room, chunk } = data;
    // We forward the raw binary chunk
    io.to(room).emit('receive-file-chunk', chunk);
  });

  // Signal file transfer completion
  socket.on('send-file-complete', (data) => {
    const { room } = data;
    io.to(room).emit('receive-file-complete');
  });

  socket.on('disconnect', () => {
    console.log(`❌ User disconnected: ${socket.id}`);
     if (socket.peerId) {
      io.to(socket.peerId).emit('peer-disconnected');
    }
  });
});

const PORT = 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server is listening on http://<YOUR_COMPUTER_IP>:${PORT}`);
});