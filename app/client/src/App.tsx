import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "@xyflow/react/dist/style.css";
import { ReactFlowProvider } from "@xyflow/react";
import { Show, RedirectToSignIn } from "@clerk/react";

// Providers and Layout
import { ThemeProvider } from "./components/ThemeProvider";
import { ClerkThemeWrapper } from "./components/ClerkThemeWrapper";
import Header from "./components/Header";

// Pages
import Home from "./pages/Home";
import About from "./pages/About";
import NotFound from "./pages/NotFound";
import WorkflowEditor from "./pages/WorkflowEditor";
import Workflows from "./pages/Workflows";

// Protected Route Wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Show when="signed-in">{children}</Show>
      <Show when="signed-out">
        <RedirectToSignIn />
      </Show>
    </>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <ClerkThemeWrapper>
        <Router>
          <div className="min-h-screen flex flex-col bg-background text-foreground font-sans antialiased">
            <Header />
            <main className="flex-1">
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/about" element={<About />} />

                {/* Protected Routes */}
                <Route
                  path="/workflows"
                  element={
                    <ProtectedRoute>
                      <Workflows />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/workflows/:display_id"
                  element={
                    <ProtectedRoute>
                      <ReactFlowProvider>
                        <WorkflowEditor />
                      </ReactFlowProvider>
                    </ProtectedRoute>
                  }
                />

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
