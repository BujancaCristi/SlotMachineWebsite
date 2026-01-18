import { ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
}

const ProtectedRoute = ({ children, requireAdmin = false }: ProtectedRouteProps) => {
  const { user, loading, isAdmin, isBlocked } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        // Not authenticated, redirect to auth page
        navigate(requireAdmin ? '/admin/auth' : '/auth');
      } else if (requireAdmin && !isAdmin) {
        // Authenticated but not admin, redirect to player dashboard
        navigate('/dashboard');
      } else if (isBlocked && !isAdmin) {
        // User is blocked (admins cannot be blocked)
        navigate('/blocked');
      }
    }
  }, [user, loading, isAdmin, isBlocked, requireAdmin, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || (requireAdmin && !isAdmin) || (isBlocked && !isAdmin)) {
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
