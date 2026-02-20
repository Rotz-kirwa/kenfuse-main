import { Link } from "react-router-dom";
import { Heart } from "lucide-react";

const footerLinks = {
  Platform: [
    { label: "How It Works", href: "/how-it-works" },
    { label: "Legacy Plans", href: "/legacy-plan" },
    { label: "Marketplace", href: "/marketplace" },
    { label: "Fundraiser", href: "/fundraiser" },
    { label: "Memorials", href: "/memorials" },
  ],
  Company: [
    { label: "About Us", href: "#" },
    { label: "Pricing", href: "/pricing" },
    { label: "Contact", href: "#" },
    { label: "Careers", href: "#" },
  ],
  Legal: [
    { label: "Privacy Policy", href: "#" },
    { label: "Terms of Service", href: "#" },
    { label: "Cookie Policy", href: "#" },
  ],
};

const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <span className="font-display text-2xl font-bold tracking-tight">
              Ken<span className="text-accent">fuse</span>
            </span>
            <p className="mt-4 text-sm text-primary-foreground/70 leading-relaxed max-w-xs">
              A calm, secure platform for legacy planning, funeral coordination, 
              and community support across East Africa and beyond.
            </p>
          </div>

          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="font-body font-semibold text-sm uppercase tracking-wider mb-4 text-primary-foreground/50">
                {category}
              </h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.href}
                      className="text-sm text-primary-foreground/70 hover:text-accent transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 pt-8 border-t border-primary-foreground/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-primary-foreground/50">
            © {new Date().getFullYear()} Kenfuse. All rights reserved.
          </p>
          <p className="text-xs text-primary-foreground/50 flex items-center gap-1">
            Made with <Heart size={12} className="text-accent" /> for families everywhere
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
