import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { supabase, signOut } from '@/services/supabaseService';
import { User as UserIcon, LogOut, Settings as SettingsIcon } from 'lucide-react';

interface HeaderProps {
  variant?: 'default' | 'transparent';
}

const Header = ({ variant = 'default' }: HeaderProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<{ id: string; email: string; name?: string } | null>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email!,
          name: session.user.user_metadata.full_name || session.user.user_metadata.name,
        });
      } else {
        setUser(null);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email!,
          name: session.user.user_metadata.full_name || session.user.user_metadata.name,
        });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const isActive = (path: string) => location.pathname === path;

  const navLinks = [
    { path: '/about', label: 'About' },
    { path: '/pricing', label: 'Pricing' },
    { path: '/support', label: 'Support' },
  ];

  return (
    <header className={`relative z-20 px-6 py-4 ${variant === 'default' ? 'bg-card border-b border-border' : ''}`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <button 
          onClick={() => navigate('/')}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <img src="/lem-logo.svg" alt="LEM" className="w-8 h-8" />
          <span className="font-bold text-xl text-foreground">LEMTOOL</span>
        </button>
        
        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <button 
              key={link.path}
              onClick={() => navigate(link.path)} 
              className={`text-sm font-medium transition-colors ${
                isActive(link.path) 
                  ? 'text-primary' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {link.label}
            </button>
          ))}
        </nav>

        {/* Auth buttons */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/')}
                className="text-sm"
              >
                Dashboard
              </Button>
              <div className="relative group">
                <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted transition-colors">
                  <UserIcon size={18} className="text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground hidden sm:inline">
                    {user.name || user.email.split('@')[0]}
                  </span>
                </button>
                <div className="absolute right-0 top-full mt-2 w-48 bg-card rounded-lg shadow-lg border border-border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                  <button
                    onClick={() => navigate('/settings')}
                    className="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-muted flex items-center gap-2 rounded-t-lg"
                  >
                    <SettingsIcon size={16} />
                    Settings
                  </button>
                  <button
                    onClick={async () => { await signOut(); setUser(null); }}
                    className="w-full px-4 py-2 text-left text-sm text-destructive hover:bg-destructive/10 flex items-center gap-2 rounded-b-lg"
                  >
                    <LogOut size={16} />
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <Button 
              onClick={() => navigate('/auth')} 
              size="sm" 
              className="bg-primary hover:bg-primary/90"
            >
              Sign In
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
