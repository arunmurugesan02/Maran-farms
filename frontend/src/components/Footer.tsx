import { Phone, Mail, MapPin, ArrowUpRight, Globe, MessageCircle, Video } from 'lucide-react';
import { Link } from 'react-router-dom';
import logo from '@/images/logo.png';
import { BRAND_EMAIL, BRAND_NAME } from '@/lib/brand';

const Footer = () => (
  <footer className="bg-foreground text-background/80 mt-20">
    {/* Newsletter strip */}
    <div className="border-b border-background/10">
      <div className="container py-10 flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h3 className="font-display text-xl text-background font-bold">Stay Fresh, Stay Updated</h3>
          <p className="text-sm text-background/60">Get the latest on our products and farm news.</p>
        </div>
        <div className="flex w-full md:w-auto">
          <input
            type="email"
            placeholder="Enter your email"
            className="px-4 py-2.5 bg-background/10 border border-background/20 rounded-l-xl text-sm text-background placeholder:text-background/40 w-full md:w-64 focus:outline-none focus:border-primary"
          />
          <button className="px-5 py-2.5 bg-primary text-primary-foreground rounded-r-xl text-sm font-semibold hover:bg-primary/90 transition-colors whitespace-nowrap">
            Subscribe
          </button>
        </div>
      </div>
    </div>

    <div className="container py-12 grid grid-cols-1 md:grid-cols-4 gap-10">
      <div>
        <div className="flex items-center gap-2 mb-4">
          <img src={logo} alt={BRAND_NAME} className="h-10 w-10 rounded-full object-cover border border-background/20" />
          <div>
            <p className="font-display text-sm font-bold text-background leading-tight">{BRAND_NAME}</p>
            <p className="text-[9px] font-bold tracking-[0.2em] text-primary -mt-0.5">KARUR</p>
          </div>
        </div>
        <p className="text-sm text-background/50 leading-relaxed mb-4">
          Premium grass & healthy animals, delivered with care from our farm to your doorstep.
        </p>
        <div className="flex gap-3">
          {[Globe, MessageCircle, Video].map((Icon, i) => (
            <a key={i} href="#" className="h-9 w-9 rounded-lg bg-background/10 flex items-center justify-center hover:bg-primary transition-colors">
              <Icon className="h-4 w-4" />
            </a>
          ))}
        </div>
      </div>

      <div>
        <h4 className="font-display font-bold text-background mb-4 text-sm">Quick Links</h4>
        <div className="space-y-2.5">
          {[
            { to: '/', label: 'Home' },
            { to: '/shop', label: 'Shop All' },
            { to: '/compare', label: 'Compare Napier' },
            { to: '/faq', label: 'FAQ' },
            { to: '/orders', label: 'My Orders' },
          ].map(l => (
            <Link key={l.to} to={l.to} className="flex items-center gap-1 text-sm text-background/50 hover:text-primary transition-colors group">
              {l.label}
              <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          ))}
        </div>
      </div>

      <div>
        <h4 className="font-display font-bold text-background mb-4 text-sm">Categories</h4>
        <div className="space-y-2.5">
          {[
            { to: '/shop?category=napier', label: 'Napier Grass' },
            { to: '/shop?category=grass', label: 'Grass & Plants' },
            { to: '/shop?category=animals', label: 'Birds' },
            { to: '/shop?category=animals', label: 'Rabbits & Pets' },
          ].map((l, i) => (
            <Link key={i} to={l.to} className="flex items-center gap-1 text-sm text-background/50 hover:text-primary transition-colors group">
              {l.label}
              <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          ))}
        </div>
      </div>

      <div>
        <h4 className="font-display font-bold text-background mb-4 text-sm">Contact Us</h4>
        <div className="space-y-3">
          <p className="flex items-center gap-2.5 text-sm text-background/50">
            <Phone className="h-4 w-4 text-primary" /> +91 98765 43210
          </p>
          <p className="flex items-center gap-2.5 text-sm text-background/50">
            <Mail className="h-4 w-4 text-primary" /> {BRAND_EMAIL}
          </p>
          <p className="flex items-start gap-2.5 text-sm text-background/50">
            <MapPin className="h-4 w-4 text-primary mt-0.5" /> Madurai, Tamil Nadu, India
          </p>
        </div>
      </div>
    </div>

    <div className="border-t border-background/10 py-5 text-center text-xs text-background/30">
      © 2026 {BRAND_NAME}. All rights reserved. Built with love.
    </div>
  </footer>
);

export default Footer;
