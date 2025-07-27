import { Routes, Route } from 'react-router-dom';
import Home from './components/Home';
import SenderPage from './components/SenderPage';
import ReceiverPage from './components/ReceiverPage';
import './App.css';

function App() {
  return (
    <div className="container">
      <h1>FileDrop</h1>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/send" element={<SenderPage />} />
        <Route path="/receive" element={<ReceiverPage />} />
      </Routes>
    </div>
  );
}

export default App;