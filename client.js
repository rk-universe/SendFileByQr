
const ENDPOINT = "http://localhost:3000";
const socket = io(ENDPOINT, {
  transports: ['websocket']
});
let targetUsername = '';
// get socket id from url if provided by user
const query=window.location.search;
var b = query.substring(query.indexOf("?")+4);
if(b!='')
{
  targetUsername=b;
}


const progressBar = document.getElementById('progress');

//send file---------------------------

const chunkSize = 64 * 1024; // 64KB
let totalChunks =0;
let currentChunk = 0;
let file=0;

function handleChunkAck({ index }) {
  currentChunk++;
  updateProgressBar();
  if (currentChunk < totalChunks) {
    sendNextChunk();
  } else {
    socket.emit('done', { name: file.name });
    totalChunks=0;
    currentChunk=0;
    file=0;
  
  }
}

function updateProgressBar() {
  const percentComplete = (currentChunk / totalChunks) * 100;
  progressBar.style.width = `${percentComplete}%`;
}

// Function to send the next file chunk
function sendNextChunk() {
  const start = currentChunk * chunkSize;
  const end = Math.min(start + chunkSize, file.size);
  const chunk = file.slice(start, end);
  socket.emit('chunk', { index: currentChunk, data: chunk , totalchunk:totalChunks});

}



// Event listener for file input change
const fileInput = document.getElementById('file-input');
fileInput.addEventListener('change', handleFileUpload)


function handleFileUpload(event) {
  progressBar.style.transition='none';
  progressBar.style.width = `${0}%`;
  document.getElementById('progress_bar').style.display = 'block';
   file = event.target.files[0];

  if (!file) {
    return;
  }
  totalChunks = Math.ceil(file.size / chunkSize);
  sendNextChunk();
}
let receivedChunks = [];
 // Event listener for receiving file chunks
 socket.on('chunk', ({ index, data }) => {
  receivedChunks[index] = data;

});

socket.on('progress', ({ progress }) => {
  document.getElementById('progress_bar').style.display = 'block';
  progressBar.style.width = `${progress}%`;
});

// Event listener for file upload completion
socket.on('done', ({ name }) => {
  console.log(`File upload complete: ${name}`);
  const blob = new Blob(receivedChunks);
  const url = URL.createObjectURL(blob);

  // Create a download link for the file
  const downloadLink = document.createElement('a');
  downloadLink.href = url;
  downloadLink.download =name;
  downloadLink.click();
});

socket.on('chunk-ack', handleChunkAck);




// end of send file-----------------------



// Connect with another user
function connect() {
  targetUsername = document.getElementById('target-username-input').value;
  socket.emit('connect_request', targetUsername);
}

// Send a message to the connected user
function sendMessage() {
  const message = document.getElementById('message-input').value;
  const chatBox = document.getElementById('chat-box');
  const messageEl = document.createElement('div');
  messageEl.textContent = `Me : ${message}`;
  chatBox.appendChild(messageEl);
  socket.emit('message', message);

}


//Handle socket id
socket.on('socket_id',(socket_id) =>{
  if(targetUsername != '')
  {
    socket.emit('connect_request', targetUsername);
  }
  // generate qr code
  const link="http://127.0.0.1:5500/?id="+socket_id;
  var qrCode = new QRCode(document.getElementById("qr-code"), {
    width: 200,
    height: 200
  });
  console.log(link)
  qrCode.makeCode(link);
  console.log("socket id is "+socket_id)
})
// Handle connection success
socket.on('connected', (username) => {
  document.getElementById('connection-section').style.display = 'none';
  document.getElementById('qr-code').style.display = 'none';
  document.getElementById('messaging-section').style.display = 'block';
  document.getElementById('username-label').textContent = username;
});

// Handle connection errors
socket.on('connection_error', (message) => {
  alert(`Connection error: ${message}`);
});

// Handle incoming messages
socket.on('message', (data) => {
  const { from, message } = data;
  const chatBox = document.getElementById('chat-box');
  const messageEl = document.createElement('div');
  messageEl.textContent = `${from}: ${message}`;
  chatBox.appendChild(messageEl);
});

// Handle disconnection
socket.on('disconnected', () => {
  alert('Disconnected from the other user');
  document.getElementById('messaging-section').style.display = 'none';
  document.getElementById('connection-section').style.display = 'block';
});

// Bind event listeners to buttons
// document.getElementById('authenticate-button').addEventListener('click', authenticate);
document.getElementById('connect-button').addEventListener('click', connect);
document.getElementById('send-button').addEventListener('click', sendMessage);
