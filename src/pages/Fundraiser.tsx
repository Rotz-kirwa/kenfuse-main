import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Heart, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

const Fundraiser = () => {
  return (
    <Layout>
      <section className="pt-32 pb-24">
        <div className="container mx-auto px-4 lg:px-8 max-w-3xl text-center">
          <div className="w-16 h-16 rounded-2xl bg-gold-light flex items-center justify-center mx-auto mb-8">
            <Heart size={32} className="text-accent" />
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-foreground">
            Community Fundraising
          </h1>
          <p className="mt-6 text-muted-foreground text-lg leading-relaxed max-w-xl mx-auto">
            Create transparent funeral fundraisers with auto-receipts, donor tracking, 
            and secure contributions. Support families during their time of need.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" asChild>
              <Link to="/auth?mode=signup">
                Create a Fundraiser <ArrowRight size={18} />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/auth">Contribute to a Fundraiser</Link>
            </Button>
          </div>

          {/* Sample fundraiser cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-20 text-center"
          >
            <Heart size={48} className="text-muted-foreground/20 mx-auto mb-4" />
            <p className="text-muted-foreground">
              Active fundraisers will appear here. Sign in to create or contribute.
            </p>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
};

export default Fundraiser;
