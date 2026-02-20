import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { BookOpen } from "lucide-react";
import { motion } from "framer-motion";

const Memorials = () => {
  return (
    <Layout>
      <section className="pt-32 pb-24">
        <div className="container mx-auto px-4 lg:px-8 max-w-3xl text-center">
          <div className="w-16 h-16 rounded-2xl bg-sage-light flex items-center justify-center mx-auto mb-8">
            <BookOpen size={32} className="text-sage" />
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-foreground">
            Memorial Pages
          </h1>
          <p className="mt-6 text-muted-foreground text-lg leading-relaxed max-w-xl mx-auto">
            Create beautiful tribute pages to honor and remember loved ones. 
            Share photos, stories, and a community guestbook.
          </p>
          <div className="mt-10">
            <Button size="lg" asChild>
              <Link to="/auth?mode=signup">Create a Memorial</Link>
            </Button>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-20 text-center"
          >
            <BookOpen size={48} className="text-muted-foreground/20 mx-auto mb-4" />
            <p className="text-muted-foreground">
              Public memorial pages will appear here.
            </p>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
};

export default Memorials;
