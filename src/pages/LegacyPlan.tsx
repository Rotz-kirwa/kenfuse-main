import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Lock } from "lucide-react";

const LegacyPlan = () => {
  return (
    <Layout>
      <section className="pt-32 pb-24">
        <div className="container mx-auto px-4 lg:px-8 max-w-3xl text-center">
          <div className="w-16 h-16 rounded-2xl bg-sage-light flex items-center justify-center mx-auto mb-8">
            <Lock size={32} className="text-sage" />
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-foreground">
            Your Legacy Plan
          </h1>
          <p className="mt-6 text-muted-foreground text-lg leading-relaxed max-w-xl mx-auto">
            Create a comprehensive digital will with our guided wizard. Document your wishes, 
            assets, beneficiaries, and important instructions — all securely encrypted.
          </p>
          <div className="mt-10">
            <Button size="lg" asChild>
              <Link to="/auth?mode=signup">
                Sign In to Start <ArrowRight size={18} />
              </Link>
            </Button>
          </div>
          <p className="mt-8 text-xs text-muted-foreground">
            Kenfuse is not a law firm. Consider legal review for formal wills.
          </p>
        </div>
      </section>
    </Layout>
  );
};

export default LegacyPlan;
