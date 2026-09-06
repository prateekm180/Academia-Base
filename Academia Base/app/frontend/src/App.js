import { BrowserRouter, Routes, Route, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import '@/App.css';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import CreateContent from './pages/CreateContent';
import ContentDetail from './pages/ContentDetail';
import Search from './pages/Search';
import { Toaster } from '@/components/ui/sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function AuthCallback() {
  const location = useLocation();
  const navigate = useNavigate();
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const hash = location.hash;
    if (!hash || !hash.includes('session_id=')) {
      navigate('/login');
      return;
    }

    const sessionId = hash.split('session_id=')[1]?.split('&')[0];
    if (!sessionId) {
      navigate('/login');
      return;
    }

    axios.post(`${API}/auth/session`, { session_id: sessionId }, { withCredentials: true })
      .then(response => {
        navigate('/dashboard', { state: { user: response.data }, replace: true });
      })
      .catch(error => {
        console.error('Auth callback failed:', error);
        navigate('/login');
      });
  }, [location, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center" data-testid="auth-callback-loading">
      <p>Completing authentication...</p>
    </div>
  );
}

function ProtectedRoute({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.state?.user) {
      setUser(location.state.user);
      setIsAuthenticated(true);
      return;
    }

    axios.get(`${API}/auth/me`, { withCredentials: true })
      .then(response => {
        setUser(response.data);
        setIsAuthenticated(true);
      })
      .catch(() => {
        setIsAuthenticated(false);
        navigate('/login');
      });
  }, [navigate, location.state]);

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return isAuthenticated ? <>{typeof children === 'function' ? children(user) : children}</> : null;
}

function AppRouter() {
  const location = useLocation();

  if (location.hash?.includes('session_id=')) {
    return <AuthCallback />;
  }

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/dashboard" element={<ProtectedRoute>{(user) => <Dashboard user={user} />}</ProtectedRoute>} />
      <Route path="/profile/:userId" element={<Profile />} />
      <Route path="/create" element={<ProtectedRoute>{(user) => <CreateContent user={user} />}</ProtectedRoute>} />
      <Route path="/content/:contentId" element={<ContentDetail />} />
      <Route path="/search" element={<Search />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <AppRouter />
      </BrowserRouter>
      <Toaster />
    </div>
  );
}

export default App;

