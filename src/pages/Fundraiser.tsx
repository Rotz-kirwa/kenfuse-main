import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/api";
import { authHeader, isLoggedIn } from "@/lib/session";
import { toast } from "@/components/ui/sonner";

interface FundraiserItem {
  id: string;
  title: string;
  story: string;
  targetAmount: number;
  totalRaised: number;
  currency: string;
  owner: {
    fullName: string;
  };
}

interface FundraisersResponse {
  fundraisers: FundraiserItem[];
}

const Fundraiser = () => {
  const [fundraisers, setFundraisers] = useState<FundraiserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittingCreate, setSubmittingCreate] = useState(false);
  const [contributionLoadingId, setContributionLoadingId] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [story, setStory] = useState("");
  const [targetAmount, setTargetAmount] = useState("");

  const loggedIn = isLoggedIn();

  async function loadFundraisers() {
    try {
      const response = await apiRequest<FundraisersResponse>("/api/fundraisers?status=ACTIVE");
      setFundraisers(response.fundraisers);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load fundraisers");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadFundraisers();
  }, []);

  async function createFundraiser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!loggedIn) {
      toast.error("Please sign in to create a fundraiser");
      return;
    }

    const parsedTarget = Number(targetAmount);
    if (!Number.isInteger(parsedTarget) || parsedTarget <= 0) {
      toast.error("Target amount must be a positive number");
      return;
    }

    setSubmittingCreate(true);

    try {
      await apiRequest("/api/fundraisers", {
        method: "POST",
        headers: authHeader(),
        body: JSON.stringify({
          title: title.trim(),
          story: story.trim(),
          targetAmount: parsedTarget,
          currency: "KES",
        }),
      });

      setTitle("");
      setStory("");
      setTargetAmount("");
      toast.success("Fundraiser created");
      setLoading(true);
      await loadFundraisers();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create fundraiser");
    } finally {
      setSubmittingCreate(false);
    }
  }

  async function contribute(event: FormEvent<HTMLFormElement>, fundraiserId: string) {
    event.preventDefault();

    const form = event.currentTarget;
    const data = new FormData(form);
    const contributorName = String(data.get("contributorName") ?? "").trim();
    const contributorEmail = String(data.get("contributorEmail") ?? "").trim();
    const contributionAmount = String(data.get("amount") ?? "");
    const contributionMessage = String(data.get("message") ?? "").trim();

    const parsedAmount = Number(contributionAmount);
    if (!Number.isInteger(parsedAmount) || parsedAmount <= 0) {
      toast.error("Contribution must be a positive number");
      return;
    }

    setContributionLoadingId(fundraiserId);

    try {
      await apiRequest(`/api/fundraisers/${fundraiserId}/contributions`, {
        method: "POST",
        body: JSON.stringify({
          contributorName,
          contributorEmail: contributorEmail || undefined,
          amount: parsedAmount,
          message: contributionMessage || undefined,
        }),
      });

      form.reset();
      toast.success("Contribution received");
      setLoading(true);
      await loadFundraisers();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to contribute");
    } finally {
      setContributionLoadingId(null);
    }
  }

  return (
    <Layout>
      <section className="pt-32 pb-24">
        <div className="container mx-auto px-4 lg:px-8 max-w-5xl">
          <div className="text-center mb-12">
            <div className="w-16 h-16 rounded-2xl bg-gold-light flex items-center justify-center mx-auto mb-6">
              <Heart size={32} className="text-accent" />
            </div>
            <h1 className="font-display text-4xl sm:text-5xl font-bold text-foreground">Community Fundraising</h1>
            <p className="mt-4 text-muted-foreground text-lg">Create and support funeral fundraisers transparently.</p>
          </div>

          {loggedIn ? (
            <form onSubmit={createFundraiser} className="bg-card border border-border rounded-xl p-6 shadow-card mb-8 space-y-4">
              <h2 className="font-display text-2xl">Create Fundraiser</h2>
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" value={title} onChange={(event) => setTitle(event.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="story">Story</Label>
                <Textarea id="story" value={story} onChange={(event) => setStory(event.target.value)} rows={4} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="targetAmount">Target Amount (KES)</Label>
                <Input
                  id="targetAmount"
                  type="number"
                  min={1}
                  value={targetAmount}
                  onChange={(event) => setTargetAmount(event.target.value)}
                  required
                />
              </div>
              <Button type="submit" disabled={submittingCreate}>
                {submittingCreate ? "Creating..." : "Create Fundraiser"}
              </Button>
            </form>
          ) : (
            <div className="bg-card border border-border rounded-xl p-6 shadow-card mb-8 text-center">
              <p className="text-muted-foreground mb-4">Sign in to create a fundraiser.</p>
              <Button asChild>
                <Link to="/auth?mode=signup">Sign In</Link>
              </Button>
            </div>
          )}

          <div className="space-y-6">
            <h2 className="font-display text-3xl">Active Fundraisers</h2>
            {loading ? (
              <p className="text-muted-foreground">Loading fundraisers...</p>
            ) : fundraisers.length === 0 ? (
              <p className="text-muted-foreground">No active fundraisers yet.</p>
            ) : (
              fundraisers.map((fundraiser) => (
                <div key={fundraiser.id} className="bg-card border border-border rounded-xl p-6 shadow-card space-y-4">
                  <div>
                    <h3 className="font-display text-2xl">{fundraiser.title}</h3>
                    <p className="text-sm text-muted-foreground">By {fundraiser.owner.fullName}</p>
                  </div>
                  <p className="text-muted-foreground">{fundraiser.story}</p>
                  <p className="text-sm">
                    Raised <strong>{fundraiser.currency} {fundraiser.totalRaised.toLocaleString()}</strong> of {fundraiser.currency}{" "}
                    {fundraiser.targetAmount.toLocaleString()}
                  </p>

                  <form onSubmit={(event) => contribute(event, fundraiser.id)} className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Contributor Name</Label>
                      <Input name="contributorName" required />
                    </div>
                    <div className="space-y-2">
                      <Label>Email (optional)</Label>
                      <Input type="email" name="contributorEmail" />
                    </div>
                    <div className="space-y-2">
                      <Label>Amount (KES)</Label>
                      <Input type="number" min={1} name="amount" required />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label>Message (optional)</Label>
                      <Textarea name="message" rows={2} />
                    </div>
                    <div className="md:col-span-2">
                      <Button type="submit" disabled={contributionLoadingId === fundraiser.id}>
                        {contributionLoadingId === fundraiser.id ? "Submitting..." : "Contribute"}
                      </Button>
                    </div>
                  </form>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Fundraiser;
