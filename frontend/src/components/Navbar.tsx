import { Link, useLocation } from 'react-router-dom';
import { ShoppingCart, User, Menu, X } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import logo from '@/images/logo.png';
import { BRAND_NAME } from '@/lib/brand';

const Navbar = () => {
  const { totalItems } = useCart();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const isAdminRoute = location.pathname.startsWith('/admin');
  if (isAdminRoute) return null;

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/shop', label: 'Shop' },
    { to: '/compare', label: 'Compare' },
    { to: '/shop?category=animals', label: 'Animals' },
    { to: '/faq', label: 'FAQ' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className={`sticky top-0 z-50 transition-all duration-300 ${scrolled ? 'glass shadow-md' : 'bg-background'}`}>
      <div className="container flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-2 group">
          <img
            src={logo}
            alt={BRAND_NAME}
            className="h-10 w-10 rounded-full object-cover border border-border/70 group-hover:scale-105 transition-transform"
          />
          <div className="flex flex-col">
            <span className="font-display text-sm md:text-base font-bold text-foreground leading-tight">{BRAND_NAME}</span>
            <span className="text-[10px] font-body font-semibold text-primary tracking-[0.2em] -mt-0.5">KARUR</span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map(l => (
            <Link
              key={l.to + l.label}
              to={l.to}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive(l.to)
                  ? 'text-primary bg-accent'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <div className="hidden md:flex items-center gap-1">
              {user.isAdmin && (
                <Link to="/admin">
                  <Button variant="outline" size="sm" className="text-xs h-8">Admin</Button>
                </Link>
              )}
              <Link to="/orders">
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0"><User className="h-4 w-4" /></Button>
              </Link>
              <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={logout}>Logout</Button>
            </div>
          ) : (
            <Link to="/login" className="hidden md:block">
              <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs">
                <User className="h-3.5 w-3.5" /> Login
              </Button>
            </Link>
          )}

          <Link to="/cart" className="relative">
            <Button variant="ghost" size="sm" className="h-9 w-9 p-0 relative">
              <ShoppingCart className="h-4.5 w-4.5" />
              {totalItems > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-bold"
                >
                  {totalItems}
                </motion.span>
              )}
            </Button>
          </Link>

          <button className="md:hidden h-9 w-9 flex items-center justify-center" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-border bg-background overflow-hidden"
          >
            <div className="p-4 space-y-1">
              {navLinks.map(l => (
                <Link
                  key={l.to + l.label}
                  to={l.to}
                  className={`block px-3 py-2.5 rounded-lg text-sm font-medium ${
                    isActive(l.to) ? 'text-primary bg-accent' : 'text-muted-foreground'
                  }`}
                  onClick={() => setMobileOpen(false)}
                >
                  {l.label}
                </Link>
              ))}
              {user ? (
                <>
                  <Link to="/orders" className="block px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground" onClick={() => setMobileOpen(false)}>My Orders</Link>
                  {user.isAdmin && <Link to="/admin" className="block px-3 py-2.5 rounded-lg text-sm font-medium text-primary" onClick={() => setMobileOpen(false)}>Admin Dashboard</Link>}
                  <button onClick={() => { logout(); setMobileOpen(false); }} className="block w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-destructive">Logout</button>
                </>
              ) : (
                <Link to="/login" className="block px-3 py-2.5 rounded-lg text-sm font-medium text-primary" onClick={() => setMobileOpen(false)}>Login / Register</Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Navbar;
