import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles?: ('manager' | 'admin' | 'sakin')[];
}

export default function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
  const { isAuthenticated, user } = useAuth();
  
  if (!isAuthenticated) return <Navigate to="/giris" replace />;
  
  if (allowedRoles && user && !allowedRoles.includes(user.role as any)) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
}
