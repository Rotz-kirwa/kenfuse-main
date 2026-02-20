import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Lock } from "lucide-react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/api";
import { authHeader, isLoggedIn } from "@/lib/session";
import { toast } from "@/components/ui/sonner";

interface LegacyPlanPayload {
  wishes?: string;
  instructions?: string;
  assets?: Array<Record<string, unknown>>;
  beneficiaries?: Array<Record<string, unknown>>;
}

interface LegacyPlanResponse {
  legacyPlan: {
    wishes: string | null;
    instructions: string | null;
    assets: unknown;
    beneficiaries: unknown;
  } | null;
}

const LegacyPlan = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [wishes, setWishes] = useState("");
  const [instructions, setInstructions] = useState("");
  const [assetsText, setAssetsText] = useState("[]");
  const [beneficiariesText, setBeneficiariesText] = useState("[]");

  const loggedIn = isLoggedIn();

  useEffect(() => {
    if (!loggedIn) {
      setLoading(false);
      return;
    }

    async function loadLegacyPlan() {
      try {
        const response = await apiRequest<LegacyPlanResponse>("/api/legacy-plan/me", {
          headers: authHeader(),
        });

        if (response.legacyPlan) {
          setWishes(response.legacyPlan.wishes ?? "");
          setInstructions(response.legacyPlan.instructions ?? "");
          setAssetsText(JSON.stringify(response.legacyPlan.assets ?? [], null, 2));
          setBeneficiariesText(JSON.stringify(response.legacyPlan.beneficiaries ?? [], null, 2));
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to load legacy plan");
      } finally {
        setLoading(false);
      }
    }

    void loadLegacyPlan();
  }, [loggedIn]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    let assets: Array<Record<string, unknown>>;
    let beneficiaries: Array<Record<string, unknown>>;

    try {
      assets = JSON.parse(assetsText) as Array<Record<string, unknown>>;
      beneficiaries = JSON.parse(beneficiariesText) as Array<Record<string, unknown>>;

      if (!Array.isArray(assets) || !Array.isArray(beneficiaries)) {
        throw new Error("Assets and beneficiaries must be JSON arrays");
      }
    } catch {
      toast.error("Assets and beneficiaries must be valid JSON arrays");
      return;
    }

    setSaving(true);

    const payload: LegacyPlanPayload = {
      wishes: wishes.trim(),
      instructions: instructions.trim(),
      assets,
      beneficiaries,
    };

    try {
      await apiRequest("/api/legacy-plan/me", {
        method: "PUT",
        headers: authHeader(),
        body: JSON.stringify(payload),
      });

      toast.success("Legacy plan saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save legacy plan");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Layout>
      <section className="pt-32 pb-24">
        <div className="container mx-auto px-4 lg:px-8 max-w-4xl">
          <div className="text-center mb-10">
            <div className="w-16 h-16 rounded-2xl bg-sage-light flex items-center justify-center mx-auto mb-6">
              <Lock size={32} className="text-sage" />
            </div>
            <h1 className="font-display text-4xl sm:text-5xl font-bold text-foreground">Your Legacy Plan</h1>
            <p className="mt-4 text-muted-foreground text-lg">Create and maintain your secure digital will.</p>
          </div>

          {!loggedIn ? (
            <div className="bg-card border border-border rounded-xl p-8 text-center shadow-card">
              <p className="text-muted-foreground mb-6">You need an account to manage your legacy plan.</p>
              <Button size="lg" asChild>
                <Link to="/auth?mode=signup">
                  Sign In to Start <ArrowRight size={18} />
                </Link>
              </Button>
            </div>
          ) : loading ? (
            <div className="text-center text-muted-foreground">Loading your plan...</div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6 bg-card border border-border rounded-xl p-6 lg:p-8 shadow-card">
              <div className="space-y-2">
                <Label htmlFor="wishes">Personal Wishes</Label>
                <Textarea
                  id="wishes"
                  value={wishes}
                  onChange={(event) => setWishes(event.target.value)}
                  placeholder="Describe your wishes and preferences"
                  rows={5}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="instructions">Important Instructions</Label>
                <Textarea
                  id="instructions"
                  value={instructions}
                  onChange={(event) => setInstructions(event.target.value)}
                  placeholder="Add important instructions for your family"
                  rows={5}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="assets">Assets (JSON array)</Label>
                <Textarea
                  id="assets"
                  value={assetsText}
                  onChange={(event) => setAssetsText(event.target.value)}
                  rows={6}
                />
                <p className="text-xs text-muted-foreground">Example: [{'{'}"name":"Land Parcel", "value":5000000{'}'}]</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="beneficiaries">Beneficiaries (JSON array)</Label>
                <Textarea
                  id="beneficiaries"
                  value={beneficiariesText}
                  onChange={(event) => setBeneficiariesText(event.target.value)}
                  rows={6}
                />
                <p className="text-xs text-muted-foreground">Example: [{'{'}"name":"Jane Doe", "share":"50%"{'}'}]</p>
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={saving}>
                  {saving ? "Saving..." : "Save Legacy Plan"}
                </Button>
              </div>
            </form>
          )}

          <p className="mt-8 text-xs text-muted-foreground text-center">
            Kenfuse is not a law firm. Consider legal review for formal wills.
          </p>
        </div>
      </section>
    </Layout>
  );
};

export default LegacyPlan;
