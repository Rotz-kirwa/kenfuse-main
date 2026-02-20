import Layout from "@/components/Layout";
import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { apiRequest } from "@/lib/api";
import { toast } from "@/components/ui/sonner";

interface AuthResponse {
  user: {
    id: string;
    fullName: string;
    email: string;
    role: string;
  };
  token: string;
}

const Auth = () => {
  const [isSignUp, setIsSignUp] = useState(
    new URLSearchParams(window.location.search).get("mode") === "signup"
  );
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const submitLabel = isSignUp ? "Create Account" : "Sign In";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSignUp && name.trim().length < 2) {
      toast.error("Please enter your full name");
      return;
    }

    if (!email.trim()) {
      toast.error("Please enter your email");
      return;
    }

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setIsLoading(true);

    try {
      const payload = isSignUp
        ? { fullName: name.trim(), email: email.trim(), password }
        : { email: email.trim(), password };

      const endpoint = isSignUp ? "/api/auth/register" : "/api/auth/login";

      const response = await apiRequest<AuthResponse>(endpoint, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      localStorage.setItem("kenfuse_token", response.token);
      localStorage.setItem("kenfuse_user", JSON.stringify(response.user));

      toast.success(isSignUp ? "Account created successfully" : "Signed in successfully");
      window.location.href = "/";
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Authentication failed");
    } finally {
      setIsLoading(false);
    }
  }

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

            <form className="space-y-4" onSubmit={handleSubmit}>
              {isSignUp && (
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="Your full name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    disabled={isLoading}
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  disabled={isLoading}
                />
                <label className="text-xs text-muted-foreground inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={showPassword}
                    onChange={(event) => setShowPassword(event.target.checked)}
                    disabled={isLoading}
                  />
                  Show password
                </label>
              </div>
              <Button className="w-full" size="lg" disabled={isLoading}>
                {isLoading ? "Please wait..." : submitLabel}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
                <button
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-accent font-medium hover:underline"
                  disabled={isLoading}
                >
                  {isSignUp ? "Sign In" : "Sign Up"}
                </button>
              </p>
            </div>

            {!isSignUp && (
              <div className="mt-4 text-center">
                <button className="text-sm text-muted-foreground hover:text-accent transition-colors" disabled>
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
