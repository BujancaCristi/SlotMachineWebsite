import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Shield, ArrowRight, Lock, Mail, RefreshCw, CheckCircle, Settings } from 'lucide-react';
import { useEffect } from 'react';

const features = [
  {
    icon: Mail,
    title: 'Email Registration',
    description: 'Create your account with a secure email and password.',
  },
  {
    icon: Lock,
    title: 'Secure Authentication',
    description: 'Login safely with encrypted credentials.',
  },
  {
    icon: RefreshCw,
    title: 'Easy Updates',
    description: 'Change your email or password anytime.',
  },
];

const Index = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-bl from-primary/20 via-primary/5 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-accent/20 via-accent/5 to-transparent rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />
      </div>

      {/* Header */}
      <header className="relative z-10 container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl gradient-bg flex items-center justify-center animate-float">
              <Shield className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-semibold">SecureAuth</span>
          </div>

          <div className="flex items-center gap-3">
            <Button onClick={() => navigate('/admin/auth')} variant="ghost" size="sm" className="text-muted-foreground">
              <Settings className="mr-2 h-4 w-4" />
              Admin
            </Button>
            <Button onClick={() => navigate('/auth')} variant="outline" className="group">
              Get Started
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </div>
        </nav>
      </header>

      {/* Hero section */}
      <main className="relative z-10 container mx-auto px-4">
        <section className="py-20 md:py-32 text-center">
          <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <CheckCircle className="h-4 w-4" />
              Secure & Simple Authentication
            </div>

            <h1 className="text-4xl md:text-6xl font-bold leading-tight">
              Your account,{' '}
              <span className="gradient-text">your control</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Register, authenticate, and manage your profile with ease. 
              A modern authentication system built for simplicity and security.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Button
                size="lg"
                onClick={() => navigate('/auth')}
                className="gradient-bg hover:opacity-90 transition-opacity text-lg px-8"
              >
                Create Account
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate('/auth')}
                className="text-lg px-8"
              >
                Sign In
              </Button>
            </div>
          </div>
        </section>

        {/* Features section */}
        <section className="py-16 md:py-24">
          <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="glass rounded-2xl p-6 space-y-4 animate-fade-in hover:shadow-xl transition-shadow"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="h-12 w-12 rounded-xl gradient-bg flex items-center justify-center">
                  <feature.icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-semibold">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/50 mt-auto">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} SecureAuth. Built with security in mind.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
