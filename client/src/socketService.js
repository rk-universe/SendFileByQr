import { io } from 'socket.io-client';
const SERVER_HOSTNAME = window.location.hostname;
const SERVER_URL = `http://${SERVER_HOSTNAME}:3001`;
console.log('Connecting to socket server at:', SERVER_URL);

// This is the corrected code with no invisible characters.
export const socket = io(SERVER_URL, {
  autoConnect: false, 
});