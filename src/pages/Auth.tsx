import Layout from "@/components/Layout";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const Auth = () => {
  const [isSignUp, setIsSignUp] = useState(
    new URLSearchParams(window.location.search).get("mode") === "signup"
  );

  return (
    <Layout hideFooter>
      <section className="pt-24 pb-16 min-h-screen flex items-center">
        <div className="container mx-auto px-4 max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-2xl border border-border shadow-elevated p-8"
          >
            <div className="text-center mb-8">
              <Link to="/" className="inline-block">
                <span className="font-display text-2xl font-bold text-foreground">
                  Ken<span className="text-accent">fuse</span>
                </span>
              </Link>
              <h1 className="font-display text-2xl font-bold text-foreground mt-6">
                {isSignUp ? "Create Your Account" : "Welcome Back"}
              </h1>
              <p className="text-muted-foreground text-sm mt-2">
                {isSignUp
                  ? "Start planning your legacy today."
                  : "Sign in to access your legacy plan."}
              </p>
            </div>

            <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
              {isSignUp && (
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" name="name" placeholder="Your full name" />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" name="email" type="email" placeholder="you@example.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" name="password" type="password" placeholder="••••••••" />
              </div>
              <Button className="w-full" size="lg">
                {isSignUp ? "Create Account" : "Sign In"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
                <button
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-accent font-medium hover:underline"
                >
                  {isSignUp ? "Sign In" : "Sign Up"}
                </button>
              </p>
            </div>

            {!isSignUp && (
              <div className="mt-4 text-center">
                <button className="text-sm text-muted-foreground hover:text-accent transition-colors">
                  Forgot your password?
                </button>
              </div>
            )}
          </motion.div>
        </div>
      </section>
    </Layout>
  );
};

export default Auth;
