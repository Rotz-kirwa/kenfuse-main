import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Copy, Share2 } from "lucide-react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/api";
import { authHeader, isLoggedIn } from "@/lib/session";
import { toast } from "@/components/ui/sonner";

type VisibilityType = "PUBLIC" | "PRIVATE" | "LINK_ONLY";
type ServiceMode = "PUBLISH_NOW" | "ADD_NOW";
type PreviewSection = "about" | "service" | "gallery" | "tributes" | "fundraiser";

interface MemorialMetadata {
  shortTagline?: string;
  dateOfBirth?: string;
  dateOfPassing?: string;
  location?: string;
  relationshipToCreator?: string;
  highlights?: string[];
  valuesLegacy?: string;
  serviceMode?: ServiceMode;
  serviceDetails?: Record<string, string>;
  media?: {
    photos?: string[];
    videoUrl?: string;
  };
  settings?: {
    allowGuestbook?: boolean;
    requireApproval?: boolean;
    allowFlowerTributes?: boolean;
    allowContributions?: boolean;
    fundraiserId?: string;
    donorListPublic?: boolean;
    donationPurpose?: string;
  };
}

interface MemorialItem {
  id: string;
  title: string;
  description: string | null;
  coverImage: string | null;
  visibilityType: VisibilityType;
  inviteCode: string | null;
  metadata: MemorialMetadata | null;
  owner: {
    fullName: string;
  };
  _count: {
    tributes: number;
  };
}

interface MemorialsResponse {
  memorials: MemorialItem[];
}

interface CreatedMemorialResponse {
  memorial: MemorialItem;
}

interface GalleryImage {
  name: string;
  dataUrl: string;
}

const CREATION_STEPS = [
  "Memorial Type",
  "Basic Profile",
  "Story & Tribute",
  "Service Details",
  "Gallery & Media",
  "Guestbook & Contributions",
  "Invite & Access",
  "Review & Publish",
] as const;

async function compressImageToDataUrl(file: File): Promise<string> {
  const imageUrl = URL.createObjectURL(file);
  try {
    const bitmap = await createImageBitmap(file);
    const maxWidth = 1400;
    const scale = Math.min(1, maxWidth / bitmap.width);
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");
    if (!context) {
      return imageUrl;
    }

    context.drawImage(bitmap, 0, 0, width, height);
    return canvas.toDataURL("image/jpeg", 0.78);
  } catch {
    return imageUrl;
  }
}

