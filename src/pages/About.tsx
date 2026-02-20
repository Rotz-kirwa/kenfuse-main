import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart, Shield, Users, ArrowRight } from "lucide-react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";

const pillars = [
  {
    icon: Heart,
    title: "Dignity for Every Family",
    description:
      "Kenfuse helps families prepare and respond with calm, respect, and clear guidance during difficult moments.",
  },
  {
    icon: Shield,
    title: "Secure Legacy Records",
    description:
      "Important wishes, plans, and documents stay protected so trusted people can access what matters when needed.",
  },
  {
    icon: Users,
    title: "Community Support in One Place",
    description:
      "From memorials and fundraising to marketplace services, Kenfuse connects families and communities without confusion.",
  },
];

const About = () => {
  return (
    <Layout>
      <section className="pt-32 pb-24">
        <div className="container mx-auto px-4 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="max-w-3xl mx-auto text-center"
          >
            <p className="text-sm uppercase tracking-[0.2em] text-accent font-medium">
              About Kenfuse
            </p>
            <h1 className="mt-4 font-display text-4xl sm:text-5xl font-bold text-foreground">
              Why Kenfuse Exists
            </h1>
            <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
              Kenfuse is built to give families clarity before, during, and after loss.
              Our purpose is to reduce stress, protect final wishes, and make support
              easier to coordinate across loved ones and communities.
            </p>
          </motion.div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
            {pillars.map((pillar, i) => (
              <motion.div
                key={pillar.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="rounded-xl border border-border bg-card p-6 shadow-card"
              >
                <div className="w-11 h-11 rounded-lg bg-sage-light flex items-center justify-center mb-4">
                  <pillar.icon size={22} className="text-sage" />
                </div>
                <h2 className="font-display text-xl font-semibold text-foreground">
                  {pillar.title}
                </h2>
                <p className="mt-3 text-muted-foreground leading-relaxed">
                  {pillar.description}
                </p>
              </motion.div>
            ))}
          </div>

          <div className="mt-16 rounded-2xl bg-primary p-8 lg:p-12 text-center">
            <h3 className="font-display text-2xl sm:text-3xl font-bold text-primary-foreground">
              The Importance of Kenfuse
            </h3>
            <p className="mt-4 max-w-2xl mx-auto text-primary-foreground/80 leading-relaxed">
              Families should not struggle to find plans, raise urgent support, or
              coordinate funeral needs in scattered tools. Kenfuse brings everything
              together in one trusted platform so decisions are clear and support is fast.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 items-center justify-center">
              <Button variant="hero" size="lg" asChild>
                <Link to="/auth?mode=signup">
                  Get Started
                  <ArrowRight size={18} />
                </Link>
              </Button>
              <Button variant="hero-outline" size="lg" asChild>
                <Link to="/how-it-works">See How It Works</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default About;
