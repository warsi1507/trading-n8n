import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import '@xyflow/react/dist/style.css';
import { ReactFlowProvider } from '@xyflow/react';

// Providers and Layout
import { ThemeProvider } from './components/ThemeProvider';
import { ClerkThemeWrapper } from './components/ClerkThemeWrapper';
import Header from './components/Header';

// Pages
import Home from './pages/Home';
import About from './pages/About';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';
import CreateWorkflow from './components/CreateWorkflow';
import Workflows from './pages/Workflows';

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <ClerkThemeWrapper>
        <Router>
          <div className="min-h-screen flex flex-col bg-background text-foreground font-sans antialiased">
            <Header />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/about" element={<About />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/workflows" element={<Workflows />} />
                <Route path="/create-workflow" element={
                  <ReactFlowProvider>
                    <CreateWorkflow />
                  </ReactFlowProvider>
                } />
                {/* 404 Route */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
          </div>
        </Router>
      </ClerkThemeWrapper>
    </ThemeProvider>
  );
}

export default App;
