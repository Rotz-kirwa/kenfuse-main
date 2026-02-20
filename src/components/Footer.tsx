import { Link } from "react-router-dom";
import { Facebook, Heart, Instagram, Twitter } from "lucide-react";

const footerLinks = {
  Platform: [
    { label: "How It Works", href: "/how-it-works" },
    { label: "Legacy Plans", href: "/legacy-plan" },
    { label: "Marketplace", href: "/marketplace" },
    { label: "Fundraiser", href: "/fundraiser" },
    { label: "Memorials", href: "/memorials" },
  ],
  Company: [
    { label: "About Us", href: "/about" },
    { label: "Pricing", href: "/pricing" },
    { label: "Contact", href: "/contact" },
    { label: "Careers", href: "#" },
  ],
  Legal: [
    { label: "Privacy Policy", href: "#" },
    { label: "Terms of Service", href: "#" },
    { label: "Cookie Policy", href: "#" },
  ],
};

const socialLinks = [
  {
    label: "TikTok",
    href: "#",
    icon: "tiktok" as const,
    background: "#000000",
    color: "#FFFFFF",
  },
  {
    label: "Instagram",
    href: "#",
    icon: Instagram,
    background: "linear-gradient(135deg, #F58529 0%, #DD2A7B 45%, #8134AF 75%, #515BD4 100%)",
    color: "#FFFFFF",
  },
  {
    label: "Facebook",
    href: "#",
    icon: Facebook,
    background: "#1877F2",
    color: "#FFFFFF",
  },
  {
    label: "Twitter",
    href: "#",
    icon: Twitter,
    background: "#1DA1F2",
    color: "#FFFFFF",
  },
];

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
            <div className="mt-5 flex items-center gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-primary-foreground/20 transition-transform hover:scale-105"
                  style={{ color: social.color, background: social.background }}
                >
                  {social.icon === "tiktok" ? (
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
                      <path d="M14 3h3.02c.18 1.44.99 2.66 2.48 3.4v2.88a6.96 6.96 0 0 1-2.5-.86v6.27a5.69 5.69 0 1 1-5.7-5.69c.26 0 .53.02.7.07v2.93a2.86 2.86 0 1 0 2 2.72V3z" />
                    </svg>
                  ) : (
                    <social.icon size={16} />
                  )}
                </a>
              ))}
            </div>
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
