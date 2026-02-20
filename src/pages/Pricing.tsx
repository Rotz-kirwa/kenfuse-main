import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Check } from "lucide-react";

const plans = [
  {
    name: "Free",
    price: "KES 0",
    period: "forever",
    description: "Get started with basic legacy planning.",
    features: [
      "Basic legacy plan",
      "1 trusted person",
      "Memorial page",
      "Community support",
    ],
    cta: "Start Free",
    featured: false,
  },
  {
    name: "Premium",
    price: "KES 500",
    period: "/month",
    description: "Complete legacy planning with full features.",
    features: [
      "Complete legacy wizard",
      "Unlimited trusted people",
      "PDF export",
      "Fundraiser creation",
      "Marketplace access",
      "Priority support",
      "Document uploads",
      "Version history",
    ],
    cta: "Get Premium",
    featured: true,
  },
  {
    name: "Family",
    price: "KES 900",
    period: "/month",
    description: "For families who want to plan together.",
    features: [
      "Everything in Premium",
      "Up to 5 family plans",
      "Shared family vault",
      "Dedicated support",
      "Legal review discount",
    ],
    cta: "Choose Family",
    featured: false,
  },
];

const Pricing = () => {
  return (
    <Layout>
      <section className="pt-32 pb-24">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h1 className="font-display text-4xl sm:text-5xl font-bold text-foreground">
              Simple, Transparent Pricing
            </h1>
            <p className="mt-4 text-muted-foreground text-lg">
              Start free. Upgrade when you're ready.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-xl p-8 border ${
                  plan.featured
                    ? "border-accent shadow-elevated bg-card scale-105"
                    : "border-border shadow-card bg-card"
                }`}
              >
                {plan.featured && (
                  <span className="inline-block bg-gradient-gold text-accent-foreground text-xs font-semibold px-3 py-1 rounded-full mb-4">
                    Most Popular
                  </span>
                )}
                <h3 className="font-display text-2xl font-bold text-foreground">{plan.name}</h3>
                <div className="mt-2">
                  <span className="text-3xl font-bold text-foreground">{plan.price}</span>
                  <span className="text-muted-foreground text-sm">{plan.period}</span>
                </div>
                <p className="mt-3 text-muted-foreground text-sm">{plan.description}</p>
                <ul className="mt-6 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-foreground">
                      <Check size={16} className="text-sage shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full mt-8"
                  variant={plan.featured ? "hero" : "outline"}
                  asChild
                >
                  <Link to="/auth?mode=signup">
                    {plan.cta} <ArrowRight size={16} />
                  </Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Pricing;
