import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import '@xyflow/react/dist/style.css';
import CreateWorkflow from './components/CreateWorkflow';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/create-workflow" element={<CreateWorkflow />} />
        <Route path="*" element={<Navigate to="/create-workflow" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
