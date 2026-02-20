import { FormEvent, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Heart } from "lucide-react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/api";
import { authHeader, getSessionUser, isLoggedIn } from "@/lib/session";
import { toast } from "@/components/ui/sonner";

interface FundraiserItem {
  id: string;
  title: string;
  story: string;
  targetAmount: number;
  totalRaised: number;
  currency: string;
  visibilityType?: "PUBLIC" | "LINK_ONLY" | "PRIVATE";
  inviteCode?: string | null;
  owner: {
    id: string;
    fullName: string;
  };
}

interface FundraisersResponse {
  fundraisers: FundraiserItem[];
}

const Fundraiser = () => {
  const [searchParams] = useSearchParams();
  const [fundraisers, setFundraisers] = useState<FundraiserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittingCreate, setSubmittingCreate] = useState(false);
  const [joiningInvite, setJoiningInvite] = useState(false);
  const [inviteFundraiser, setInviteFundraiser] = useState<FundraiserItem | null>(null);
  const [inviteFundraiserId, setInviteFundraiserId] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [submittingContribution, setSubmittingContribution] = useState(false);

  const [contributorName, setContributorName] = useState("");
  const [contributorEmail, setContributorEmail] = useState("");
  const [contributionAmount, setContributionAmount] = useState("");
  const [contributionMessage, setContributionMessage] = useState("");

  const [title, setTitle] = useState("");
  const [story, setStory] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [visibilityType, setVisibilityType] = useState<"PUBLIC" | "LINK_ONLY" | "PRIVATE">("PUBLIC");

  const loggedIn = isLoggedIn();
  const sessionUser = getSessionUser();

  async function loadFundraisers() {
    if (!loggedIn || !sessionUser) {
      setFundraisers([]);
      setLoading(false);
      return;
    }

    try {
      const response = await apiRequest<FundraisersResponse>("/api/fundraisers?status=ACTIVE", {
        headers: authHeader(),
      });
      const mine = response.fundraisers.filter((item) => item.owner.id === sessionUser.id);
      setFundraisers(mine);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load fundraisers");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadFundraisers();
  }, [loggedIn, sessionUser?.id]);

  async function loadInviteFundraiserByCode(fundraiserId: string, code: string) {
    if (!fundraiserId.trim() || !code.trim()) {
      toast.error("Enter both fundraiser ID and invite code");
      return;
    }

    setJoiningInvite(true);
    try {
      const response = await apiRequest<{ fundraiser: FundraiserItem }>(
        `/api/fundraisers/${encodeURIComponent(fundraiserId.trim())}?inviteCode=${encodeURIComponent(code.trim())}`,
        { headers: loggedIn ? authHeader() : undefined }
      );
      setInviteFundraiser(response.fundraiser);
      toast.success("Invite code accepted. You can now participate.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Invalid invite code or fundraiser ID");
    } finally {
      setJoiningInvite(false);
    }
  }

  useEffect(() => {
    const fundraiserIdFromUrl = searchParams.get("fundraiserId");
    const inviteCodeFromUrl = searchParams.get("inviteCode");

    if (!fundraiserIdFromUrl || !inviteCodeFromUrl) return;

    setInviteFundraiserId(fundraiserIdFromUrl);
    setInviteCode(inviteCodeFromUrl);
    void loadInviteFundraiserByCode(fundraiserIdFromUrl, inviteCodeFromUrl);
  }, [searchParams]);

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
          visibilityType,
        }),
      });

      setTitle("");
      setStory("");
      setTargetAmount("");
      setVisibilityType("PUBLIC");
      toast.success("Fundraiser created");
      setLoading(true);
      await loadFundraisers();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create fundraiser");
    } finally {
      setSubmittingCreate(false);
    }
  }

  async function submitInviteContribution(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!inviteFundraiser) {
      toast.error("Open an invited fundraiser first");
      return;
    }

    const amount = Number(contributionAmount);
    if (!contributorName.trim() || !Number.isInteger(amount) || amount <= 0) {
      toast.error("Add contributor name and a valid amount");
      return;
    }

    setSubmittingContribution(true);
    try {
      await apiRequest(`/api/fundraisers/${inviteFundraiser.id}/contributions?inviteCode=${encodeURIComponent(inviteCode.trim())}`, {
        method: "POST",
        headers: loggedIn ? authHeader() : undefined,
        body: JSON.stringify({
          contributorName: contributorName.trim(),
          contributorEmail: contributorEmail.trim() || undefined,
          amount,
          message: contributionMessage.trim() || undefined,
        }),
      });

      toast.success("Contribution submitted");
      setContributionAmount("");
      setContributionMessage("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to submit contribution");
    } finally {
      setSubmittingContribution(false);
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
              <div className="space-y-2">
                <Label>Visibility</Label>
                <select
                  value={visibilityType}
                  onChange={(event) => setVisibilityType(event.target.value as "PUBLIC" | "LINK_ONLY" | "PRIVATE")}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="PUBLIC">Public</option>
                  <option value="LINK_ONLY">Link-only (invite by code/link)</option>
                  <option value="PRIVATE">Private (invite by code/link)</option>
                </select>
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

          <div className="bg-card border border-border rounded-xl p-6 shadow-card mb-8 space-y-4">
            <h2 className="font-display text-2xl">Join with Invite Code</h2>
            <p className="text-sm text-muted-foreground">Use fundraiser ID and invite code, or open the invite link directly.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Fundraiser ID</Label>
                <Input value={inviteFundraiserId} onChange={(event) => setInviteFundraiserId(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Invite Code</Label>
                <Input value={inviteCode} onChange={(event) => setInviteCode(event.target.value.toUpperCase())} />
              </div>
            </div>
            <Button type="button" onClick={() => void loadInviteFundraiserByCode(inviteFundraiserId, inviteCode)} disabled={joiningInvite}>
              {joiningInvite ? "Checking..." : "Join Fundraiser"}
            </Button>
          </div>

          {inviteFundraiser ? (
            <div className="bg-card border border-border rounded-xl p-6 shadow-card mb-8 space-y-4">
              <h2 className="font-display text-2xl">Invited Fundraiser</h2>
              <h3 className="font-display text-xl">{inviteFundraiser.title}</h3>
              <p className="text-sm text-muted-foreground">By {inviteFundraiser.owner.fullName}</p>
              <p className="text-muted-foreground">{inviteFundraiser.story}</p>
              <p className="text-sm">
                Raised <strong>{inviteFundraiser.currency} {inviteFundraiser.totalRaised.toLocaleString()}</strong> of {inviteFundraiser.currency}{" "}
                {inviteFundraiser.targetAmount.toLocaleString()}
              </p>

              <form onSubmit={submitInviteContribution} className="space-y-3 rounded-xl border border-border p-4">
                <h4 className="font-semibold">Participate by Contributing</h4>
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input value={contributorName} onChange={(event) => setContributorName(event.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Email (optional)</Label>
                  <Input type="email" value={contributorEmail} onChange={(event) => setContributorEmail(event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Amount ({inviteFundraiser.currency})</Label>
                  <Input type="number" min={1} value={contributionAmount} onChange={(event) => setContributionAmount(event.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Message (optional)</Label>
                  <Textarea rows={3} value={contributionMessage} onChange={(event) => setContributionMessage(event.target.value)} />
                </div>
                <Button type="submit" disabled={submittingContribution}>
                  {submittingContribution ? "Submitting..." : "Contribute"}
                </Button>
              </form>
            </div>
          ) : null}

          <div className="space-y-6">
            <h2 className="font-display text-3xl">Your Active Fundraisers</h2>
            {loading ? (
              <p className="text-muted-foreground">Loading fundraisers...</p>
            ) : fundraisers.length === 0 ? (
              <p className="text-muted-foreground">You have no active fundraisers yet.</p>
            ) : (
              fundraisers.map((fundraiser) => (
                <div key={fundraiser.id} className="bg-card border border-border rounded-xl p-6 shadow-card space-y-4">
                  <div>
                    <h3 className="font-display text-2xl">{fundraiser.title}</h3>
                    <p className="text-sm text-muted-foreground">By {fundraiser.owner.fullName}</p>
                  </div>
                  {fundraiser.inviteCode ? (
                    <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm space-y-1">
                      <p><strong>Invite Code:</strong> {fundraiser.inviteCode}</p>
                      <p className="break-all">
                        <strong>Invite Link:</strong> {window.location.origin}/fundraiser?fundraiserId={fundraiser.id}&inviteCode={fundraiser.inviteCode}
                      </p>
                    </div>
                  ) : null}
                  <p className="text-muted-foreground">{fundraiser.story}</p>
                  <p className="text-sm">
                    Raised <strong>{fundraiser.currency} {fundraiser.totalRaised.toLocaleString()}</strong> of {fundraiser.currency}{" "}
                    {fundraiser.targetAmount.toLocaleString()}
                  </p>
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
