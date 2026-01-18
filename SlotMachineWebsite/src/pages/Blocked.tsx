import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Ban, Home } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const Blocked = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleGoHome = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full glass">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <Ban className="h-8 w-8 text-destructive" />
            </div>
          </div>
          <CardTitle className="text-2xl">Account Blocked</CardTitle>
          <CardDescription>
            Your account has been temporarily blocked by an administrator.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-sm text-muted-foreground">
            If you believe this is a mistake, please contact support for assistance.
          </p>
          <Button onClick={handleGoHome} variant="outline" className="w-full">
            <Home className="mr-2 h-4 w-4" />
            Go to Home
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Blocked;
