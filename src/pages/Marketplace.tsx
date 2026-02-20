import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ShoppingBag, Search, Filter } from "lucide-react";
import { motion } from "framer-motion";

const categories = [
  "Caskets & Coffins", "Urns", "Flowers & Wreaths", "Memorial Frames",
  "Tents & Chairs", "PA Systems", "Printed Programs", "Banners",
  "Hearse Hire", "Mortuary Services", "Body Transport", "Grave Services",
  "Event Coordination", "Catering", "Live Streaming", "Tribute Videos",
];

const Marketplace = () => {
  return (
    <Layout>
      <section className="pt-32 pb-24">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h1 className="font-display text-4xl sm:text-5xl font-bold text-foreground">
              Funeral Marketplace
            </h1>
            <p className="mt-4 text-muted-foreground text-lg">
              Browse trusted products and services from verified vendors across East Africa.
            </p>
          </div>

          {/* Search bar placeholder */}
          <div className="max-w-2xl mx-auto mb-12">
            <div className="flex items-center gap-3 bg-card rounded-xl border border-border p-3 shadow-card">
              <Search size={20} className="text-muted-foreground" />
              <input
                type="text"
                placeholder="Search products and services..."
                className="flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
              />
              <Button size="sm" variant="outline">
                <Filter size={16} /> Filters
              </Button>
            </div>
          </div>

          {/* Categories */}
          <div className="flex flex-wrap justify-center gap-3 mb-16">
            {categories.map((cat) => (
              <span
                key={cat}
                className="px-4 py-2 bg-muted rounded-full text-sm text-muted-foreground hover:bg-sage-light hover:text-sage cursor-pointer transition-colors"
              >
                {cat}
              </span>
            ))}
          </div>

          {/* Empty state */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <ShoppingBag size={48} className="text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="font-display text-xl font-semibold text-foreground mb-2">
              Marketplace Coming Soon
            </h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              We're onboarding trusted vendors across East Africa. Sign up to be notified when the marketplace launches.
            </p>
            <Button className="mt-6" asChild>
              <Link to="/auth?mode=signup">Get Notified</Link>
            </Button>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
};

export default Marketplace;