const Memorials = () => {
  const [memorials, setMemorials] = useState<MemorialItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [tributeLoadingId, setTributeLoadingId] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [previewSectionById, setPreviewSectionById] = useState<Record<string, PreviewSection>>({});

  const [visibilityType, setVisibilityType] = useState<VisibilityType>("PUBLIC");
  const [fullName, setFullName] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [dateOfPassing, setDateOfPassing] = useState("");
  const [location, setLocation] = useState("");
  const [relationshipToCreator, setRelationshipToCreator] = useState("");

  const [about, setAbout] = useState("");
  const [highlightsInput, setHighlightsInput] = useState("");
  const [valuesLegacy, setValuesLegacy] = useState("");
  const [shortTagline, setShortTagline] = useState("Forever in our hearts");

  const [serviceMode, setServiceMode] = useState<ServiceMode>("PUBLISH_NOW");
  const [wakeInfo, setWakeInfo] = useState("");
  const [funeralService, setFuneralService] = useState("");
  const [burialLocation, setBurialLocation] = useState("");
  const [mapLink, setMapLink] = useState("");
  const [dressCode, setDressCode] = useState("");
  const [contactPeople, setContactPeople] = useState("");

  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [videoUrl, setVideoUrl] = useState("");

  const [allowGuestbook, setAllowGuestbook] = useState(true);
  const [requireApproval, setRequireApproval] = useState(true);
  const [allowFlowerTributes, setAllowFlowerTributes] = useState(true);
  const [allowContributions, setAllowContributions] = useState(false);
  const [fundraiserId, setFundraiserId] = useState("");
  const [donorListPublic, setDonorListPublic] = useState(true);
  const [donationPurpose, setDonationPurpose] = useState("");

  const [inviteContacts, setInviteContacts] = useState("");
  const [manualInviteCode, setManualInviteCode] = useState(() => Math.random().toString(36).slice(2, 10));

  const loggedIn = isLoggedIn();

  const highlights = useMemo(
    () => highlightsInput.split(",").map((item) => item.trim()).filter(Boolean),
    [highlightsInput]
  );

  const localInviteLink = useMemo(() => {
    const code = manualInviteCode || "invite";
    return `${window.location.origin}/memorials?invite=${code}`;
  }, [manualInviteCode]);

  async function loadMemorials() {
    try {
      const response = await apiRequest<MemorialsResponse>("/api/memorials");
      setMemorials(response.memorials);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load memorials");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadMemorials();
  }, []);

  async function handleCoverImageUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const compressed = await compressImageToDataUrl(file);
    setCoverImage(compressed);
  }

  async function handleGalleryUpload(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;

    const compressedImages = await Promise.all(
      files.slice(0, 10).map(async (file) => ({
        name: file.name,
        dataUrl: await compressImageToDataUrl(file),
      }))
    );

    setGalleryImages((prev) => [...prev, ...compressedImages].slice(0, 20));
  }

  function generateAiTributeDraft() {
    const draft = [
      `${fullName || "Our beloved"} was cherished by many and remembered for a generous spirit.`,
      relationshipToCreator ? `As my ${relationshipToCreator.toLowerCase()}, they taught us to value family and faith.` : "Their life inspired family and friends every day.",
      highlights.length > 0 ? `They loved ${highlights.join(", ")}.` : "They brought warmth, laughter, and kindness into every room.",
      valuesLegacy ? `Their legacy remains in ${valuesLegacy}.` : "Their legacy continues through the values they shared with us.",
    ].join(" ");

    setAbout(draft);
    toast.success("Draft tribute generated. Edit it to make it personal.");
  }

  function goNextStep() {
    if (step === 1 && fullName.trim().length < 3) {
      toast.error("Please provide the full name of the departed");
      return;
    }

    if (step < CREATION_STEPS.length - 1) {
      setStep((current) => current + 1);
    }
  }

  function goPreviousStep() {
    if (step > 0) {
      setStep((current) => current - 1);
    }
  }

  async function publishMemorial(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!loggedIn) {
      toast.error("Please sign in to publish a memorial");
      return;
    }

    if (fullName.trim().length < 3) {
      toast.error("Name must be at least 3 characters");
      return;
    }

    setCreating(true);

    try {
      const response = await apiRequest<CreatedMemorialResponse>("/api/memorials", {
        method: "POST",
        headers: authHeader(),
        body: JSON.stringify({
          fullName: fullName.trim(),
          shortTagline: shortTagline.trim() || undefined,
          description: about.trim() || undefined,
          coverImage: coverImage || undefined,
          visibilityType,
          dateOfBirth: dateOfBirth ? new Date(`${dateOfBirth}T00:00:00`).toISOString() : undefined,
          dateOfPassing: dateOfPassing ? new Date(`${dateOfPassing}T00:00:00`).toISOString() : undefined,
          location: location.trim() || undefined,
          relationshipToCreator: relationshipToCreator.trim() || undefined,
          highlights,
          valuesLegacy: valuesLegacy.trim() || undefined,
          serviceMode,
          serviceDetails: {
            wakeInfo,
            funeralService,
            burialLocation,
            mapLink,
            dressCode,
            contactPeople,
          },
          media: {
            photos: galleryImages.map((item) => item.dataUrl),
            videoUrl: videoUrl.trim() || undefined,
          },
          settings: {
            allowGuestbook,
            requireApproval,
            allowFlowerTributes,
            allowContributions,
            fundraiserId: fundraiserId.trim() || undefined,
            donorListPublic,
            donationPurpose: donationPurpose.trim() || undefined,
          },
        }),
      });

      setMemorials((prev) => [response.memorial, ...prev]);
      setStep(0);
      toast.success("Memorial published successfully");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to publish memorial");
    } finally {
      setCreating(false);
    }
  }

  async function addTribute(event: FormEvent<HTMLFormElement>, memorialId: string) {
    event.preventDefault();

    const form = event.currentTarget;
    const data = new FormData(form);
    const authorName = String(data.get("authorName") ?? "").trim();
    const message = String(data.get("message") ?? "").trim();

    if (authorName.length < 2 || message.length < 3) {
      toast.error("Please provide a valid name and tribute message");
      return;
    }

    setTributeLoadingId(memorialId);

    try {
      await apiRequest(`/api/memorials/${memorialId}/tributes`, {
        method: "POST",
        body: JSON.stringify({ authorName, message }),
      });

      form.reset();
      toast.success("Tribute posted");
      setLoading(true);
      await loadMemorials();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to post tribute");
    } finally {
      setTributeLoadingId(null);
    }
  }

  function shareToWhatsApp(memorial: MemorialItem) {
    const text = encodeURIComponent(`Join us in honoring ${memorial.title} on Kenfuse`);
    window.open(`https://wa.me/?text=${text}`, "_blank");
  }

  async function copyInviteLink(link: string) {
    await navigator.clipboard.writeText(link);
    toast.success("Invite link copied");
  }

  return (
    <Layout>
      <section className="pt-32 pb-24">
        <div className="container mx-auto px-4 lg:px-8 max-w-6xl space-y-8">
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-sage-light flex items-center justify-center mx-auto mb-6">
              <BookOpen size={32} className="text-sage" />
            </div>
            <h1 className="font-display text-4xl sm:text-5xl font-bold text-foreground">Memorial Creation</h1>
            <p className="mt-4 text-muted-foreground text-lg">Publish early, edit anytime. Keep remembrance simple and dignified.</p>
          </div>

          <div className="bg-card border border-border rounded-xl p-6 lg:p-8 shadow-card">
            <div className="mb-5 flex flex-wrap gap-2">
              {CREATION_STEPS.map((label, index) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setStep(index)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    step === index
                      ? "bg-sage text-sage-foreground"
                      : index < step
                        ? "bg-muted text-foreground"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {index + 1}. {label}
                </button>
              ))}
            </div>

            <p className="text-sm text-muted-foreground mb-6">Step {step + 1} of {CREATION_STEPS.length}: {CREATION_STEPS[step]}</p>

            <form onSubmit={publishMemorial} className="space-y-5">
              {step === 0 ? (
                <div className="space-y-4">
                  <Label>Choose Memorial Type</Label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {([
                      { key: "PUBLIC", title: "Public Memorial", subtitle: "Searchable and shareable" },
                      { key: "PRIVATE", title: "Private Memorial", subtitle: "Only invited people" },
                      { key: "LINK_ONLY", title: "Link-only", subtitle: "Anyone with the link can view" },
                    ] as const).map((option) => (
                      <button
                        key={option.key}
                        type="button"
                        onClick={() => setVisibilityType(option.key)}
                        className={`border rounded-lg p-4 text-left ${visibilityType === option.key ? "border-sage bg-sage-light" : "border-border"}`}
                      >
                        <p className="font-semibold">{option.title}</p>
                        <p className="text-sm text-muted-foreground">{option.subtitle}</p>
                      </button>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground">You can change privacy anytime.</p>
                </div>
              ) : null}

              {step === 1 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 md:col-span-2">
                    <Label>Full name of the departed</Label>
                    <Input value={fullName} onChange={(event) => setFullName(event.target.value)} required />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Main portrait</Label>
                    <input type="file" accept="image/*" onChange={handleCoverImageUpload} />
                    {coverImage ? <img src={coverImage} alt="Portrait preview" className="w-44 h-44 object-cover rounded-lg border" /> : null}
                  </div>
                  <div className="space-y-2">
                    <Label>Date of birth (optional)</Label>
                    <Input type="date" value={dateOfBirth} onChange={(event) => setDateOfBirth(event.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Date of passing (optional)</Label>
                    <Input type="date" value={dateOfPassing} onChange={(event) => setDateOfPassing(event.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Location (optional)</Label>
                    <Input value={location} onChange={(event) => setLocation(event.target.value)} placeholder="County / City" />
                  </div>
                  <div className="space-y-2">
                    <Label>Relationship to creator</Label>
                    <Input value={relationshipToCreator} onChange={(event) => setRelationshipToCreator(event.target.value)} placeholder="Son, Daughter, Friend..." />
                  </div>
                </div>
              ) : null}

              {step === 2 ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Short bio / About</Label>
                    <Textarea value={about} onChange={(event) => setAbout(event.target.value)} rows={5} />
                  </div>
                  <div className="space-y-2">
                    <Label>Highlights (comma separated)</Label>
                    <Input value={highlightsInput} onChange={(event) => setHighlightsInput(event.target.value)} placeholder="Cooking, Church, Football" />
                  </div>
                  <div className="space-y-2">
                    <Label>Values / legacy</Label>
                    <Textarea value={valuesLegacy} onChange={(event) => setValuesLegacy(event.target.value)} rows={4} />
                  </div>
                  <Button type="button" variant="outline" onClick={generateAiTributeDraft}>Help me write a respectful tribute</Button>
                </div>
              ) : null}

              {step === 3 ? (
                <div className="space-y-4">
                  <Label>Service details mode</Label>
                  <div className="flex gap-3 flex-wrap">
                    <button type="button" onClick={() => setServiceMode("PUBLISH_NOW")} className={`px-4 py-2 rounded-md border ${serviceMode === "PUBLISH_NOW" ? "bg-sage-light border-sage" : "border-border"}`}>
                      Publish now, add details later
                    </button>
                    <button type="button" onClick={() => setServiceMode("ADD_NOW")} className={`px-4 py-2 rounded-md border ${serviceMode === "ADD_NOW" ? "bg-sage-light border-sage" : "border-border"}`}>
                      Add details now
                    </button>
                  </div>

                  {serviceMode === "ADD_NOW" ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2"><Label>Wake / viewing info</Label><Input value={wakeInfo} onChange={(event) => setWakeInfo(event.target.value)} /></div>
                      <div className="space-y-2"><Label>Funeral service info</Label><Input value={funeralService} onChange={(event) => setFuneralService(event.target.value)} /></div>
                      <div className="space-y-2"><Label>Burial location</Label><Input value={burialLocation} onChange={(event) => setBurialLocation(event.target.value)} /></div>
                      <div className="space-y-2"><Label>Map link</Label><Input value={mapLink} onChange={(event) => setMapLink(event.target.value)} /></div>
                      <div className="space-y-2"><Label>Dress code / theme</Label><Input value={dressCode} onChange={(event) => setDressCode(event.target.value)} /></div>
                      <div className="space-y-2"><Label>Contact person(s)</Label><Input value={contactPeople} onChange={(event) => setContactPeople(event.target.value)} /></div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">You can publish now and add service details later.</p>
                  )}
                </div>
              ) : null}

              {step === 4 ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Upload photos (auto compressed)</Label>
                    <input type="file" multiple accept="image/*" onChange={handleGalleryUpload} />
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
                      {galleryImages.map((image, index) => (
                        <img key={`${image.name}-${index}`} src={image.dataUrl} alt={image.name} className="w-full h-28 object-cover rounded-md border" />
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Video URL (optional)</Label>
                    <Input type="url" value={videoUrl} onChange={(event) => setVideoUrl(event.target.value)} placeholder="https://..." />
                  </div>
                </div>
              ) : null}

              {step === 5 ? (
                <div className="space-y-4">
                  <Label>Guestbook & contributions controls</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <label className="flex items-center gap-2"><input type="checkbox" checked={allowGuestbook} onChange={(event) => setAllowGuestbook(event.target.checked)} /> Allow guestbook messages</label>
                    <label className="flex items-center gap-2"><input type="checkbox" checked={requireApproval} onChange={(event) => setRequireApproval(event.target.checked)} /> Require approval before display</label>
                    <label className="flex items-center gap-2"><input type="checkbox" checked={allowFlowerTributes} onChange={(event) => setAllowFlowerTributes(event.target.checked)} /> Allow digital flower tributes</label>
                    <label className="flex items-center gap-2"><input type="checkbox" checked={allowContributions} onChange={(event) => setAllowContributions(event.target.checked)} /> Allow contributions / donations</label>
                  </div>

                  {allowContributions ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2"><Label>Fundraiser ID</Label><Input value={fundraiserId} onChange={(event) => setFundraiserId(event.target.value)} placeholder="Optional fundraiser id" /></div>
                      <div className="space-y-2"><Label>Donation purpose</Label><Input value={donationPurpose} onChange={(event) => setDonationPurpose(event.target.value)} placeholder="Burial costs, family support..." /></div>
                      <label className="flex items-center gap-2"><input type="checkbox" checked={donorListPublic} onChange={(event) => setDonorListPublic(event.target.checked)} /> Show donor list publicly</label>
                    </div>
                  ) : null}
                </div>
              ) : null}

              {step === 6 ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Invite by phone/email</Label>
                    <Textarea value={inviteContacts} onChange={(event) => setInviteContacts(event.target.value)} rows={3} placeholder="Paste phone numbers or emails" />
                  </div>
                  <div className="space-y-2">
                    <Label>Invite link</Label>
                    <div className="flex gap-2">
                      <Input value={localInviteLink} readOnly />
                      <Button type="button" variant="outline" onClick={() => void copyInviteLink(localInviteLink)}><Copy size={14} /> Copy</Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Invite QR code</Label>
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(localInviteLink)}`}
                      alt="Invite QR"
                      className="w-40 h-40 border rounded-md"
                    />
                  </div>
                </div>
              ) : null}

              {step === 7 ? (
                <div className="space-y-4">
                  <h3 className="font-display text-2xl">Review & Publish</h3>
                  <div className="bg-muted/40 border border-border rounded-lg p-4 space-y-2">
                    <p><strong>Name:</strong> {fullName || "-"}</p>
                    <p><strong>Privacy:</strong> {visibilityType}</p>
                    <p><strong>Tagline:</strong> {shortTagline || "-"}</p>
                    <p><strong>Service mode:</strong> {serviceMode}</p>
                    <p><strong>Gallery photos:</strong> {galleryImages.length}</p>
                    <p><strong>Guestbook:</strong> {allowGuestbook ? "Enabled" : "Disabled"}</p>
                    <p><strong>Contributions:</strong> {allowContributions ? "Enabled" : "Disabled"}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">Publish now and continue editing after publication.</p>
                </div>
              ) : null}

              <div className="flex items-center justify-between pt-2">
                <Button type="button" variant="outline" onClick={goPreviousStep} disabled={step === 0}>Back</Button>
                {step < CREATION_STEPS.length - 1 ? (
                  <Button type="button" onClick={goNextStep}>Continue</Button>
                ) : (
                  <Button type="submit" disabled={creating}>{creating ? "Publishing..." : "Publish Memorial"}</Button>
                )}
              </div>
            </form>
          </div>

          <div className="space-y-6">
            <h2 className="font-display text-3xl">Published Memorials</h2>
            {loading ? (
              <p className="text-muted-foreground">Loading memorials...</p>
            ) : memorials.length === 0 ? (
              <p className="text-muted-foreground">No memorials yet.</p>
            ) : (
              memorials.map((memorial) => {
                const metadata = memorial.metadata ?? {};
                const settings = metadata.settings ?? {};
                const serviceDetails = metadata.serviceDetails ?? {};
                const mediaPhotos = metadata.media?.photos ?? [];
                const activeSection = previewSectionById[memorial.id] ?? "about";
                const inviteLink = memorial.inviteCode ? `${window.location.origin}/memorials?invite=${memorial.inviteCode}` : "";

                return (
                  <article key={memorial.id} className="bg-card border border-border rounded-xl overflow-hidden shadow-card">
                    <div className="p-6 border-b border-border space-y-4">
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div className="flex items-center gap-4">
                          {memorial.coverImage ? (
                            <img src={memorial.coverImage} alt={memorial.title} className="w-20 h-20 object-cover rounded-full border" />
                          ) : (
                            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center"><BookOpen size={28} /></div>
                          )}
                          <div>
                            <h3 className="font-display text-3xl">{memorial.title}</h3>
                            <p className="text-muted-foreground text-sm">{metadata.shortTagline ?? "Forever in our hearts"}</p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button type="button" variant="outline" onClick={() => void copyInviteLink(inviteLink || `${window.location.origin}/memorials/${memorial.id}`)}><Share2 size={14} /> Share</Button>
                          <Button type="button" variant="outline" onClick={() => shareToWhatsApp(memorial)}>WhatsApp</Button>
                          <Button type="button" variant="outline">Leave Tribute</Button>
                          {settings.allowContributions ? <Button type="button" variant="outline">Contribute</Button> : null}
                          <Button type="button" variant="outline">Add Photo</Button>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 text-sm">
                        {(["about", "service", "gallery", "tributes", "fundraiser"] as PreviewSection[]).map((section) => (
                          <button
                            key={section}
                            type="button"
                            onClick={() => setPreviewSectionById((prev) => ({ ...prev, [memorial.id]: section }))}
                            className={`px-3 py-1.5 rounded-full border ${activeSection === section ? "bg-sage-light border-sage" : "border-border"}`}
                          >
                            {section === "about" ? "About" : section === "service" ? "Service Details" : section === "gallery" ? "Gallery" : section === "tributes" ? "Tributes" : "Fundraiser"}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="p-6 space-y-4">
                      {activeSection === "about" ? (
                        <div className="space-y-3">
                          <p className="text-muted-foreground">{memorial.description || "No biography provided yet."}</p>
                          {metadata.highlights && metadata.highlights.length > 0 ? <p><strong>Highlights:</strong> {metadata.highlights.join(", ")}</p> : null}
                          {metadata.valuesLegacy ? <p><strong>Legacy:</strong> {metadata.valuesLegacy}</p> : null}
                          <p className="text-sm text-muted-foreground">Created by {memorial.owner.fullName} • {memorial._count.tributes} tributes</p>
                        </div>
                      ) : null}

                      {activeSection === "service" ? (
                        <div className="space-y-2 text-sm">
                          <p><strong>Wake:</strong> {serviceDetails.wakeInfo || "To be shared"}</p>
                          <p><strong>Service:</strong> {serviceDetails.funeralService || "To be shared"}</p>
                          <p><strong>Burial:</strong> {serviceDetails.burialLocation || "To be shared"}</p>
                          <p><strong>Map link:</strong> {serviceDetails.mapLink || "To be shared"}</p>
                          <p><strong>Dress code:</strong> {serviceDetails.dressCode || "Not set"}</p>
                          <p><strong>Contact:</strong> {serviceDetails.contactPeople || "Not set"}</p>
                        </div>
                      ) : null}

                      {activeSection === "gallery" ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {mediaPhotos.length > 0 ? mediaPhotos.map((photo, index) => (
                            <img key={`${memorial.id}-photo-${index}`} src={photo} alt={`Gallery ${index + 1}`} className="w-full h-28 object-cover rounded-md border" />
                          )) : <p className="text-sm text-muted-foreground col-span-full">No photos uploaded yet.</p>}
                        </div>
                      ) : null}

                      {activeSection === "tributes" ? (
                        settings.allowGuestbook === false ? (
                          <p className="text-sm text-muted-foreground">Guestbook is disabled for this memorial.</p>
                        ) : (
                          <form onSubmit={(event) => addTribute(event, memorial.id)} className="space-y-3">
                            <div className="space-y-2">
                              <Label>Your Name</Label>
                              <Input name="authorName" required />
                            </div>
                            <div className="space-y-2">
                              <Label>Message</Label>
                              <Textarea name="message" rows={3} required />
                            </div>
                            <Button type="submit" disabled={tributeLoadingId === memorial.id}>
                              {tributeLoadingId === memorial.id ? "Posting..." : "Post Tribute"}
                            </Button>
                          </form>
                        )
                      ) : null}

                      {activeSection === "fundraiser" ? (
                        settings.allowContributions ? (
                          <div className="space-y-2 text-sm">
                            <p><strong>Purpose:</strong> {settings.donationPurpose || "Family support"}</p>
                            <p><strong>Donor list:</strong> {settings.donorListPublic ? "Public" : "Private"}</p>
                            <Button asChild><Link to="/fundraiser">Open Fundraiser</Link></Button>
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">Contributions are not enabled for this memorial.</p>
                        )
                      ) : null}
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Memorials;
