import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, Heart, Users, ShoppingBag, BookOpen, ArrowRight, Star, Lock, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import Layout from "@/components/Layout";

const heroImageUrl = "https://i.pinimg.com/736x/26/53/2b/26532b17e6ca0ab9f9bf1d8e97e905b0.jpg";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.12, duration: 0.5, ease: "easeOut" as const },
  }),
};

const features = [
  {
    icon: FileText,
    title: "Legacy Planning",
    description: "Create a comprehensive digital will with guided steps — assets, beneficiaries, wishes, and key documents all in one secure place.",
    href: "/dashboard?tab=legacy",
    cta: "Start Your Plan",
  },
  {
    icon: Heart,
    title: "Fundraiser",
    description: "Set up funeral fundraisers with transparent tracking. Accept contributions from family and community with dignity.",
    href: "/dashboard?tab=fundraiser",
    cta: "Create Fundraiser",
  },
  {
    icon: ShoppingBag,
    title: "Marketplace",
    description: "Browse vetted funeral products and services — caskets, floral arrangements, hearse hire, catering, and more.",
    href: "/marketplace",
    cta: "Shop Now",
  },
  {
    icon: BookOpen,
    title: "Memorial Pages",
    description: "Honor loved ones with beautiful tribute pages featuring photos, stories, and a community guestbook.",
    href: "/dashboard?tab=memorial",
    cta: "Create Memorial",
  },
];

const steps = [
  {
    number: "01",
    title: "Create Your Account",
    description: "Sign up securely and begin your legacy planning journey at your own pace.",
  },
  {
    number: "02",
    title: "Build Your Legacy Plan",
    description: "Use our guided wizard to document your wishes, assets, beneficiaries, and important instructions.",
  },
  {
    number: "03",
    title: "Invite Trusted People",
    description: "Share access with family, friends, or legal advisors using secure, unique access codes.",
  },
  {
    number: "04",
    title: "Coordinate & Support",
    description: "When the time comes, your plan guides your loved ones — with fundraising and marketplace tools to help.",
  },
];

const trustSignals = [
  { icon: Lock, label: "Bank-Level Encryption" },
  { icon: Shield, label: "Private & Secure" },
  { icon: Users, label: "Trusted by Families" },
  { icon: Star, label: "5-Star Support" },
];

const Index = () => {
  return (
    <Layout>
      {/* Hero */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden pt-16">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImageUrl})` }}
        />
        <div className="absolute inset-0 bg-gradient-hero" />
        <div className="relative z-10 container mx-auto px-4 lg:px-8 py-20 text-center">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="text-accent font-body font-medium text-sm uppercase tracking-[0.2em] mb-6"
          >
            Legacy Planning for East Africa & Beyond
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="font-display text-4xl sm:text-5xl lg:text-7xl font-bold text-accent-foreground leading-[1.1] max-w-4xl mx-auto"
          >
            Plan Your Legacy.{" "}
            <span className="text-gradient-gold">Protect Your Family.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-6 text-lg sm:text-xl text-accent-foreground/75 font-body max-w-2xl mx-auto leading-relaxed"
          >
            A calm, secure platform to create your digital will, coordinate funerals, 
            raise funds, and access trusted services — all in one place.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.45 }}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Button variant="hero" size="lg" asChild>
              <Link to="/dashboard?tab=legacy">
                Start Your Legacy Plan
                <ArrowRight size={18} />
              </Link>
            </Button>
            <Button variant="hero-outline" size="lg" asChild>
              <Link to="/how-it-works">How It Works</Link>
            </Button>
          </motion.div>

          {/* Trust signals */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mt-16 flex flex-wrap items-center justify-center gap-8"
          >
            {trustSignals.map((signal) => (
              <div key={signal.label} className="flex items-center gap-2 text-accent-foreground/50">
                <signal.icon size={16} />
                <span className="text-xs font-body font-medium tracking-wide">{signal.label}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 lg:py-32">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground">
              Everything Your Family Needs
            </h2>
            <p className="mt-4 text-muted-foreground text-lg leading-relaxed">
              From planning ahead to supporting your loved ones — Kenfuse brings together 
              the tools that matter most during life's most important moments.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
                variants={fadeUp}
                className="group bg-card rounded-xl p-8 lg:p-10 shadow-card hover:shadow-elevated transition-all duration-300 border border-border"
              >
                <div className="w-12 h-12 rounded-lg bg-sage-light flex items-center justify-center mb-5">
                  <feature.icon size={24} className="text-sage" />
                </div>
                <h3 className="font-display text-xl font-semibold text-foreground mb-3">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed mb-6">
                  {feature.description}
                </p>
                <Link
                  to={feature.href}
                  className="inline-flex items-center gap-2 text-sm font-medium text-accent hover:text-accent/80 transition-colors"
                >
                  {feature.cta}
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 lg:py-32 bg-muted/50">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground">
              How Kenfuse Works
            </h2>
            <p className="mt-4 text-muted-foreground text-lg">
              Four simple steps to peace of mind.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, i) => (
              <motion.div
                key={step.number}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
                variants={fadeUp}
                className="text-center lg:text-left"
              >
                <span className="font-display text-5xl font-bold text-accent/20">
                  {step.number}
                </span>
                <h3 className="font-display text-lg font-semibold text-foreground mt-2 mb-2">
                  {step.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 lg:py-32">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="bg-primary rounded-2xl p-10 lg:p-16 text-center">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-primary-foreground">
              Start Planning Today
            </h2>
            <p className="mt-4 text-primary-foreground/70 text-lg max-w-xl mx-auto">
              Give your family the gift of clarity. Your legacy plan is private, secure, 
              and always under your control.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button variant="hero" size="lg" asChild>
                <Link to="/auth?mode=signup">
                  Create Free Account
                  <ArrowRight size={18} />
                </Link>
              </Button>
              <Button variant="hero-outline" size="lg" asChild>
                <Link to="/pricing">View Pricing</Link>
              </Button>
            </div>
            <p className="mt-6 text-xs text-primary-foreground/40 font-body">
              Kenfuse is not a law firm. Consider legal review for formal wills.
            </p>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
