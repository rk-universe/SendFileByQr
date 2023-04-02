
require('dotenv').config()
const app = require('express')();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');




const connections = []; // store connected pairs
const myMap = new Map();



// Set up Socket.io
io.on('connection', (socket) => {
    
  console.log(`User ${socket.id} connected`);
  socket.emit('socket_id',socket.id);


  // Connect with another authenticated user
  socket.on('connect_request', (username) => {
    const targetSocket = io.of('/').sockets.get(username);
    if (!targetSocket) {
      socket.emit('connection_error', 'User not found or not authenticated');
    } else if (targetSocket === socket) {
      socket.emit('connection_error', 'Cannot connect to yourself');
    } else if (connections.includes(socket.id) || connections.includes(targetSocket.id)) {
      socket.emit('connection_error', 'Already connected to someone');
    } else {
      myMap.set(socket.id,targetSocket.id);
      myMap.set(targetSocket.id, socket.id);
      socket.emit('connected', username);
      targetSocket.emit('connected', username);
    }
  });

  // Send a message to the other connected user
  socket.on('message', (message) => {
try{
   targetSocketId = myMap.get(socket.id)
    if (targetSocketId) {
        const targetSocket = io.of('/').sockets.get(targetSocketId);
          targetSocket.emit('message', {
            from:socket.id ,
            message: message,
          });
        }
    }
    catch(error)
    {
        console.log("error occured "+error)
        
    }
      });
//send a file to the other connceted user-----------

function sendChunkToClients(socket, { index, data, totalchunk}) {
      const targetSocketId =myMap.get(socket);
      const targetSocket = io.of('/').sockets.get(targetSocketId);
      targetSocket.emit('chunk', { index, data }); 

      const progress = ((index / totalchunk) * 100).toFixed(2);
      targetSocket.emit('progress', { progress });
    }
  


socket.on('chunk', (chunk) => {
  sendChunkToClients(socket.id, chunk);
  socket.emit('chunk-ack', {index:chunk.index});
});



socket.on('done', ({name})=>{
  const targetSocketId =myMap.get(socket.id);
  const targetSocket = io.of('/').sockets.get(targetSocketId);
  targetSocket.emit('done',{name});
});

//end of send a file to the other connceted user-----------
   

  // Disconnect
  socket.on('disconnect', () => {
    console.log(`User ${socket.id} disconnected`);
    try{
        const targetSocketId =myMap.get(socket.id);
        const targetSocket = io.of('/').sockets.get(targetSocketId);
        targetSocket.emit('disconnected');
        myMap.delete(socket.id);
    }
    catch(error)
    {
        console.log(error)
    }
      
  });
});

port=process.env.PORT 
// Start the server
http.listen(port, () => {
  console.log('Server listening on port 3000');
});

