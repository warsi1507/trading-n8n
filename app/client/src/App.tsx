import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import '@xyflow/react/dist/style.css';
import { ReactFlowProvider } from '@xyflow/react';
import CreateWorkflow from './components/CreateWorkflow';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/create-workflow" element={<ReactFlowProvider><CreateWorkflow /></ReactFlowProvider>} />
        <Route path="*" element={<Navigate to="/create-workflow" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
