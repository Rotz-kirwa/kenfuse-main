import Layout from "@/components/Layout";
import { motion } from "framer-motion";
import { Shield, Users, FileText, Heart, ShoppingBag, BookOpen, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const steps = [
  {
    icon: FileText,
    title: "Create Your Legacy Plan",
    description: "Use our step-by-step wizard to document your wishes, list your assets, name beneficiaries, and upload key documents. Everything stays private and encrypted.",
  },
  {
    icon: Users,
    title: "Invite Trusted People",
    description: "Generate unique, secure access codes for family members, lawyers, or close friends. Set exact permissions for what they can view or manage.",
  },
  {
    icon: Heart,
    title: "Set Up a Fundraiser",
    description: "Create a fundraiser page for funeral expenses or family support. Track contributions transparently with auto-receipts for donors.",
  },
  {
    icon: ShoppingBag,
    title: "Shop the Marketplace",
    description: "Browse vetted funeral products and services from local vendors — caskets, flowers, hearse hire, catering, and more. All in one trusted place.",
  },
  {
    icon: BookOpen,
    title: "Create a Memorial",
    description: "Honor your loved one with a beautiful online tribute page. Share photos, stories, and invite the community to leave messages.",
  },
  {
    icon: Shield,
    title: "Stay in Control",
    description: "Update your plan anytime, revoke access instantly, and export your complete legacy pack as a PDF. Your data is always yours.",
  },
];

const HowItWorks = () => {
  return (
    <Layout>
      <section className="pt-32 pb-24">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-20">
            <h1 className="font-display text-4xl sm:text-5xl font-bold text-foreground">
              How Kenfuse Works
            </h1>
            <p className="mt-6 text-muted-foreground text-lg leading-relaxed">
              A guided, compassionate approach to legacy planning and funeral coordination.
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-12">
            {steps.map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="flex gap-6 items-start"
              >
                <div className="w-14 h-14 rounded-xl bg-sage-light flex items-center justify-center shrink-0">
                  <step.icon size={28} className="text-sage" />
                </div>
                <div>
                  <h3 className="font-display text-xl font-semibold text-foreground mb-2">{step.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-20">
            <Button size="lg" asChild>
              <Link to="/auth?mode=signup">
                Get Started Free <ArrowRight size={18} />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default HowItWorks;
