import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { selectIsAuthenticated } from './redux/slices/authSlice'
import Login from './components/Login'
import Register from './components/Register'
import Chat from './components/Chat'
import ChatDBTest from './components/ChatDBTest'
import './App.css'

// Protected route component
interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

const App: React.FC = () => {

  return (
    <BrowserRouter>
      <div className="app-container">
        <main className="app-content">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/chat" element={
              <ProtectedRoute>
                <Chat />
              </ProtectedRoute>
            } />
            <Route path="/test" element={<ChatDBTest />} />
            <Route path="*" element={<Navigate to="/login" />} />
          </Routes>
        </main>

        <footer className="app-footer">
          <p>ChatSpot Messenger &copy; {new Date().getFullYear()}</p>
        </footer>
      </div>
    </BrowserRouter>
  )
}

export default App
