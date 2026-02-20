import { FormEvent, useEffect, useMemo, useState } from "react";
import { FilePlus2, HeartHandshake, Landmark, ScrollText } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/api";
import { authHeader, getSessionUser } from "@/lib/session";
import { toast } from "@/components/ui/sonner";

type DashboardTab = "will" | "legacy" | "memorial" | "fundraiser";
type VisibilityType = "PUBLIC" | "PRIVATE" | "LINK_ONLY";
type WillStep = 1 | 2 | 3 | 4 | 5 | 6;
type LegacyStep = 1 | 2 | 3 | 4 | 5 | 6 | 7;
type MemorialStep = 1 | 2 | 3 | 4 | 5 | 6 | 7;
type FundraiserStep = 1 | 2 | 3 | 4 | 5 | 6;
type PermissionLevel = "VIEW_ONLY" | "MANAGE_FUNDRAISER" | "FULL_ACCESS";

type LegacyRole =
  | "EXECUTOR"
  | "TRUSTED_FAMILY"
  | "LAWYER"
  | "FINANCIAL_ADVISOR"
  | "OTHER";

interface LegacyPlanResponse {
  legacyPlan: {
    wishes: string | null;
    instructions: string | null;
    assets: unknown;
    beneficiaries: unknown;
  } | null;
}

interface FundraiserOption {
  id: string;
  title: string;
  visibilityType?: "PUBLIC" | "LINK_ONLY" | "PRIVATE";
  inviteCode?: string | null;
  owner: {
    id: string;
  };
}

interface FundraisersResponse {
  fundraisers: FundraiserOption[];
}

interface MemorialOption {
  id: string;
  title: string;
}

interface MemorialsResponse {
  memorials: MemorialOption[];
}

interface FundraiserImageItem {
  id: string;
  dataUrl: string;
}

interface WillPersonalInfo {
  fullName: string;
  idNumber: string;
  dateOfBirth: string;
  phone: string;
  email: string;
  currentAddress: string;
  maritalStatus: string;
  hasChildren: "YES" | "NO";
}

interface ExecutorInfo {
  fullName: string;
  relationship: string;
  phone: string;
  email: string;
  alternateExecutor: string;
}

interface Beneficiary {
  id: string;
  fullName: string;
  relationship: string;
  nationalId: string;
  contact: string;
  percentage: number;
}

interface AssetItem {
  id: string;
  category: string;
  assetName: string;
  description: string;
  location: string;
  estimatedValue: string;
  beneficiaryId: string;
  documentName: string;
}

interface SpecialWishes {
  burialPreference: string;
  burialLocation: string;
  religiousInstructions: string;
  guardianshipOfMinors: string;
  charityDonations: string;
  personalMessage: string;
  scheduleLetterRelease: boolean;
}

interface WillPayload {
  profilePhoto?: string;
  personalInfo: WillPersonalInfo;
  executor: ExecutorInfo;
  beneficiaries: Beneficiary[];
  assets: AssetItem[];
  specialWishes: SpecialWishes;
  confirmations: {
    reflectsWishes: boolean;
    legalValidationAcknowledged: boolean;
  };
  lockedAt?: string;
}

interface LegacyTrustedMember {
  id: string;
  fullName: string;
  relationship: string;
  contactInfo: string;
  role: LegacyRole;
  secureAccessCode: string;
  permissionLevel: PermissionLevel;
}

interface LegacyRealEstateAsset {
  id: string;
  propertyName: string;
  location: string;
  titleDeedFile: string;
  assignedBeneficiary: string;
}

interface LegacyFinancialAsset {
  id: string;
  accountType: string;
  institution: string;
  reference: string;
  insurancePolicyFile: string;
  assignedBeneficiary: string;
}

interface LegacyDigitalAsset {
  id: string;
  assetName: string;
  platform: string;
  accessInstructions: string;
  assignedBeneficiary: string;
}

interface LegacyBeneficiary {
  id: string;
  fullName: string;
  relationship: string;
  percentage: number;
  specificAssetAssignment: string;
}

interface LegacyLetter {
  id: string;
  recipientType: "SPOUSE" | "CHILDREN" | "FRIENDS" | "OTHER";
  recipientName: string;
  message: string;
}

interface LegacyPayload {
  step1PersonalIdentity: {
    profilePhoto?: string;
    fullName: string;
    idNumber: string;
    dateOfBirth: string;
    contactDetails: string;
    maritalStatus: string;
    childrenList: string;
    idCopyFileName: string;
  };
  step2TrustedCircle: LegacyTrustedMember[];
  step3AssetsWealthOverview: {
    realEstate: LegacyRealEstateAsset[];
    financial: LegacyFinancialAsset[];
    digital: LegacyDigitalAsset[];
    passwordPolicyNote: string;
  };
  step4BeneficiaryDistribution: {
    beneficiaries: LegacyBeneficiary[];
    charityDonations: string;
    totalAllocation: number;
  };
  step5FuneralMemorialWishes: {
    burialOrCremation: string;
    preferredLocation: string;
    religiousInstructions: string;
    serviceType: string;
    musicPreferences: string;
    dressCode: string;
    speakers: string;
    culturalTraditions: string;
    marketplaceLinks: string;
    preselectedServices: string;
  };
  step6MessagesLegacyLetters: {
    letters: LegacyLetter[];
    videoMessageUrl: string;
    releaseTrigger: "MANUAL_BY_EXECUTOR" | "VERIFIED_CONFIRMATION_EVENT";
  };
  step7FundFinancialSupportPlan: {
    funeralBudget: string;
    insurancePolicyLinks: string;
    fundraiserTemplate: string;
    fundraiserManager: string;
    allowContributionToggle: boolean;
  };
}

interface MemorialGalleryItem {
  id: string;
  dataUrl: string;
  caption: string;
  album: string;
}

interface MemorialInvitee {
  id: string;
  contact: string;
  role: "VIEWER" | "MODERATOR" | "FUNDRAISER_MANAGER";
}

const tabs = [
  { key: "will", label: "Will Creation", icon: ScrollText },
  { key: "legacy", label: "Legacy Creation", icon: HeartHandshake },
  { key: "memorial", label: "Memorial Creation", icon: Landmark },
  { key: "fundraiser", label: "Fundraiser", icon: FilePlus2 },
] as const;

const willSteps: Array<{ step: WillStep; label: string }> = [
  { step: 1, label: "Personal Information" },
  { step: 2, label: "Executor Appointment" },
  { step: 3, label: "Beneficiaries" },
  { step: 4, label: "Assets" },
  { step: 5, label: "Special Wishes" },
  { step: 6, label: "Review & Confirm" },
];

const legacySteps: Array<{ step: LegacyStep; label: string }> = [
  { step: 1, label: "Personal Identity" },
  { step: 2, label: "Trusted Circle" },
  { step: 3, label: "Assets & Wealth" },
  { step: 4, label: "Beneficiary Distribution" },
  { step: 5, label: "Funeral & Memorial Wishes" },
  { step: 6, label: "Messages & Legacy Letters" },
  { step: 7, label: "Fund & Support Plan" },
];

const memorialSteps: Array<{ step: MemorialStep; label: string }> = [
  { step: 1, label: "Basic Info" },
  { step: 2, label: "Story" },
  { step: 3, label: "Service Details" },
  { step: 4, label: "Media" },
  { step: 5, label: "Tributes & Contributions" },
  { step: 6, label: "Invite Family" },
  { step: 7, label: "Review" },
];

const fundraiserSteps: Array<{ step: FundraiserStep; label: string }> = [
  { step: 1, label: "Basic Info" },
  { step: 2, label: "Story" },
  { step: 3, label: "Goal & Payout" },
  { step: 4, label: "Media" },
  { step: 5, label: "Contribution Settings" },
  { step: 6, label: "Review" },
];

const willAssetCategories = [
  "Land / Property",
  "Vehicles",
  "Bank Accounts",
  "Businesses",
  "Shares / Investments",
  "Digital Assets",
  "Other valuables",
] as const;

function createId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function createSecureCode() {
  return `KF-${Math.random().toString(36).slice(2, 6).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

async function compressImageToDataUrl(file: File): Promise<string> {
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
      return URL.createObjectURL(file);
    }

    context.drawImage(bitmap, 0, 0, width, height);
    return canvas.toDataURL("image/jpeg", 0.8);
  } catch {
    return URL.createObjectURL(file);
  }
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function openPrintableDocument(title: string, body: string) {
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;

  const html = `
    <html>
      <head>
        <title>${escapeHtml(title)}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; color: #111827; }
          h1,h2,h3 { margin: 0 0 8px; }
          p { margin: 0 0 6px; }
          .box { border: 1px solid #e5e7eb; border-radius: 10px; padding: 12px; margin-bottom: 12px; }
          .muted { color: #6b7280; font-size: 12px; }
          img { max-width: 180px; border-radius: 10px; border: 1px solid #e5e7eb; }
          table { width: 100%; border-collapse: collapse; margin-top: 8px; }
          th, td { border: 1px solid #e5e7eb; padding: 8px; text-align: left; vertical-align: top; }
        </style>
      </head>
      <body>${body}</body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}

function emptyBeneficiary(): Beneficiary {
  return {
    id: createId("ben"),
    fullName: "",
    relationship: "",
    nationalId: "",
    contact: "",
    percentage: 0,
  };
}

function emptyAsset(): AssetItem {
  return {
    id: createId("asset"),
    category: "Land / Property",
    assetName: "",
    description: "",
    location: "",
    estimatedValue: "",
    beneficiaryId: "",
    documentName: "",
  };
}

function emptyTrustedMember(): LegacyTrustedMember {
  return {
    id: createId("trust"),
    fullName: "",
    relationship: "",
    contactInfo: "",
    role: "TRUSTED_FAMILY",
    secureAccessCode: createSecureCode(),
    permissionLevel: "VIEW_ONLY",
  };
}

function emptyLegacyRealEstate(): LegacyRealEstateAsset {
  return {
    id: createId("re"),
    propertyName: "",
    location: "",
    titleDeedFile: "",
    assignedBeneficiary: "",
  };
}

function emptyLegacyFinancial(): LegacyFinancialAsset {
  return {
    id: createId("fin"),
    accountType: "",
    institution: "",
    reference: "",
    insurancePolicyFile: "",
    assignedBeneficiary: "",
  };
}

function emptyLegacyDigital(): LegacyDigitalAsset {
  return {
    id: createId("dig"),
    assetName: "",
    platform: "",
    accessInstructions: "",
    assignedBeneficiary: "",
  };
}

function emptyLegacyBeneficiary(): LegacyBeneficiary {
  return {
    id: createId("lben"),
    fullName: "",
    relationship: "",
    percentage: 0,
    specificAssetAssignment: "",
  };
}

function emptyLegacyLetter(): LegacyLetter {
  return {
    id: createId("letter"),
    recipientType: "OTHER",
    recipientName: "",
    message: "",
  };
}

const Dashboard = () => {
  const [searchParams] = useSearchParams();
  const user = getSessionUser();

  const [activeTab, setActiveTab] = useState<DashboardTab>("will");
  const [loading, setLoading] = useState(true);

  const [willStep, setWillStep] = useState<WillStep>(1);
  const [savingWill, setSavingWill] = useState(false);
  const [finalizedAt, setFinalizedAt] = useState<string>("");
  const [willProfilePhoto, setWillProfilePhoto] = useState("");

  const [legacyStep, setLegacyStep] = useState<LegacyStep>(1);
  const [savingLegacy, setSavingLegacy] = useState(false);
  const [legacyProfilePhoto, setLegacyProfilePhoto] = useState("");

  const [personalInfo, setPersonalInfo] = useState<WillPersonalInfo>({
    fullName: user?.fullName ?? "",
    idNumber: "",
    dateOfBirth: "",
    phone: "",
    email: user?.email ?? "",
    currentAddress: "",
    maritalStatus: "",
    hasChildren: "NO",
  });

  const [executor, setExecutor] = useState<ExecutorInfo>({
    fullName: "",
    relationship: "",
    phone: "",
    email: "",
    alternateExecutor: "",
  });

  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([emptyBeneficiary()]);
  const [assets, setAssets] = useState<AssetItem[]>([emptyAsset()]);

  const [specialWishes, setSpecialWishes] = useState<SpecialWishes>({
    burialPreference: "",
    burialLocation: "",
    religiousInstructions: "",
    guardianshipOfMinors: "",
    charityDonations: "",
    personalMessage: "",
    scheduleLetterRelease: false,
  });

  const [reflectsWishes, setReflectsWishes] = useState(false);
  const [legalValidationAcknowledged, setLegalValidationAcknowledged] = useState(false);

  const [legacyIdentity, setLegacyIdentity] = useState({
    fullName: user?.fullName ?? "",
    idNumber: "",
    dateOfBirth: "",
    contactDetails: user?.email ?? "",
    maritalStatus: "",
    childrenList: "",
    idCopyFileName: "",
  });

  const [legacyTrustedCircle, setLegacyTrustedCircle] = useState<LegacyTrustedMember[]>([
    {
      ...emptyTrustedMember(),
      role: "EXECUTOR",
      permissionLevel: "FULL_ACCESS",
    },
  ]);

  const [legacyRealEstate, setLegacyRealEstate] = useState<LegacyRealEstateAsset[]>([emptyLegacyRealEstate()]);
  const [legacyFinancial, setLegacyFinancial] = useState<LegacyFinancialAsset[]>([emptyLegacyFinancial()]);
  const [legacyDigital, setLegacyDigital] = useState<LegacyDigitalAsset[]>([emptyLegacyDigital()]);

  const [legacyBeneficiaries, setLegacyBeneficiaries] = useState<LegacyBeneficiary[]>([emptyLegacyBeneficiary()]);
  const [legacyCharityDonations, setLegacyCharityDonations] = useState("");

  const [legacyFuneralWishes, setLegacyFuneralWishes] = useState({
    burialOrCremation: "",
    preferredLocation: "",
    religiousInstructions: "",
    serviceType: "",
    musicPreferences: "",
    dressCode: "",
    speakers: "",
    culturalTraditions: "",
    marketplaceLinks: "",
    preselectedServices: "",
  });

  const [legacyLetters, setLegacyLetters] = useState<LegacyLetter[]>([emptyLegacyLetter()]);
  const [legacyVideoMessageUrl, setLegacyVideoMessageUrl] = useState("");
  const [legacyReleaseTrigger, setLegacyReleaseTrigger] = useState<"MANUAL_BY_EXECUTOR" | "VERIFIED_CONFIRMATION_EVENT">("MANUAL_BY_EXECUTOR");

  const [legacyFundPlan, setLegacyFundPlan] = useState({
    funeralBudget: "",
    insurancePolicyLinks: "",
    fundraiserTemplate: "",
    fundraiserManager: "",
    allowContributionToggle: true,
  });

  const [memorialStep, setMemorialStep] = useState<MemorialStep>(1);
  const [memorialName, setMemorialName] = useState("");
  const [memorialTagline, setMemorialTagline] = useState("Forever in our hearts");
  const [memorialDateOfBirth, setMemorialDateOfBirth] = useState("");
  const [memorialDateOfPassing, setMemorialDateOfPassing] = useState("");
  const [memorialLocation, setMemorialLocation] = useState("");
  const [memorialStory, setMemorialStory] = useState("");
  const [memorialBio, setMemorialBio] = useState("");
  const [memorialAchievements, setMemorialAchievements] = useState("");
  const [memorialTraits, setMemorialTraits] = useState("");
  const [memorialMemories, setMemorialMemories] = useState("");
  const [memorialVisibility, setMemorialVisibility] = useState<VisibilityType>("PRIVATE");
  const [memorialCoverImage, setMemorialCoverImage] = useState("");
  const [memorialProfilePhoto, setMemorialProfilePhoto] = useState("");
  const [memorialServiceDetails, setMemorialServiceDetails] = useState({
    viewingWake: "",
    funeralService: "",
    burialLocation: "",
    mapLink: "",
    contactPerson: "",
    showServiceDetailsPublicly: true,
    hideUntilConfirmed: false,
  });
  const [memorialGallery, setMemorialGallery] = useState<MemorialGalleryItem[]>([]);
  const [memorialVideoUrl, setMemorialVideoUrl] = useState("");
  const [memorialGuestbookEnabled, setMemorialGuestbookEnabled] = useState(true);
  const [memorialRequireApproval, setMemorialRequireApproval] = useState(true);
  const [memorialAllowFlowers, setMemorialAllowFlowers] = useState(true);
  const [memorialAllowContributions, setMemorialAllowContributions] = useState(false);
  const [memorialDonorListPublic, setMemorialDonorListPublic] = useState(true);
  const [memorialSelectedFundraiserId, setMemorialSelectedFundraiserId] = useState("");
  const [memorialQuickFundraiserTitle, setMemorialQuickFundraiserTitle] = useState("");
  const [memorialQuickFundraiserTarget, setMemorialQuickFundraiserTarget] = useState("");
  const [memorialCreatingQuickFundraiser, setMemorialCreatingQuickFundraiser] = useState(false);
  const [memorialInvitees, setMemorialInvitees] = useState<MemorialInvitee[]>([
    { id: createId("invite"), contact: "", role: "VIEWER" },
  ]);
  const [creatingMemorial, setCreatingMemorial] = useState(false);

  const [fundraiserTitle, setFundraiserTitle] = useState("");
  const [fundraiserStep, setFundraiserStep] = useState<FundraiserStep>(1);
  const [fundraiserCategory, setFundraiserCategory] = useState("Funeral Expenses");
  const [fundraiserLinkedMemorialId, setFundraiserLinkedMemorialId] = useState("");
  const [fundraiserOrganizerName, setFundraiserOrganizerName] = useState(user?.fullName ?? "");
  const [fundraiserContactPhone, setFundraiserContactPhone] = useState("");
  const [fundraiserContactEmail, setFundraiserContactEmail] = useState(user?.email ?? "");
  const [fundraiserPrivacy, setFundraiserPrivacy] = useState<"PUBLIC" | "LINK_ONLY" | "PRIVATE">("PUBLIC");

  const [fundraiserStory, setFundraiserStory] = useState("");
  const [fundraiserFundsCover, setFundraiserFundsCover] = useState("");
  const [fundraiserEndDate, setFundraiserEndDate] = useState("");

  const [fundraiserTarget, setFundraiserTarget] = useState("");
  const [fundraiserCurrency, setFundraiserCurrency] = useState<"KES" | "USD">("KES");
  const [fundraiserMinimumContribution, setFundraiserMinimumContribution] = useState("");
  const [fundraiserSuggestedAmounts, setFundraiserSuggestedAmounts] = useState<string[]>(["500", "1000", "5000"]);
  const [fundraiserBankName, setFundraiserBankName] = useState("");
  const [fundraiserAccountName, setFundraiserAccountName] = useState("");
  const [fundraiserAccountNumber, setFundraiserAccountNumber] = useState("");
  const [fundraiserMpesaNumber, setFundraiserMpesaNumber] = useState("");
  const [fundraiserBeneficiaryName, setFundraiserBeneficiaryName] = useState("");
  const [fundraiserPermissionConfirmed, setFundraiserPermissionConfirmed] = useState(false);

  const [fundraiserCoverImage, setFundraiserCoverImage] = useState("");
  const [fundraiserProfilePhoto, setFundraiserProfilePhoto] = useState("");
  const [fundraiserAdditionalImages, setFundraiserAdditionalImages] = useState<FundraiserImageItem[]>([]);

  const [fundraiserAllowAnonymous, setFundraiserAllowAnonymous] = useState(true);
  const [fundraiserShowDonorsPublicly, setFundraiserShowDonorsPublicly] = useState(true);
  const [fundraiserAllowComments, setFundraiserAllowComments] = useState(true);
  const [fundraiserRequireAdminApproval, setFundraiserRequireAdminApproval] = useState(false);
  const [fundraiserUrgentBadge, setFundraiserUrgentBadge] = useState(false);
  const [fundraiserAutoCloseWhenGoalReached, setFundraiserAutoCloseWhenGoalReached] = useState(true);

  const [fundraiserMemorialOptions, setFundraiserMemorialOptions] = useState<MemorialOption[]>([]);
  const [creatingFundraiser, setCreatingFundraiser] = useState(false);
  const [myFundraisers, setMyFundraisers] = useState<FundraiserOption[]>([]);
  const [latestFundraiserInvite, setLatestFundraiserInvite] = useState<{
    code: string;
    link: string;
  } | null>(null);

  const totalAllocation = useMemo(
    () => beneficiaries.reduce((sum, item) => sum + (Number(item.percentage) || 0), 0),
    [beneficiaries]
  );

  const allocationIsValid = totalAllocation === 100;

  const legacyTotalAllocation = useMemo(
    () => legacyBeneficiaries.reduce((sum, item) => sum + (Number(item.percentage) || 0), 0),
    [legacyBeneficiaries]
  );

  const legacyAllocationIsValid = legacyTotalAllocation === 100;

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "will" || tab === "legacy" || tab === "memorial" || tab === "fundraiser") {
      setActiveTab(tab);
    }
  }, [searchParams]);

  function buildLegacyPayload(): LegacyPayload {
    return {
      step1PersonalIdentity: { ...legacyIdentity, profilePhoto: legacyProfilePhoto || undefined },
      step2TrustedCircle: legacyTrustedCircle,
      step3AssetsWealthOverview: {
        realEstate: legacyRealEstate,
        financial: legacyFinancial,
        digital: legacyDigital,
        passwordPolicyNote:
          "Do not store raw passwords. Store instructions on how to access digital assets.",
      },
      step4BeneficiaryDistribution: {
        beneficiaries: legacyBeneficiaries,
        charityDonations: legacyCharityDonations,
        totalAllocation: legacyTotalAllocation,
      },
      step5FuneralMemorialWishes: { ...legacyFuneralWishes },
      step6MessagesLegacyLetters: {
        letters: legacyLetters,
        videoMessageUrl: legacyVideoMessageUrl,
        releaseTrigger: legacyReleaseTrigger,
      },
      step7FundFinancialSupportPlan: { ...legacyFundPlan },
    };
  }

  useEffect(() => {
    async function loadLegacyPlan() {
      try {
        const response = await apiRequest<LegacyPlanResponse>("/api/legacy-plan/me", {
          headers: authHeader(),
        });

        if (response.legacyPlan?.wishes) {
          try {
            const parsed = JSON.parse(response.legacyPlan.wishes) as Partial<WillPayload>;
            if (parsed.personalInfo) setPersonalInfo((prev) => ({ ...prev, ...parsed.personalInfo }));
            if (parsed.profilePhoto) setWillProfilePhoto(parsed.profilePhoto);
            if (parsed.executor) setExecutor((prev) => ({ ...prev, ...parsed.executor }));
            if (parsed.beneficiaries?.length) setBeneficiaries(parsed.beneficiaries as Beneficiary[]);
            if (parsed.assets?.length) setAssets(parsed.assets as AssetItem[]);
            if (parsed.specialWishes) setSpecialWishes((prev) => ({ ...prev, ...parsed.specialWishes }));
            if (parsed.confirmations) {
              setReflectsWishes(Boolean(parsed.confirmations.reflectsWishes));
              setLegalValidationAcknowledged(Boolean(parsed.confirmations.legalValidationAcknowledged));
            }
            if (parsed.lockedAt) setFinalizedAt(parsed.lockedAt);
          } catch {
            // no-op
          }
        }

        if (response.legacyPlan?.instructions) {
          try {
            const parsedLegacy = JSON.parse(response.legacyPlan.instructions) as Partial<LegacyPayload>;
            if (parsedLegacy.step1PersonalIdentity) {
              setLegacyIdentity((prev) => ({ ...prev, ...parsedLegacy.step1PersonalIdentity }));
              if (parsedLegacy.step1PersonalIdentity.profilePhoto) {
                setLegacyProfilePhoto(parsedLegacy.step1PersonalIdentity.profilePhoto);
              }
            }
            if (parsedLegacy.step2TrustedCircle?.length) {
              setLegacyTrustedCircle(parsedLegacy.step2TrustedCircle as LegacyTrustedMember[]);
            }
            if (parsedLegacy.step3AssetsWealthOverview?.realEstate?.length) {
              setLegacyRealEstate(parsedLegacy.step3AssetsWealthOverview.realEstate as LegacyRealEstateAsset[]);
            }
            if (parsedLegacy.step3AssetsWealthOverview?.financial?.length) {
              setLegacyFinancial(parsedLegacy.step3AssetsWealthOverview.financial as LegacyFinancialAsset[]);
            }
            if (parsedLegacy.step3AssetsWealthOverview?.digital?.length) {
              setLegacyDigital(parsedLegacy.step3AssetsWealthOverview.digital as LegacyDigitalAsset[]);
            }
            if (parsedLegacy.step4BeneficiaryDistribution?.beneficiaries?.length) {
              setLegacyBeneficiaries(parsedLegacy.step4BeneficiaryDistribution.beneficiaries as LegacyBeneficiary[]);
            }
            if (parsedLegacy.step4BeneficiaryDistribution?.charityDonations) {
              setLegacyCharityDonations(parsedLegacy.step4BeneficiaryDistribution.charityDonations);
            }
            if (parsedLegacy.step5FuneralMemorialWishes) {
              setLegacyFuneralWishes((prev) => ({ ...prev, ...parsedLegacy.step5FuneralMemorialWishes }));
            }
            if (parsedLegacy.step6MessagesLegacyLetters?.letters?.length) {
              setLegacyLetters(parsedLegacy.step6MessagesLegacyLetters.letters as LegacyLetter[]);
            }
            if (parsedLegacy.step6MessagesLegacyLetters?.videoMessageUrl) {
              setLegacyVideoMessageUrl(parsedLegacy.step6MessagesLegacyLetters.videoMessageUrl);
            }
            if (parsedLegacy.step6MessagesLegacyLetters?.releaseTrigger) {
              setLegacyReleaseTrigger(parsedLegacy.step6MessagesLegacyLetters.releaseTrigger);
            }
            if (parsedLegacy.step7FundFinancialSupportPlan) {
              setLegacyFundPlan((prev) => ({ ...prev, ...parsedLegacy.step7FundFinancialSupportPlan }));
            }
          } catch {
            // no-op
          }
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to load dashboard records");
      } finally {
        setLoading(false);
      }
    }

    void loadLegacyPlan();
  }, []);

  useEffect(() => {
    async function loadMyFundraisers() {
      try {
        const response = await apiRequest<FundraisersResponse>("/api/fundraisers?status=ACTIVE", {
          headers: authHeader(),
        });
        const mine = response.fundraisers.filter((item) => item.owner.id === user?.id);
        setMyFundraisers(mine);
      } catch {
        // Non-blocking for dashboard flow.
      }
    }

    void loadMyFundraisers();
  }, [user?.id]);

  useEffect(() => {
    async function loadMemorialOptions() {
      try {
        const response = await apiRequest<MemorialsResponse>("/api/memorials");
        setFundraiserMemorialOptions(response.memorials);
      } catch {
        // non-blocking
      }
    }

    void loadMemorialOptions();
  }, []);

  useEffect(() => {
    const raw = localStorage.getItem("kenfuse_fundraiser_draft");
    if (!raw) return;

    try {
      const draft = JSON.parse(raw) as Partial<{
        fundraiserTitle: string;
        fundraiserCategory: string;
        fundraiserLinkedMemorialId: string;
        fundraiserOrganizerName: string;
        fundraiserContactPhone: string;
        fundraiserContactEmail: string;
        fundraiserPrivacy: "PUBLIC" | "LINK_ONLY" | "PRIVATE";
        fundraiserStory: string;
        fundraiserFundsCover: string;
        fundraiserEndDate: string;
        fundraiserTarget: string;
        fundraiserCurrency: "KES" | "USD";
        fundraiserMinimumContribution: string;
        fundraiserSuggestedAmounts: string[];
        fundraiserBankName: string;
        fundraiserAccountName: string;
        fundraiserAccountNumber: string;
        fundraiserMpesaNumber: string;
        fundraiserBeneficiaryName: string;
        fundraiserPermissionConfirmed: boolean;
        fundraiserCoverImage: string;
        fundraiserProfilePhoto: string;
        fundraiserAdditionalImages: FundraiserImageItem[];
        fundraiserAllowAnonymous: boolean;
        fundraiserShowDonorsPublicly: boolean;
        fundraiserAllowComments: boolean;
        fundraiserRequireAdminApproval: boolean;
        fundraiserUrgentBadge: boolean;
        fundraiserAutoCloseWhenGoalReached: boolean;
      }>;

      if (draft.fundraiserTitle) setFundraiserTitle(draft.fundraiserTitle);
      if (draft.fundraiserCategory) setFundraiserCategory(draft.fundraiserCategory);
      if (draft.fundraiserLinkedMemorialId) setFundraiserLinkedMemorialId(draft.fundraiserLinkedMemorialId);
      if (draft.fundraiserOrganizerName) setFundraiserOrganizerName(draft.fundraiserOrganizerName);
      if (draft.fundraiserContactPhone) setFundraiserContactPhone(draft.fundraiserContactPhone);
      if (draft.fundraiserContactEmail) setFundraiserContactEmail(draft.fundraiserContactEmail);
      if (draft.fundraiserPrivacy) setFundraiserPrivacy(draft.fundraiserPrivacy);
      if (draft.fundraiserStory) setFundraiserStory(draft.fundraiserStory);
      if (draft.fundraiserFundsCover) setFundraiserFundsCover(draft.fundraiserFundsCover);
      if (draft.fundraiserEndDate) setFundraiserEndDate(draft.fundraiserEndDate);
      if (draft.fundraiserTarget) setFundraiserTarget(draft.fundraiserTarget);
      if (draft.fundraiserCurrency) setFundraiserCurrency(draft.fundraiserCurrency);
      if (draft.fundraiserMinimumContribution) setFundraiserMinimumContribution(draft.fundraiserMinimumContribution);
      if (draft.fundraiserSuggestedAmounts?.length) setFundraiserSuggestedAmounts(draft.fundraiserSuggestedAmounts);
      if (draft.fundraiserBankName) setFundraiserBankName(draft.fundraiserBankName);
      if (draft.fundraiserAccountName) setFundraiserAccountName(draft.fundraiserAccountName);
      if (draft.fundraiserAccountNumber) setFundraiserAccountNumber(draft.fundraiserAccountNumber);
      if (draft.fundraiserMpesaNumber) setFundraiserMpesaNumber(draft.fundraiserMpesaNumber);
      if (draft.fundraiserBeneficiaryName) setFundraiserBeneficiaryName(draft.fundraiserBeneficiaryName);
      if (typeof draft.fundraiserPermissionConfirmed === "boolean") setFundraiserPermissionConfirmed(draft.fundraiserPermissionConfirmed);
      if (draft.fundraiserCoverImage) setFundraiserCoverImage(draft.fundraiserCoverImage);
      if (draft.fundraiserProfilePhoto) setFundraiserProfilePhoto(draft.fundraiserProfilePhoto);
      if (draft.fundraiserAdditionalImages?.length) setFundraiserAdditionalImages(draft.fundraiserAdditionalImages);
      if (typeof draft.fundraiserAllowAnonymous === "boolean") setFundraiserAllowAnonymous(draft.fundraiserAllowAnonymous);
      if (typeof draft.fundraiserShowDonorsPublicly === "boolean") setFundraiserShowDonorsPublicly(draft.fundraiserShowDonorsPublicly);
      if (typeof draft.fundraiserAllowComments === "boolean") setFundraiserAllowComments(draft.fundraiserAllowComments);
      if (typeof draft.fundraiserRequireAdminApproval === "boolean") setFundraiserRequireAdminApproval(draft.fundraiserRequireAdminApproval);
      if (typeof draft.fundraiserUrgentBadge === "boolean") setFundraiserUrgentBadge(draft.fundraiserUrgentBadge);
      if (typeof draft.fundraiserAutoCloseWhenGoalReached === "boolean") setFundraiserAutoCloseWhenGoalReached(draft.fundraiserAutoCloseWhenGoalReached);
    } catch {
      // ignore broken drafts
    }
  }, []);

  function updateBeneficiary(id: string, key: keyof Beneficiary, value: string) {
    setBeneficiaries((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              [key]: key === "percentage" ? Number(value) || 0 : value,
            }
          : item
      )
    );
  }

  function updateAsset(id: string, key: keyof AssetItem, value: string) {
    setAssets((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              [key]: value,
            }
          : item
      )
    );
  }

  function updateTrustedMember(id: string, key: keyof LegacyTrustedMember, value: string) {
    setLegacyTrustedCircle((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              [key]: value,
            }
          : item
      )
    );
  }

  function updateLegacyBeneficiary(id: string, key: keyof LegacyBeneficiary, value: string) {
    setLegacyBeneficiaries((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              [key]: key === "percentage" ? Number(value) || 0 : value,
            }
          : item
      )
    );
  }

  function updateLegacyRealEstate(id: string, key: keyof LegacyRealEstateAsset, value: string) {
    setLegacyRealEstate((prev) => prev.map((item) => (item.id === id ? { ...item, [key]: value } : item)));
  }

  function updateLegacyFinancial(id: string, key: keyof LegacyFinancialAsset, value: string) {
    setLegacyFinancial((prev) => prev.map((item) => (item.id === id ? { ...item, [key]: value } : item)));
  }

  function updateLegacyDigital(id: string, key: keyof LegacyDigitalAsset, value: string) {
    setLegacyDigital((prev) => prev.map((item) => (item.id === id ? { ...item, [key]: value } : item)));
  }

  function goNextWillStep() {
    if (willStep === 1) {
      if (!personalInfo.fullName.trim() || !personalInfo.idNumber.trim() || !personalInfo.phone.trim() || !personalInfo.email.trim()) {
        toast.error("Fill all required personal information fields");
        return;
      }
    }

    if (willStep === 2) {
      if (!executor.fullName.trim() || !executor.relationship.trim() || !executor.phone.trim() || !executor.email.trim()) {
        toast.error("Please complete executor details");
        return;
      }
    }

    if (willStep === 3 && !allocationIsValid) {
      toast.error("Total beneficiary allocation must equal 100% before continuing");
      return;
    }

    if (willStep < 6) setWillStep((prev) => (prev + 1) as WillStep);
  }

  function goBackWillStep() {
    if (willStep > 1) setWillStep((prev) => (prev - 1) as WillStep);
  }

  function goNextLegacyStep() {
    if (legacyStep === 1 && !legacyIdentity.fullName.trim()) {
      toast.error("Please provide full name in Personal Identity");
      return;
    }

    if (legacyStep === 4 && !legacyAllocationIsValid) {
      toast.error("Beneficiary distribution total must equal 100%.");
      return;
    }

    if (legacyStep < 7) setLegacyStep((prev) => (prev + 1) as LegacyStep);
  }

  function goBackLegacyStep() {
    if (legacyStep > 1) setLegacyStep((prev) => (prev - 1) as LegacyStep);
  }

  async function saveWill(generateDocument = false) {
    if (!allocationIsValid) {
      toast.error("Beneficiary allocation must total 100%");
      return;
    }

    if (!reflectsWishes || !legalValidationAcknowledged) {
      toast.error("Please confirm both declarations before generating the will");
      return;
    }

    const timestamp = new Date().toISOString();

    const payload: WillPayload = {
      profilePhoto: willProfilePhoto || undefined,
      personalInfo,
      executor,
      beneficiaries,
      assets,
      specialWishes,
      confirmations: {
        reflectsWishes,
        legalValidationAcknowledged,
      },
      lockedAt: timestamp,
    };

    setSavingWill(true);

    try {
      await apiRequest("/api/legacy-plan/me", {
        method: "PUT",
        headers: authHeader(),
        body: JSON.stringify({
          wishes: JSON.stringify(payload),
          instructions: JSON.stringify(buildLegacyPayload()),
          beneficiaries,
          assets,
        }),
      });

      setFinalizedAt(timestamp);
      toast.success("Will saved and timestamped");

      if (generateDocument) {
        downloadWillPdf();
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save will");
    } finally {
      setSavingWill(false);
    }
  }

  async function saveLegacy(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!legacyAllocationIsValid) {
      toast.error("Beneficiary distribution must total 100%.");
      return;
    }

    setSavingLegacy(true);

    try {
      const payload = buildLegacyPayload();

      await apiRequest("/api/legacy-plan/me", {
        method: "PUT",
        headers: authHeader(),
        body: JSON.stringify({
          wishes: JSON.stringify({
            personalInfo,
            executor,
            beneficiaries,
            assets,
            specialWishes,
            confirmations: {
              reflectsWishes,
              legalValidationAcknowledged,
            },
            lockedAt: finalizedAt || undefined,
          }),
          instructions: JSON.stringify(payload),
          beneficiaries: legacyBeneficiaries,
          assets: [
            ...legacyRealEstate,
            ...legacyFinancial,
            ...legacyDigital,
          ],
        }),
      });

      toast.success("Legacy plan saved successfully");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save legacy plan");
    } finally {
      setSavingLegacy(false);
    }
  }

  async function uploadProfilePhoto(
    file: File,
    setPhoto: (value: string) => void,
    label: string
  ) {
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      toast.error(`${label} photo must be JPG, PNG, or WEBP.`);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error(`${label} photo size limit is 5MB.`);
      return;
    }
    const compressed = await compressImageToDataUrl(file);
    setPhoto(compressed);
  }

  function downloadWillPdf() {
    const createdAt = finalizedAt || new Date().toISOString();
    const profileHtml = willProfilePhoto
      ? `<p><strong>Profile Photo</strong></p><img src="${willProfilePhoto}" alt="Will profile photo" />`
      : `<p class="muted">No profile photo added.</p>`;
    const body = `
      <h1>Kenfuse Will Summary</h1>
      <p class="muted">Generated: ${new Date().toLocaleString()}</p>
      <div class="box">${profileHtml}</div>
      <h2>Personal Information</h2>
      <div class="box">${Object.entries(personalInfo).map(([k, v]) => `<p><strong>${escapeHtml(k)}:</strong> ${escapeHtml(String(v ?? ""))}</p>`).join("")}</div>
      <h2>Executor</h2>
      <div class="box">${Object.entries(executor).map(([k, v]) => `<p><strong>${escapeHtml(k)}:</strong> ${escapeHtml(String(v ?? ""))}</p>`).join("")}</div>
      <h2>Beneficiaries</h2>
      <table><thead><tr><th>Name</th><th>Relationship</th><th>Contact</th><th>Share</th></tr></thead><tbody>
      ${beneficiaries.map((b) => `<tr><td>${escapeHtml(b.fullName)}</td><td>${escapeHtml(b.relationship)}</td><td>${escapeHtml(b.contact)}</td><td>${b.percentage}%</td></tr>`).join("")}
      </tbody></table>
      <p class="muted">Final timestamp: ${createdAt}</p>
    `;

    openPrintableDocument("Kenfuse Will Summary", body);
  }

  function downloadLegacyPdf() {
    const payload = buildLegacyPayload();
    const trusted = payload.step2TrustedCircle.length;
    const body = `
      <h1>Kenfuse Legacy Plan Summary</h1>
      <p class="muted">Generated: ${new Date().toLocaleString()}</p>
      <div class="box">
        ${
          legacyProfilePhoto
            ? `<p><strong>Profile Photo</strong></p><img src="${legacyProfilePhoto}" alt="Legacy profile photo" />`
            : `<p class="muted">No profile photo added.</p>`
        }
      </div>
      <div class="box">
        <p><strong>Full Name:</strong> ${escapeHtml(payload.step1PersonalIdentity.fullName || "-")}</p>
        <p><strong>ID / Passport:</strong> ${escapeHtml(payload.step1PersonalIdentity.idNumber || "-")}</p>
        <p><strong>Trusted Circle Members:</strong> ${trusted}</p>
        <p><strong>Real Estate Assets:</strong> ${payload.step3AssetsWealthOverview.realEstate.length}</p>
        <p><strong>Financial Assets:</strong> ${payload.step3AssetsWealthOverview.financial.length}</p>
        <p><strong>Digital Assets:</strong> ${payload.step3AssetsWealthOverview.digital.length}</p>
        <p><strong>Beneficiary Allocation:</strong> ${legacyTotalAllocation}%</p>
      </div>
    `;

    openPrintableDocument("Kenfuse Legacy Plan Summary", body);
  }

  function downloadMemorialPdf() {
    const body = `
      <h1>Kenfuse Memorial Summary</h1>
      <p class="muted">Generated: ${new Date().toLocaleString()}</p>
      <div class="box">
        ${
          memorialProfilePhoto
            ? `<p><strong>Profile Photo</strong></p><img src="${memorialProfilePhoto}" alt="Memorial profile photo" />`
            : `<p class="muted">No profile photo added.</p>`
        }
      </div>
      <div class="box">
        <p><strong>Name:</strong> ${escapeHtml(memorialName || "-")}</p>
        <p><strong>Tagline:</strong> ${escapeHtml(memorialTagline || "-")}</p>
        <p><strong>Date of Passing:</strong> ${escapeHtml(memorialDateOfPassing || "-")}</p>
        <p><strong>Visibility:</strong> ${escapeHtml(memorialVisibility)}</p>
        <p><strong>Gallery Items:</strong> ${memorialGallery.length}</p>
      </div>
    `;
    openPrintableDocument("Kenfuse Memorial Summary", body);
  }

  function downloadFundraiserPdf() {
    const body = `
      <h1>Kenfuse Fundraiser Summary</h1>
      <p class="muted">Generated: ${new Date().toLocaleString()}</p>
      <div class="box">
        ${
          fundraiserProfilePhoto
            ? `<p><strong>Profile Photo</strong></p><img src="${fundraiserProfilePhoto}" alt="Fundraiser profile photo" />`
            : `<p class="muted">No profile photo added.</p>`
        }
      </div>
      <div class="box">
        <p><strong>Title:</strong> ${escapeHtml(fundraiserTitle || "-")}</p>
        <p><strong>Category:</strong> ${escapeHtml(fundraiserCategory || "-")}</p>
        <p><strong>Organizer:</strong> ${escapeHtml(fundraiserOrganizerName || "-")}</p>
        <p><strong>Goal:</strong> ${escapeHtml(fundraiserCurrency)} ${escapeHtml((Number(fundraiserTarget || 0) || 0).toLocaleString())}</p>
        <p><strong>Contact:</strong> ${escapeHtml(`${fundraiserContactPhone || "-"} | ${fundraiserContactEmail || "-"}`)}</p>
        <p><strong>Privacy:</strong> ${escapeHtml(fundraiserPrivacy)}</p>
      </div>
    `;
    openPrintableDocument("Kenfuse Fundraiser Summary", body);
  }

  const memorialInviteLink = useMemo(() => {
    return `${window.location.origin}/memorials?invite=${encodeURIComponent(memorialName || "memorial")}`;
  }, [memorialName]);

  const memorialQrCodeUrl = useMemo(() => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(memorialInviteLink)}`;
  }, [memorialInviteLink]);

  function goNextMemorialStep() {
    if (memorialStep === 1) {
      if (!memorialName.trim() || !memorialCoverImage || !memorialDateOfPassing) {
        toast.error("Please fill all required Basic Information fields.");
        return;
      }
    }

    if (memorialStep < 7) {
      setMemorialStep((prev) => (prev + 1) as MemorialStep);
    }
  }

  function goBackMemorialStep() {
    if (memorialStep > 1) {
      setMemorialStep((prev) => (prev - 1) as MemorialStep);
    }
  }

  async function uploadMemorialCover(file: File) {
    const compressed = await compressImageToDataUrl(file);
    setMemorialCoverImage(compressed);
  }

  async function addMemorialGallery(files: FileList) {
    const uploaded = await Promise.all(
      Array.from(files).slice(0, 12).map(async (file) => ({
        id: createId("gallery"),
        dataUrl: await compressImageToDataUrl(file),
        caption: "",
        album: "General",
      }))
    );

    setMemorialGallery((prev) => [...prev, ...uploaded].slice(0, 30));
  }

  function updateMemorialGalleryItem(id: string, key: "caption" | "album", value: string) {
    setMemorialGallery((prev) => prev.map((item) => (item.id === id ? { ...item, [key]: value } : item)));
  }

  function removeMemorialGalleryItem(id: string) {
    setMemorialGallery((prev) => prev.filter((item) => item.id !== id));
  }

  function generateTributeDraft() {
    const draft = [
      memorialBio || `${memorialName || "Our loved one"} lived a meaningful life and touched many hearts.`,
      memorialAchievements ? `Achievements: ${memorialAchievements}.` : "",
      memorialTraits ? `Known for: ${memorialTraits}.` : "",
      memorialMemories ? `Favorite memories: ${memorialMemories}.` : "",
    ]
      .filter(Boolean)
      .join(" ");

    setMemorialStory(draft);
    toast.success("Tribute draft generated. Edit it to personalize.");
  }

  function updateInvitee(id: string, key: keyof MemorialInvitee, value: string) {
    setMemorialInvitees((prev) => prev.map((item) => (item.id === id ? { ...item, [key]: value } : item)));
  }

  async function createQuickFundraiser() {
    const target = Number(memorialQuickFundraiserTarget);
    if (!memorialQuickFundraiserTitle.trim() || !Number.isInteger(target) || target <= 0) {
      toast.error("Provide fundraiser title and a valid target amount.");
      return;
    }

    setMemorialCreatingQuickFundraiser(true);
    try {
      await apiRequest("/api/fundraisers", {
        method: "POST",
        headers: authHeader(),
        body: JSON.stringify({
          title: memorialQuickFundraiserTitle.trim(),
          story: `Support for memorial of ${memorialName || "our loved one"}.`,
          targetAmount: target,
          currency: "KES",
        }),
      });

      const response = await apiRequest<FundraisersResponse>("/api/fundraisers?status=ACTIVE", {
        headers: authHeader(),
      });
      const mine = response.fundraisers.filter((item) => item.owner.id === user?.id);
      setMyFundraisers(mine);

      if (mine.length > 0) {
        setMemorialSelectedFundraiserId(mine[0].id);
      }

      setMemorialQuickFundraiserTitle("");
      setMemorialQuickFundraiserTarget("");
      toast.success("Quick fundraiser created");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create quick fundraiser");
    } finally {
      setMemorialCreatingQuickFundraiser(false);
    }
  }

  async function createMemorial(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!memorialName.trim() || !memorialCoverImage || !memorialDateOfPassing) {
      toast.error("Complete required memorial fields before publishing.");
      return;
    }

    setCreatingMemorial(true);

    try {
      await apiRequest("/api/memorials", {
        method: "POST",
        headers: authHeader(),
        body: JSON.stringify({
          fullName: memorialName.trim(),
          shortTagline: memorialTagline.trim() || undefined,
          description: memorialStory.trim() || memorialBio.trim() || undefined,
          coverImage: memorialCoverImage || undefined,
          visibilityType: memorialVisibility,
          dateOfBirth: memorialDateOfBirth ? new Date(`${memorialDateOfBirth}T00:00:00.000Z`).toISOString() : undefined,
          dateOfPassing: new Date(`${memorialDateOfPassing}T00:00:00.000Z`).toISOString(),
          location: memorialLocation.trim() || undefined,
          highlights: [memorialAchievements.trim(), memorialTraits.trim(), memorialMemories.trim()].filter(Boolean),
          valuesLegacy: memorialBio.trim() || undefined,
          serviceDetails: {
            viewingWake: memorialServiceDetails.viewingWake,
            funeralService: memorialServiceDetails.funeralService,
            burialLocation: memorialServiceDetails.burialLocation,
            mapLink: memorialServiceDetails.mapLink,
            contactPerson: memorialServiceDetails.contactPerson,
            showServiceDetailsPublicly: memorialServiceDetails.showServiceDetailsPublicly,
            hideUntilConfirmed: memorialServiceDetails.hideUntilConfirmed,
          },
          media: {
            photos: memorialGallery.map((item) => ({
              url: item.dataUrl,
              caption: item.caption,
              album: item.album,
            })),
            tributeVideoUrl: memorialVideoUrl.trim() || undefined,
          },
          settings: {
            guestbookEnabled: memorialGuestbookEnabled,
            requireApproval: memorialRequireApproval,
            allowFlowerTributes: memorialAllowFlowers,
            enableContributions: memorialAllowContributions,
            fundraiserId: memorialAllowContributions ? memorialSelectedFundraiserId || undefined : undefined,
            donorListPublic: memorialDonorListPublic,
            invitees: memorialInvitees.filter((item) => item.contact.trim()),
            inviteLink: memorialInviteLink,
          },
        }),
      });

      toast.success("Memorial created");
      setMemorialName("");
      setMemorialCoverImage("");
      setMemorialProfilePhoto("");
      setMemorialDateOfBirth("");
      setMemorialDateOfPassing("");
      setMemorialLocation("");
      setMemorialStory("");
      setMemorialBio("");
      setMemorialAchievements("");
      setMemorialTraits("");
      setMemorialMemories("");
      setMemorialServiceDetails({
        viewingWake: "",
        funeralService: "",
        burialLocation: "",
        mapLink: "",
        contactPerson: "",
        showServiceDetailsPublicly: true,
        hideUntilConfirmed: false,
      });
      setMemorialGallery([]);
      setMemorialVideoUrl("");
      setMemorialGuestbookEnabled(true);
      setMemorialRequireApproval(true);
      setMemorialAllowFlowers(true);
      setMemorialAllowContributions(false);
      setMemorialDonorListPublic(true);
      setMemorialSelectedFundraiserId("");
      setMemorialInvitees([{ id: createId("invite"), contact: "", role: "VIEWER" }]);
      setMemorialTagline("Forever in our hearts");
      setMemorialStep(1);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create memorial");
    } finally {
      setCreatingMemorial(false);
    }
  }

  async function createFundraiser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!fundraiserTitle.trim() || !fundraiserContactPhone.trim() || !fundraiserContactEmail.trim()) {
      toast.error("Please complete required basic fundraiser details.");
      return;
    }

    const target = Number(fundraiserTarget);
    if (!Number.isInteger(target) || target <= 0) {
      toast.error("Target amount must be a positive number");
      return;
    }

    if (!fundraiserPermissionConfirmed) {
      toast.error("Please confirm permission to raise funds for this cause.");
      return;
    }

    if (!fundraiserCoverImage) {
      toast.error("Cover image is required before publishing.");
      return;
    }

    setCreatingFundraiser(true);

    try {
      const composedStory = [
        fundraiserStory.trim(),
        fundraiserFundsCover.trim() ? `\nFunds will cover:\n${fundraiserFundsCover.trim()}` : "",
        fundraiserEndDate ? `\nTimeline end date: ${fundraiserEndDate}` : "",
        `\nOrganizer: ${fundraiserOrganizerName || "N/A"}`,
        `\nContact: ${fundraiserContactPhone} | ${fundraiserContactEmail}`,
        `\nCategory: ${fundraiserCategory}`,
        `\nPrivacy: ${fundraiserPrivacy}`,
        fundraiserLinkedMemorialId ? `\nLinked memorial ID: ${fundraiserLinkedMemorialId}` : "",
        `\nPayout recipient: ${fundraiserBeneficiaryName || "N/A"}`,
        fundraiserBankName ? `\nBank: ${fundraiserBankName} (${fundraiserAccountName} / ${fundraiserAccountNumber})` : "",
        fundraiserMpesaNumber ? `\nMPESA: ${fundraiserMpesaNumber}` : "",
        `\nContribution settings: anonymous=${fundraiserAllowAnonymous}, publicDonors=${fundraiserShowDonorsPublicly}, comments=${fundraiserAllowComments}, adminApproval=${fundraiserRequireAdminApproval}, urgent=${fundraiserUrgentBadge}, autoClose=${fundraiserAutoCloseWhenGoalReached}`,
      ]
        .filter(Boolean)
        .join("\n");

      const response = await apiRequest<{ fundraiser: { id: string; inviteCode?: string | null } }>("/api/fundraisers", {
        method: "POST",
        headers: authHeader(),
        body: JSON.stringify({
          title: fundraiserTitle.trim(),
          story: composedStory,
          targetAmount: target,
          currency: fundraiserCurrency,
          visibilityType: fundraiserPrivacy,
        }),
      });

      const inviteCode = response.fundraiser.inviteCode ?? "";
      if (inviteCode) {
        const link = `${window.location.origin}/fundraiser?fundraiserId=${encodeURIComponent(response.fundraiser.id)}&inviteCode=${encodeURIComponent(inviteCode)}`;
        setLatestFundraiserInvite({ code: inviteCode, link });
      } else {
        setLatestFundraiserInvite(null);
      }

      toast.success("Fundraiser created");
      localStorage.removeItem("kenfuse_fundraiser_draft");
      setFundraiserTitle("");
      setFundraiserStory("");
      setFundraiserFundsCover("");
      setFundraiserEndDate("");
      setFundraiserTarget("");
      setFundraiserCurrency("KES");
      setFundraiserMinimumContribution("");
      setFundraiserSuggestedAmounts(["500", "1000", "5000"]);
      setFundraiserBankName("");
      setFundraiserAccountName("");
      setFundraiserAccountNumber("");
      setFundraiserMpesaNumber("");
      setFundraiserBeneficiaryName("");
      setFundraiserPermissionConfirmed(false);
      setFundraiserCoverImage("");
      setFundraiserProfilePhoto("");
      setFundraiserAdditionalImages([]);
      setFundraiserAllowAnonymous(true);
      setFundraiserShowDonorsPublicly(true);
      setFundraiserAllowComments(true);
      setFundraiserRequireAdminApproval(false);
      setFundraiserUrgentBadge(false);
      setFundraiserAutoCloseWhenGoalReached(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create fundraiser");
    } finally {
      setCreatingFundraiser(false);
    }
  }

  function goNextFundraiserStep() {
    if (fundraiserStep === 1) {
      if (!fundraiserTitle.trim() || !fundraiserContactPhone.trim() || !fundraiserContactEmail.trim()) {
        toast.error("Please fill required Basic Information fields.");
        return;
      }
    }

    if (fundraiserStep === 3) {
      const target = Number(fundraiserTarget);
      if (!Number.isInteger(target) || target <= 0 || !fundraiserPermissionConfirmed) {
        toast.error("Complete Goal & Payout details and confirm permission.");
        return;
      }
    }

    if (fundraiserStep === 4 && !fundraiserCoverImage) {
      toast.error("Cover image is required.");
      return;
    }

    if (fundraiserStep < 6) {
      setFundraiserStep((prev) => (prev + 1) as FundraiserStep);
    }
  }

  function goBackFundraiserStep() {
    if (fundraiserStep > 1) {
      setFundraiserStep((prev) => (prev - 1) as FundraiserStep);
    }
  }

  function applyFundraiserStoryAssist() {
    const draft = [
      `We are raising support for ${fundraiserTitle || "this cause"}.`,
      fundraiserFundsCover
        ? `Funds will help cover: ${fundraiserFundsCover}.`
        : "Funds will be used transparently for the stated needs.",
      "Any contribution, big or small, will make a meaningful impact.",
    ].join(" ");
    setFundraiserStory(draft);
    toast.success("Story draft generated. Edit to personalize.");
  }

  async function uploadFundraiserCover(file: File) {
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      toast.error("Cover image must be JPG, PNG, or WEBP.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size limit is 5MB.");
      return;
    }
    const compressed = await compressImageToDataUrl(file);
    setFundraiserCoverImage(compressed);
  }

  async function uploadFundraiserAdditional(files: FileList) {
    const valid = Array.from(files).filter((file) => ["image/jpeg", "image/png", "image/webp"].includes(file.type) && file.size <= 5 * 1024 * 1024);
    if (valid.length === 0) {
      toast.error("Upload JPG/PNG/WEBP images up to 5MB.");
      return;
    }

    const prepared = await Promise.all(
      valid.slice(0, 6).map(async (file) => ({
        id: createId("fimg"),
        dataUrl: await compressImageToDataUrl(file),
      }))
    );
    setFundraiserAdditionalImages((prev) => [...prev, ...prepared].slice(0, 8));
  }

  function saveFundraiserDraft() {
    const draft = {
      fundraiserTitle,
      fundraiserCategory,
      fundraiserLinkedMemorialId,
      fundraiserOrganizerName,
      fundraiserContactPhone,
      fundraiserContactEmail,
      fundraiserPrivacy,
      fundraiserStory,
      fundraiserFundsCover,
      fundraiserEndDate,
      fundraiserTarget,
      fundraiserCurrency,
      fundraiserMinimumContribution,
      fundraiserSuggestedAmounts,
      fundraiserBankName,
      fundraiserAccountName,
      fundraiserAccountNumber,
      fundraiserMpesaNumber,
      fundraiserBeneficiaryName,
      fundraiserPermissionConfirmed,
      fundraiserCoverImage,
      fundraiserProfilePhoto,
      fundraiserAdditionalImages,
      fundraiserAllowAnonymous,
      fundraiserShowDonorsPublicly,
      fundraiserAllowComments,
      fundraiserRequireAdminApproval,
      fundraiserUrgentBadge,
      fundraiserAutoCloseWhenGoalReached,
    };

    localStorage.setItem("kenfuse_fundraiser_draft", JSON.stringify(draft));
    toast.success("Fundraiser draft saved");
  }

  return (
    <Layout>
      <section className="pt-28 pb-20">
        <div className="container mx-auto px-4 lg:px-8 max-w-6xl">
          <div className="rounded-3xl border border-border/60 bg-[linear-gradient(130deg,#fff1f2_0%,#f5f3ff_35%,#ecfeff_70%,#fef9c3_100%)] p-6 sm:p-8 shadow-card">
            <h1 className="font-display text-4xl sm:text-5xl font-bold text-foreground">
              {user?.fullName ? `${user.fullName}'s Dashboard` : "Private Dashboard"}
            </h1>
            <p className="mt-3 text-muted-foreground">
              One secure workspace for will creation, legacy creation, memorial creation, and fundraiser setup.
            </p>

            <div className="mt-6 rounded-2xl border border-border bg-white/70 p-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key)}
                    className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                      activeTab === tab.key
                        ? "bg-sage text-sage-foreground"
                        : "bg-white text-foreground hover:bg-muted"
                    }`}
                  >
                    <tab.icon size={16} />
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-7 rounded-2xl border border-border bg-card p-6 lg:p-8 shadow-card">
            {loading ? <p className="text-muted-foreground">Loading your private records...</p> : null}

            {!loading && activeTab === "will" ? (
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  void saveWill(false);
                }}
                className="space-y-6"
              >
                <div className="flex flex-wrap gap-2">
                  {willSteps.map((item) => (
                    <button
                      key={item.step}
                      type="button"
                      onClick={() => setWillStep(item.step)}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                        willStep === item.step ? "bg-sage text-sage-foreground" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {item.step}. {item.label}
                    </button>
                  ))}
                </div>
                <div className="rounded-xl border border-border p-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="space-y-2">
                      <Label>Profile Photo</Label>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (!file) return;
                          void uploadProfilePhoto(file, setWillProfilePhoto, "Will");
                        }}
                      />
                    </div>
                    <Button type="button" variant="outline" onClick={downloadWillPdf}>
                      Download PDF
                    </Button>
                  </div>
                  {willProfilePhoto ? (
                    <img src={willProfilePhoto} alt="Will profile" className="mt-3 h-20 w-20 rounded-full object-cover border border-border" />
                  ) : null}
                </div>

                {willStep === 1 ? (
                  <div className="space-y-4">
                    <h2 className="font-display text-3xl">Step 1: Personal Information</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2"><Label>Full Name</Label><Input value={personalInfo.fullName} onChange={(event) => setPersonalInfo((prev) => ({ ...prev, fullName: event.target.value }))} required /></div>
                      <div className="space-y-2"><Label>ID / Passport Number</Label><Input value={personalInfo.idNumber} onChange={(event) => setPersonalInfo((prev) => ({ ...prev, idNumber: event.target.value }))} required /></div>
                      <div className="space-y-2"><Label>Date of Birth</Label><Input type="date" value={personalInfo.dateOfBirth} onChange={(event) => setPersonalInfo((prev) => ({ ...prev, dateOfBirth: event.target.value }))} /></div>
                      <div className="space-y-2"><Label>Phone Number</Label><Input value={personalInfo.phone} onChange={(event) => setPersonalInfo((prev) => ({ ...prev, phone: event.target.value }))} required /></div>
                      <div className="space-y-2"><Label>Email</Label><Input type="email" value={personalInfo.email} onChange={(event) => setPersonalInfo((prev) => ({ ...prev, email: event.target.value }))} required /></div>
                      <div className="space-y-2"><Label>Current Address</Label><Input value={personalInfo.currentAddress} onChange={(event) => setPersonalInfo((prev) => ({ ...prev, currentAddress: event.target.value }))} /></div>
                      <div className="space-y-2"><Label>Marital Status</Label><Input value={personalInfo.maritalStatus} onChange={(event) => setPersonalInfo((prev) => ({ ...prev, maritalStatus: event.target.value }))} /></div>
                      <div className="space-y-2">
                        <Label>Do you have children?</Label>
                        <select value={personalInfo.hasChildren} onChange={(event) => setPersonalInfo((prev) => ({ ...prev, hasChildren: event.target.value as "YES" | "NO" }))} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                          <option value="YES">Yes</option>
                          <option value="NO">No</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ) : null}

                {willStep === 2 ? (
                  <div className="space-y-4">
                    <h2 className="font-display text-3xl">Step 2: Executor Appointment</h2>
                    <p className="text-sm text-muted-foreground">Choose someone you trust to manage your estate.</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2"><Label>Executor Full Name</Label><Input value={executor.fullName} onChange={(event) => setExecutor((prev) => ({ ...prev, fullName: event.target.value }))} required /></div>
                      <div className="space-y-2"><Label>Relationship</Label><Input value={executor.relationship} onChange={(event) => setExecutor((prev) => ({ ...prev, relationship: event.target.value }))} required /></div>
                      <div className="space-y-2"><Label>Phone</Label><Input value={executor.phone} onChange={(event) => setExecutor((prev) => ({ ...prev, phone: event.target.value }))} required /></div>
                      <div className="space-y-2"><Label>Email</Label><Input type="email" value={executor.email} onChange={(event) => setExecutor((prev) => ({ ...prev, email: event.target.value }))} required /></div>
                      <div className="space-y-2 md:col-span-2"><Label>Alternate Executor (optional)</Label><Input value={executor.alternateExecutor} onChange={(event) => setExecutor((prev) => ({ ...prev, alternateExecutor: event.target.value }))} /></div>
                    </div>
                  </div>
                ) : null}

                {willStep === 3 ? (
                  <div className="space-y-4">
                    <h2 className="font-display text-3xl">Step 3: Beneficiaries</h2>
                    {beneficiaries.map((item) => (
                      <div key={item.id} className="rounded-xl border border-border p-4 space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="space-y-2"><Label>Full Name</Label><Input value={item.fullName} onChange={(event) => updateBeneficiary(item.id, "fullName", event.target.value)} /></div>
                          <div className="space-y-2"><Label>Relationship</Label><Input value={item.relationship} onChange={(event) => updateBeneficiary(item.id, "relationship", event.target.value)} /></div>
                          <div className="space-y-2"><Label>National ID (optional)</Label><Input value={item.nationalId} onChange={(event) => updateBeneficiary(item.id, "nationalId", event.target.value)} /></div>
                          <div className="space-y-2"><Label>Phone/Email</Label><Input value={item.contact} onChange={(event) => updateBeneficiary(item.id, "contact", event.target.value)} /></div>
                          <div className="space-y-2 md:col-span-2"><Label>Percentage of estate (%)</Label><Input type="number" min={0} max={100} value={item.percentage} onChange={(event) => updateBeneficiary(item.id, "percentage", event.target.value)} /></div>
                        </div>
                        {beneficiaries.length > 1 ? <Button type="button" variant="outline" onClick={() => setBeneficiaries((prev) => prev.filter((x) => x.id !== item.id))}>Remove Beneficiary</Button> : null}
                      </div>
                    ))}
                    <div className="flex items-center gap-3">
                      <Button type="button" variant="outline" onClick={() => setBeneficiaries((prev) => [...prev, emptyBeneficiary()])}>Add Beneficiary</Button>
                      <p className={`text-sm font-medium ${allocationIsValid ? "text-sage" : "text-red-600"}`}>Total allocation: {totalAllocation}%</p>
                    </div>
                  </div>
                ) : null}

                {willStep === 4 ? (
                  <div className="space-y-4">
                    <h2 className="font-display text-3xl">Step 4: Assets</h2>
                    {assets.map((item) => (
                      <div key={item.id} className="rounded-xl border border-border p-4 space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label>Category</Label>
                            <select value={item.category} onChange={(event) => updateAsset(item.id, "category", event.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                              {willAssetCategories.map((category) => <option key={category} value={category}>{category}</option>)}
                            </select>
                          </div>
                          <div className="space-y-2"><Label>Asset name</Label><Input value={item.assetName} onChange={(event) => updateAsset(item.id, "assetName", event.target.value)} /></div>
                          <div className="space-y-2"><Label>Description</Label><Input value={item.description} onChange={(event) => updateAsset(item.id, "description", event.target.value)} /></div>
                          <div className="space-y-2"><Label>Location</Label><Input value={item.location} onChange={(event) => updateAsset(item.id, "location", event.target.value)} /></div>
                          <div className="space-y-2"><Label>Estimated value</Label><Input value={item.estimatedValue} onChange={(event) => updateAsset(item.id, "estimatedValue", event.target.value)} /></div>
                          <div className="space-y-2">
                            <Label>Assign to beneficiary</Label>
                            <select value={item.beneficiaryId} onChange={(event) => updateAsset(item.id, "beneficiaryId", event.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                              <option value="">Select beneficiary</option>
                              {beneficiaries.map((ben) => <option key={ben.id} value={ben.id}>{ben.fullName || "Unnamed beneficiary"}</option>)}
                            </select>
                          </div>
                          <div className="space-y-2 md:col-span-2">
                            <Label>Optional document upload</Label>
                            <input type="file" onChange={(event) => updateAsset(item.id, "documentName", event.target.files?.[0]?.name ?? "")} />
                            {item.documentName ? <p className="text-xs text-muted-foreground">Attached: {item.documentName}</p> : null}
                          </div>
                        </div>
                        {assets.length > 1 ? <Button type="button" variant="outline" onClick={() => setAssets((prev) => prev.filter((x) => x.id !== item.id))}>Remove Asset</Button> : null}
                      </div>
                    ))}
                    <Button type="button" variant="outline" onClick={() => setAssets((prev) => [...prev, emptyAsset()])}>Add Asset</Button>
                  </div>
                ) : null}

                {willStep === 5 ? (
                  <div className="space-y-4">
                    <h2 className="font-display text-3xl">Step 5: Special Wishes</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2"><Label>Burial or cremation preference</Label><Input value={specialWishes.burialPreference} onChange={(event) => setSpecialWishes((prev) => ({ ...prev, burialPreference: event.target.value }))} /></div>
                      <div className="space-y-2"><Label>Burial location</Label><Input value={specialWishes.burialLocation} onChange={(event) => setSpecialWishes((prev) => ({ ...prev, burialLocation: event.target.value }))} /></div>
                      <div className="space-y-2 md:col-span-2"><Label>Religious/cultural instructions</Label><Textarea value={specialWishes.religiousInstructions} onChange={(event) => setSpecialWishes((prev) => ({ ...prev, religiousInstructions: event.target.value }))} rows={3} /></div>
                      <div className="space-y-2"><Label>Guardianship of minors</Label><Textarea value={specialWishes.guardianshipOfMinors} onChange={(event) => setSpecialWishes((prev) => ({ ...prev, guardianshipOfMinors: event.target.value }))} rows={3} /></div>
                      <div className="space-y-2"><Label>Charity donations (optional)</Label><Textarea value={specialWishes.charityDonations} onChange={(event) => setSpecialWishes((prev) => ({ ...prev, charityDonations: event.target.value }))} rows={3} /></div>
                      <div className="space-y-2 md:col-span-2"><Label>Personal message to family</Label><Textarea value={specialWishes.personalMessage} onChange={(event) => setSpecialWishes((prev) => ({ ...prev, personalMessage: event.target.value }))} rows={4} /></div>
                    </div>
                    <label className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                      <input type="checkbox" checked={specialWishes.scheduleLetterRelease} onChange={(event) => setSpecialWishes((prev) => ({ ...prev, scheduleLetterRelease: event.target.checked }))} />
                      Schedule a letter to be released after confirmation of passing
                    </label>
                  </div>
                ) : null}

                {willStep === 6 ? (
                  <div className="space-y-4">
                    <h2 className="font-display text-3xl">Step 6: Review & Confirm</h2>
                    <div className="rounded-xl border border-border p-4 space-y-3 text-sm">
                      <p><strong>Executor:</strong> {executor.fullName || "-"} ({executor.relationship || "-"})</p>
                      <p><strong>Beneficiaries:</strong> {beneficiaries.length}</p>
                      <p><strong>Asset entries:</strong> {assets.length}</p>
                      <p><strong>Total allocation:</strong> {totalAllocation}%</p>
                      {finalizedAt ? <p><strong>Final version timestamp:</strong> {new Date(finalizedAt).toLocaleString()}</p> : null}
                    </div>
                    <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={reflectsWishes} onChange={(event) => setReflectsWishes(event.target.checked)} /> I confirm this reflects my wishes</label>
                    <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={legalValidationAcknowledged} onChange={(event) => setLegalValidationAcknowledged(event.target.checked)} /> I understand this is a digital will and may require legal validation</label>
                    <div><Button type="button" onClick={() => void saveWill(true)} disabled={savingWill}>{savingWill ? "Generating..." : "Generate Will Document"}</Button></div>
                  </div>
                ) : null}

                <div className="flex items-center gap-3">
                  <Button type="button" variant="outline" onClick={goBackWillStep} disabled={willStep === 1}>Back</Button>
                  <Button type="button" onClick={goNextWillStep} disabled={willStep === 6}>Continue</Button>
                </div>
              </form>
            ) : null}

            {!loading && activeTab === "legacy" ? (
              <form onSubmit={saveLegacy} className="space-y-6">
                <div className="flex flex-wrap gap-2">
                  {legacySteps.map((item) => (
                    <button
                      key={item.step}
                      type="button"
                      onClick={() => setLegacyStep(item.step)}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium ${legacyStep === item.step ? "bg-sage text-sage-foreground" : "bg-muted text-muted-foreground"}`}
                    >
                      {item.step}. {item.label}
                    </button>
                  ))}
                </div>
                <div className="rounded-xl border border-border p-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="space-y-2">
                      <Label>Profile Photo</Label>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (!file) return;
                          void uploadProfilePhoto(file, setLegacyProfilePhoto, "Legacy");
                        }}
                      />
                    </div>
                    <Button type="button" variant="outline" onClick={downloadLegacyPdf}>
                      Download PDF
                    </Button>
                  </div>
                  {legacyProfilePhoto ? (
                    <img src={legacyProfilePhoto} alt="Legacy profile" className="mt-3 h-20 w-20 rounded-full object-cover border border-border" />
                  ) : null}
                </div>

                {legacyStep === 1 ? (
                  <div className="space-y-4">
                    <h2 className="font-display text-3xl">Step 1: Personal Identity</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2"><Label>Full name</Label><Input value={legacyIdentity.fullName} onChange={(event) => setLegacyIdentity((prev) => ({ ...prev, fullName: event.target.value }))} /></div>
                      <div className="space-y-2"><Label>ID / Passport</Label><Input value={legacyIdentity.idNumber} onChange={(event) => setLegacyIdentity((prev) => ({ ...prev, idNumber: event.target.value }))} /></div>
                      <div className="space-y-2"><Label>Date of Birth</Label><Input type="date" value={legacyIdentity.dateOfBirth} onChange={(event) => setLegacyIdentity((prev) => ({ ...prev, dateOfBirth: event.target.value }))} /></div>
                      <div className="space-y-2"><Label>Contact details</Label><Input value={legacyIdentity.contactDetails} onChange={(event) => setLegacyIdentity((prev) => ({ ...prev, contactDetails: event.target.value }))} /></div>
                      <div className="space-y-2"><Label>Marital status</Label><Input value={legacyIdentity.maritalStatus} onChange={(event) => setLegacyIdentity((prev) => ({ ...prev, maritalStatus: event.target.value }))} /></div>
                      <div className="space-y-2"><Label>Children (list if any)</Label><Input value={legacyIdentity.childrenList} onChange={(event) => setLegacyIdentity((prev) => ({ ...prev, childrenList: event.target.value }))} /></div>
                      <div className="space-y-2 md:col-span-2">
                        <Label>Upload ID copy (optional)</Label>
                        <input type="file" onChange={(event) => setLegacyIdentity((prev) => ({ ...prev, idCopyFileName: event.target.files?.[0]?.name ?? "" }))} />
                        <p className="text-xs text-muted-foreground">Stored in encrypted storage.</p>
                      </div>
                    </div>
                  </div>
                ) : null}

                {legacyStep === 2 ? (
                  <div className="space-y-4">
                    <h2 className="font-display text-3xl">Step 2: Trusted Circle</h2>
                    {legacyTrustedCircle.map((member) => (
                      <div key={member.id} className="rounded-xl border border-border p-4 space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="space-y-2"><Label>Name</Label><Input value={member.fullName} onChange={(event) => updateTrustedMember(member.id, "fullName", event.target.value)} /></div>
                          <div className="space-y-2"><Label>Relationship</Label><Input value={member.relationship} onChange={(event) => updateTrustedMember(member.id, "relationship", event.target.value)} /></div>
                          <div className="space-y-2"><Label>Contact info</Label><Input value={member.contactInfo} onChange={(event) => updateTrustedMember(member.id, "contactInfo", event.target.value)} /></div>
                          <div className="space-y-2">
                            <Label>Assigned role</Label>
                            <select value={member.role} onChange={(event) => updateTrustedMember(member.id, "role", event.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                              <option value="EXECUTOR">Executor</option>
                              <option value="TRUSTED_FAMILY">Trusted Family</option>
                              <option value="LAWYER">Lawyer</option>
                              <option value="FINANCIAL_ADVISOR">Financial Advisor</option>
                              <option value="OTHER">Other</option>
                            </select>
                          </div>
                          <div className="space-y-2"><Label>Secure access code</Label><Input value={member.secureAccessCode} readOnly /></div>
                          <div className="space-y-2">
                            <Label>Permission level</Label>
                            <select value={member.permissionLevel} onChange={(event) => updateTrustedMember(member.id, "permissionLevel", event.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                              <option value="VIEW_ONLY">View only</option>
                              <option value="MANAGE_FUNDRAISER">Manage fundraiser</option>
                              <option value="FULL_ACCESS">Full access</option>
                            </select>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button type="button" variant="outline" onClick={() => updateTrustedMember(member.id, "secureAccessCode", createSecureCode())}>Regenerate Code</Button>
                          {legacyTrustedCircle.length > 1 ? <Button type="button" variant="outline" onClick={() => setLegacyTrustedCircle((prev) => prev.filter((item) => item.id !== member.id))}>Revoke Access</Button> : null}
                        </div>
                      </div>
                    ))}
                    <Button type="button" variant="outline" onClick={() => setLegacyTrustedCircle((prev) => [...prev, emptyTrustedMember()])}>Add Trusted Person</Button>
                  </div>
                ) : null}

                {legacyStep === 3 ? (
                  <div className="space-y-6">
                    <h2 className="font-display text-3xl">Step 3: Assets & Wealth Overview</h2>
                    <p className="text-sm text-muted-foreground">Never store raw passwords. Store only instructions on how to access digital assets.</p>

                    <div className="space-y-3">
                      <h3 className="font-semibold">Real Estate</h3>
                      {legacyRealEstate.map((asset) => (
                        <div key={asset.id} className="rounded-xl border border-border p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="space-y-2"><Label>Property name</Label><Input value={asset.propertyName} onChange={(event) => updateLegacyRealEstate(asset.id, "propertyName", event.target.value)} /></div>
                          <div className="space-y-2"><Label>Location</Label><Input value={asset.location} onChange={(event) => updateLegacyRealEstate(asset.id, "location", event.target.value)} /></div>
                          <div className="space-y-2 md:col-span-2"><Label>Title deed upload</Label><input type="file" onChange={(event) => updateLegacyRealEstate(asset.id, "titleDeedFile", event.target.files?.[0]?.name ?? "")} /></div>
                          <div className="space-y-2 md:col-span-2"><Label>Assigned beneficiary</Label><Input value={asset.assignedBeneficiary} onChange={(event) => updateLegacyRealEstate(asset.id, "assignedBeneficiary", event.target.value)} /></div>
                        </div>
                      ))}
                      <Button type="button" variant="outline" onClick={() => setLegacyRealEstate((prev) => [...prev, emptyLegacyRealEstate()])}>Add Real Estate</Button>
                    </div>

                    <div className="space-y-3">
                      <h3 className="font-semibold">Financial</h3>
                      {legacyFinancial.map((asset) => (
                        <div key={asset.id} className="rounded-xl border border-border p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="space-y-2"><Label>Account type</Label><Input placeholder="Bank, SACCO, Shares, Insurance" value={asset.accountType} onChange={(event) => updateLegacyFinancial(asset.id, "accountType", event.target.value)} /></div>
                          <div className="space-y-2"><Label>Institution</Label><Input value={asset.institution} onChange={(event) => updateLegacyFinancial(asset.id, "institution", event.target.value)} /></div>
                          <div className="space-y-2"><Label>Reference</Label><Input value={asset.reference} onChange={(event) => updateLegacyFinancial(asset.id, "reference", event.target.value)} /></div>
                          <div className="space-y-2"><Label>Assigned beneficiary</Label><Input value={asset.assignedBeneficiary} onChange={(event) => updateLegacyFinancial(asset.id, "assignedBeneficiary", event.target.value)} /></div>
                          <div className="space-y-2 md:col-span-2"><Label>Policy document upload</Label><input type="file" onChange={(event) => updateLegacyFinancial(asset.id, "insurancePolicyFile", event.target.files?.[0]?.name ?? "")} /></div>
                        </div>
                      ))}
                      <Button type="button" variant="outline" onClick={() => setLegacyFinancial((prev) => [...prev, emptyLegacyFinancial()])}>Add Financial Asset</Button>
                    </div>

                    <div className="space-y-3">
                      <h3 className="font-semibold">Digital Assets</h3>
                      {legacyDigital.map((asset) => (
                        <div key={asset.id} className="rounded-xl border border-border p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="space-y-2"><Label>Asset name</Label><Input placeholder="Domain, social, crypto wallet" value={asset.assetName} onChange={(event) => updateLegacyDigital(asset.id, "assetName", event.target.value)} /></div>
                          <div className="space-y-2"><Label>Platform</Label><Input value={asset.platform} onChange={(event) => updateLegacyDigital(asset.id, "platform", event.target.value)} /></div>
                          <div className="space-y-2 md:col-span-2"><Label>Access instructions</Label><Textarea value={asset.accessInstructions} onChange={(event) => updateLegacyDigital(asset.id, "accessInstructions", event.target.value)} rows={2} /></div>
                          <div className="space-y-2 md:col-span-2"><Label>Assigned beneficiary</Label><Input value={asset.assignedBeneficiary} onChange={(event) => updateLegacyDigital(asset.id, "assignedBeneficiary", event.target.value)} /></div>
                        </div>
                      ))}
                      <Button type="button" variant="outline" onClick={() => setLegacyDigital((prev) => [...prev, emptyLegacyDigital()])}>Add Digital Asset</Button>
                    </div>
                  </div>
                ) : null}

                {legacyStep === 4 ? (
                  <div className="space-y-4">
                    <h2 className="font-display text-3xl">Step 4: Beneficiary Distribution</h2>
                    {legacyBeneficiaries.map((item) => (
                      <div key={item.id} className="rounded-xl border border-border p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-2"><Label>Full name</Label><Input value={item.fullName} onChange={(event) => updateLegacyBeneficiary(item.id, "fullName", event.target.value)} /></div>
                        <div className="space-y-2"><Label>Relationship</Label><Input value={item.relationship} onChange={(event) => updateLegacyBeneficiary(item.id, "relationship", event.target.value)} /></div>
                        <div className="space-y-2"><Label>Percentage allocation</Label><Input type="number" min={0} max={100} value={item.percentage} onChange={(event) => updateLegacyBeneficiary(item.id, "percentage", event.target.value)} /></div>
                        <div className="space-y-2"><Label>Specific asset assignment</Label><Input value={item.specificAssetAssignment} onChange={(event) => updateLegacyBeneficiary(item.id, "specificAssetAssignment", event.target.value)} /></div>
                      </div>
                    ))}
                    <Button type="button" variant="outline" onClick={() => setLegacyBeneficiaries((prev) => [...prev, emptyLegacyBeneficiary()])}>Add Beneficiary</Button>
                    <div className="space-y-2">
                      <Label>Charity donations (optional)</Label>
                      <Textarea value={legacyCharityDonations} onChange={(event) => setLegacyCharityDonations(event.target.value)} rows={2} />
                    </div>
                    <p className={`text-sm font-medium ${legacyAllocationIsValid ? "text-sage" : "text-red-600"}`}>Total allocation: {legacyTotalAllocation}%</p>
                  </div>
                ) : null}

                {legacyStep === 5 ? (
                  <div className="space-y-4">
                    <h2 className="font-display text-3xl">Step 5: Funeral & Memorial Wishes</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2"><Label>Burial or cremation</Label><Input value={legacyFuneralWishes.burialOrCremation} onChange={(event) => setLegacyFuneralWishes((prev) => ({ ...prev, burialOrCremation: event.target.value }))} /></div>
                      <div className="space-y-2"><Label>Preferred location</Label><Input value={legacyFuneralWishes.preferredLocation} onChange={(event) => setLegacyFuneralWishes((prev) => ({ ...prev, preferredLocation: event.target.value }))} /></div>
                      <div className="space-y-2"><Label>Religious instructions</Label><Input value={legacyFuneralWishes.religiousInstructions} onChange={(event) => setLegacyFuneralWishes((prev) => ({ ...prev, religiousInstructions: event.target.value }))} /></div>
                      <div className="space-y-2"><Label>Service type</Label><Input value={legacyFuneralWishes.serviceType} onChange={(event) => setLegacyFuneralWishes((prev) => ({ ...prev, serviceType: event.target.value }))} /></div>
                      <div className="space-y-2"><Label>Music preferences</Label><Input value={legacyFuneralWishes.musicPreferences} onChange={(event) => setLegacyFuneralWishes((prev) => ({ ...prev, musicPreferences: event.target.value }))} /></div>
                      <div className="space-y-2"><Label>Dress code</Label><Input value={legacyFuneralWishes.dressCode} onChange={(event) => setLegacyFuneralWishes((prev) => ({ ...prev, dressCode: event.target.value }))} /></div>
                      <div className="space-y-2"><Label>Speakers</Label><Input value={legacyFuneralWishes.speakers} onChange={(event) => setLegacyFuneralWishes((prev) => ({ ...prev, speakers: event.target.value }))} /></div>
                      <div className="space-y-2"><Label>Cultural traditions</Label><Input value={legacyFuneralWishes.culturalTraditions} onChange={(event) => setLegacyFuneralWishes((prev) => ({ ...prev, culturalTraditions: event.target.value }))} /></div>
                      <div className="space-y-2 md:col-span-2"><Label>Marketplace item links</Label><Input value={legacyFuneralWishes.marketplaceLinks} onChange={(event) => setLegacyFuneralWishes((prev) => ({ ...prev, marketplaceLinks: event.target.value }))} /></div>
                      <div className="space-y-2 md:col-span-2"><Label>Pre-select casket/services</Label><Input value={legacyFuneralWishes.preselectedServices} onChange={(event) => setLegacyFuneralWishes((prev) => ({ ...prev, preselectedServices: event.target.value }))} /></div>
                    </div>
                  </div>
                ) : null}

                {legacyStep === 6 ? (
                  <div className="space-y-4">
                    <h2 className="font-display text-3xl">Step 6: Messages & Legacy Letters</h2>
                    {legacyLetters.map((letter) => (
                      <div key={letter.id} className="rounded-xl border border-border p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label>Recipient Type</Label>
                          <select
                            value={letter.recipientType}
                            onChange={(event) =>
                              setLegacyLetters((prev) => prev.map((x) => (x.id === letter.id ? { ...x, recipientType: event.target.value as LegacyLetter["recipientType"] } : x)))
                            }
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          >
                            <option value="SPOUSE">Spouse</option>
                            <option value="CHILDREN">Children</option>
                            <option value="FRIENDS">Friends</option>
                            <option value="OTHER">Other</option>
                          </select>
                        </div>
                        <div className="space-y-2"><Label>Recipient name</Label><Input value={letter.recipientName} onChange={(event) => setLegacyLetters((prev) => prev.map((x) => (x.id === letter.id ? { ...x, recipientName: event.target.value } : x)))} /></div>
                        <div className="space-y-2 md:col-span-2"><Label>Letter message</Label><Textarea value={letter.message} onChange={(event) => setLegacyLetters((prev) => prev.map((x) => (x.id === letter.id ? { ...x, message: event.target.value } : x)))} rows={3} /></div>
                      </div>
                    ))}
                    <Button type="button" variant="outline" onClick={() => setLegacyLetters((prev) => [...prev, emptyLegacyLetter()])}>Add Letter</Button>
                    <div className="space-y-2"><Label>Video message URL</Label><Input value={legacyVideoMessageUrl} onChange={(event) => setLegacyVideoMessageUrl(event.target.value)} /></div>
                    <div className="space-y-2">
                      <Label>Release trigger</Label>
                      <select value={legacyReleaseTrigger} onChange={(event) => setLegacyReleaseTrigger(event.target.value as "MANUAL_BY_EXECUTOR" | "VERIFIED_CONFIRMATION_EVENT")} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                        <option value="MANUAL_BY_EXECUTOR">Manual by executor</option>
                        <option value="VERIFIED_CONFIRMATION_EVENT">Verified confirmation event</option>
                      </select>
                    </div>
                  </div>
                ) : null}

                {legacyStep === 7 ? (
                  <div className="space-y-4">
                    <h2 className="font-display text-3xl">Step 7: Fund & Financial Support Plan</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2"><Label>Set aside funeral budget</Label><Input value={legacyFundPlan.funeralBudget} onChange={(event) => setLegacyFundPlan((prev) => ({ ...prev, funeralBudget: event.target.value }))} /></div>
                      <div className="space-y-2"><Label>Insurance policy links</Label><Input value={legacyFundPlan.insurancePolicyLinks} onChange={(event) => setLegacyFundPlan((prev) => ({ ...prev, insurancePolicyLinks: event.target.value }))} /></div>
                      <div className="space-y-2"><Label>Pre-create fundraiser template</Label><Input value={legacyFundPlan.fundraiserTemplate} onChange={(event) => setLegacyFundPlan((prev) => ({ ...prev, fundraiserTemplate: event.target.value }))} /></div>
                      <div className="space-y-2"><Label>Assign fundraiser manager</Label><Input value={legacyFundPlan.fundraiserManager} onChange={(event) => setLegacyFundPlan((prev) => ({ ...prev, fundraiserManager: event.target.value }))} /></div>
                    </div>
                    <label className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                      <input type="checkbox" checked={legacyFundPlan.allowContributionToggle} onChange={(event) => setLegacyFundPlan((prev) => ({ ...prev, allowContributionToggle: event.target.checked }))} />
                      Allow contribution toggle
                    </label>
                  </div>
                ) : null}

                <div className="flex items-center gap-3">
                  <Button type="button" variant="outline" onClick={goBackLegacyStep} disabled={legacyStep === 1}>Back</Button>
                  <Button type="button" onClick={goNextLegacyStep} disabled={legacyStep === 7}>Continue</Button>
                  <Button type="submit" disabled={savingLegacy}>{savingLegacy ? "Saving..." : "Save Legacy Plan"}</Button>
                </div>
              </form>
            ) : null}

            {!loading && activeTab === "memorial" ? (
              <form onSubmit={createMemorial} className="space-y-6">
                <div className="flex flex-wrap gap-2">
                  {memorialSteps.map((item) => (
                    <button
                      key={item.step}
                      type="button"
                      onClick={() => setMemorialStep(item.step)}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                        memorialStep === item.step ? "bg-sage text-sage-foreground" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
                <div className="rounded-xl border border-border p-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="space-y-2">
                      <Label>Profile Photo</Label>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (!file) return;
                          void uploadProfilePhoto(file, setMemorialProfilePhoto, "Memorial");
                        }}
                      />
                    </div>
                    <Button type="button" variant="outline" onClick={downloadMemorialPdf}>
                      Download PDF
                    </Button>
                  </div>
                  {memorialProfilePhoto ? (
                    <img src={memorialProfilePhoto} alt="Memorial profile" className="mt-3 h-20 w-20 rounded-full object-cover border border-border" />
                  ) : null}
                </div>

                {memorialStep === 1 ? (
                  <div className="space-y-4">
                    <h2 className="font-display text-3xl">Step 1: Basic Information</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Full Name of the departed *</Label>
                        <Input value={memorialName} onChange={(event) => setMemorialName(event.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Date of Passing *</Label>
                        <Input type="date" value={memorialDateOfPassing} onChange={(event) => setMemorialDateOfPassing(event.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Date of Birth (optional)</Label>
                        <Input type="date" value={memorialDateOfBirth} onChange={(event) => setMemorialDateOfBirth(event.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Location (County/City)</Label>
                        <Input value={memorialLocation} onChange={(event) => setMemorialLocation(event.target.value)} />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label>Main Photo (portrait) *</Label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(event) => {
                            const file = event.target.files?.[0];
                            if (!file) return;
                            void uploadMemorialCover(file);
                          }}
                        />
                        {memorialCoverImage ? <img src={memorialCoverImage} alt="Memorial cover" className="h-44 w-44 object-cover rounded-xl border border-border" /> : null}
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label>Short tagline</Label>
                        <Input value={memorialTagline} onChange={(event) => setMemorialTagline(event.target.value)} />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label>Privacy selection</Label>
                        <select
                          value={memorialVisibility}
                          onChange={(event) => setMemorialVisibility(event.target.value as VisibilityType)}
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        >
                          <option value="PUBLIC">Public (searchable)</option>
                          <option value="PRIVATE">Private (invite only)</option>
                          <option value="LINK_ONLY">Link-only</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ) : null}

                {memorialStep === 2 ? (
                  <div className="space-y-4">
                    <h2 className="font-display text-3xl">Step 2: Life Story / Tribute</h2>
                    <div className="space-y-2">
                      <Label>Short biography</Label>
                      <Textarea value={memorialBio} onChange={(event) => setMemorialBio(event.target.value)} rows={3} />
                    </div>
                    <div className="space-y-2">
                      <Label>Achievements</Label>
                      <Textarea value={memorialAchievements} onChange={(event) => setMemorialAchievements(event.target.value)} rows={3} />
                    </div>
                    <div className="space-y-2">
                      <Label>Personal traits</Label>
                      <Textarea value={memorialTraits} onChange={(event) => setMemorialTraits(event.target.value)} rows={2} />
                    </div>
                    <div className="space-y-2">
                      <Label>Favorite memories</Label>
                      <Textarea value={memorialMemories} onChange={(event) => setMemorialMemories(event.target.value)} rows={3} />
                    </div>
                    <div className="space-y-2">
                      <Label>Tribute text</Label>
                      <Textarea value={memorialStory} onChange={(event) => setMemorialStory(event.target.value)} rows={4} />
                    </div>
                    <Button type="button" variant="outline" onClick={generateTributeDraft}>Help me write a tribute</Button>
                  </div>
                ) : null}

                {memorialStep === 3 ? (
                  <div className="space-y-4">
                    <h2 className="font-display text-3xl">Step 3: Service Details</h2>
                    <div className="space-y-2">
                      <Label>Viewing / Wake details</Label>
                      <Input value={memorialServiceDetails.viewingWake} onChange={(event) => setMemorialServiceDetails((prev) => ({ ...prev, viewingWake: event.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label>Funeral service details</Label>
                      <Input value={memorialServiceDetails.funeralService} onChange={(event) => setMemorialServiceDetails((prev) => ({ ...prev, funeralService: event.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label>Burial location</Label>
                      <Input value={memorialServiceDetails.burialLocation} onChange={(event) => setMemorialServiceDetails((prev) => ({ ...prev, burialLocation: event.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label>Map link</Label>
                      <Input value={memorialServiceDetails.mapLink} onChange={(event) => setMemorialServiceDetails((prev) => ({ ...prev, mapLink: event.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label>Contact person</Label>
                      <Input value={memorialServiceDetails.contactPerson} onChange={(event) => setMemorialServiceDetails((prev) => ({ ...prev, contactPerson: event.target.value }))} />
                    </div>
                    <label className="inline-flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={memorialServiceDetails.showServiceDetailsPublicly} onChange={(event) => setMemorialServiceDetails((prev) => ({ ...prev, showServiceDetailsPublicly: event.target.checked }))} />
                      Show service details publicly
                    </label>
                    <label className="inline-flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={memorialServiceDetails.hideUntilConfirmed} onChange={(event) => setMemorialServiceDetails((prev) => ({ ...prev, hideUntilConfirmed: event.target.checked }))} />
                      Hide until confirmed
                    </label>
                  </div>
                ) : null}

                {memorialStep === 4 ? (
                  <div className="space-y-4">
                    <h2 className="font-display text-3xl">Step 4: Gallery & Media</h2>
                    <div className="space-y-2">
                      <Label>Upload multiple photos</Label>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(event) => {
                          if (!event.target.files) return;
                          void addMemorialGallery(event.target.files);
                        }}
                      />
                    </div>
                    <div className="space-y-3">
                      {memorialGallery.map((item) => (
                        <div key={item.id} className="rounded-xl border border-border p-3">
                          <img src={item.dataUrl} alt="Gallery" className="h-36 w-36 object-cover rounded-lg border border-border" />
                          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                            <Input placeholder="Caption" value={item.caption} onChange={(event) => updateMemorialGalleryItem(item.id, "caption", event.target.value)} />
                            <Input placeholder="Album" value={item.album} onChange={(event) => updateMemorialGalleryItem(item.id, "album", event.target.value)} />
                          </div>
                          <Button type="button" variant="outline" className="mt-2" onClick={() => removeMemorialGalleryItem(item.id)}>Remove</Button>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-2">
                      <Label>Upload tribute video (URL)</Label>
                      <Input value={memorialVideoUrl} onChange={(event) => setMemorialVideoUrl(event.target.value)} />
                    </div>
                  </div>
                ) : null}

                {memorialStep === 5 ? (
                  <div className="space-y-4">
                    <h2 className="font-display text-3xl">Step 5: Tributes & Contributions</h2>
                    <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={memorialGuestbookEnabled} onChange={(event) => setMemorialGuestbookEnabled(event.target.checked)} /> Enable Guestbook</label>
                    <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={memorialRequireApproval} onChange={(event) => setMemorialRequireApproval(event.target.checked)} /> Require approval before messages go live</label>
                    <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={memorialAllowFlowers} onChange={(event) => setMemorialAllowFlowers(event.target.checked)} /> Allow flower tributes (digital)</label>
                    <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={memorialAllowContributions} onChange={(event) => setMemorialAllowContributions(event.target.checked)} /> Enable contributions (link to fundraiser)</label>

                    {memorialAllowContributions ? (
                      <div className="space-y-3 rounded-xl border border-border p-4">
                        <div className="space-y-2">
                          <Label>Select existing fundraiser</Label>
                          <select value={memorialSelectedFundraiserId} onChange={(event) => setMemorialSelectedFundraiserId(event.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                            <option value="">Select fundraiser</option>
                            {myFundraisers.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
                          </select>
                        </div>
                        <p className="text-xs text-muted-foreground">Or create one quickly:</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          <Input placeholder="Fundraiser title" value={memorialQuickFundraiserTitle} onChange={(event) => setMemorialQuickFundraiserTitle(event.target.value)} />
                          <Input placeholder="Target amount (KES)" type="number" min={1} value={memorialQuickFundraiserTarget} onChange={(event) => setMemorialQuickFundraiserTarget(event.target.value)} />
                        </div>
                        <Button type="button" variant="outline" onClick={() => void createQuickFundraiser()} disabled={memorialCreatingQuickFundraiser}>
                          {memorialCreatingQuickFundraiser ? "Creating..." : "Create Quick Fundraiser"}
                        </Button>
                        <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={memorialDonorListPublic} onChange={(event) => setMemorialDonorListPublic(event.target.checked)} /> Donor list public</label>
                      </div>
                    ) : null}
                  </div>
                ) : null}

                {memorialStep === 6 ? (
                  <div className="space-y-4">
                    <h2 className="font-display text-3xl">Step 6: Invite Family & Trusted People</h2>
                    {memorialInvitees.map((invitee) => (
                      <div key={invitee.id} className="rounded-xl border border-border p-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                        <Input placeholder="Email or phone" value={invitee.contact} onChange={(event) => updateInvitee(invitee.id, "contact", event.target.value)} />
                        <select value={invitee.role} onChange={(event) => updateInvitee(invitee.id, "role", event.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                          <option value="VIEWER">Viewer</option>
                          <option value="MODERATOR">Moderator</option>
                          <option value="FUNDRAISER_MANAGER">Fundraiser manager</option>
                        </select>
                      </div>
                    ))}
                    <Button type="button" variant="outline" onClick={() => setMemorialInvitees((prev) => [...prev, { id: createId("invite"), contact: "", role: "VIEWER" }])}>Add Invitee</Button>
                    <div className="space-y-2">
                      <Label>Invite link</Label>
                      <Input value={memorialInviteLink} readOnly />
                    </div>
                    <div className="space-y-2">
                      <Label>QR code</Label>
                      <img src={memorialQrCodeUrl} alt="Invite QR" className="h-36 w-36 border border-border rounded-lg" />
                    </div>
                  </div>
                ) : null}

                {memorialStep === 7 ? (
                  <div className="space-y-4">
                    <h2 className="font-display text-3xl">Step 7: Review & Publish</h2>
                    <div className="rounded-xl border border-border p-4 text-sm space-y-2">
                      <p><strong>Profile header:</strong> {memorialName || "-"}</p>
                      <p><strong>Tribute text:</strong> {memorialStory || memorialBio || "-"}</p>
                      <p><strong>Service details:</strong> {memorialServiceDetails.funeralService || "Not added"}</p>
                      <p><strong>Gallery:</strong> {memorialGallery.length} photos</p>
                      <p><strong>Guestbook:</strong> {memorialGuestbookEnabled ? "Enabled" : "Disabled"}</p>
                      <p><strong>Fundraiser linked:</strong> {memorialAllowContributions ? (memorialSelectedFundraiserId ? "Yes" : "Not selected") : "No"}</p>
                    </div>
                    <Button type="submit" disabled={creatingMemorial}>{creatingMemorial ? "Publishing..." : "Publish Memorial"}</Button>
                  </div>
                ) : null}

                <div className="flex items-center gap-3">
                  <Button type="button" variant="outline" onClick={goBackMemorialStep} disabled={memorialStep === 1}>Back</Button>
                  <Button type="button" onClick={goNextMemorialStep} disabled={memorialStep === 7}>Continue</Button>
                </div>
              </form>
            ) : null}

            {!loading && activeTab === "fundraiser" ? (
              <form onSubmit={createFundraiser} className="space-y-6">
                <div className="flex flex-wrap gap-2">
                  {fundraiserSteps.map((item) => (
                    <button
                      key={item.step}
                      type="button"
                      onClick={() => setFundraiserStep(item.step)}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium ${fundraiserStep === item.step ? "bg-sage text-sage-foreground" : "bg-muted text-muted-foreground"}`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
                <div className="rounded-xl border border-border p-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="space-y-2">
                      <Label>Profile Photo</Label>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (!file) return;
                          void uploadProfilePhoto(file, setFundraiserProfilePhoto, "Fundraiser");
                        }}
                      />
                    </div>
                    <Button type="button" variant="outline" onClick={downloadFundraiserPdf}>
                      Download PDF
                    </Button>
                  </div>
                  {fundraiserProfilePhoto ? (
                    <img src={fundraiserProfilePhoto} alt="Fundraiser profile" className="mt-3 h-20 w-20 rounded-full object-cover border border-border" />
                  ) : null}
                </div>

                {fundraiserStep === 1 ? (
                  <div className="space-y-4">
                    <h2 className="font-display text-3xl">Step 1: Basic Information</h2>
                    <div className="space-y-2">
                      <Label>Fundraiser Title *</Label>
                      <Input value={fundraiserTitle} onChange={(event) => setFundraiserTitle(event.target.value)} placeholder="Support the Burial of John Kamau" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Category</Label>
                        <select value={fundraiserCategory} onChange={(event) => setFundraiserCategory(event.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                          <option>Funeral Expenses</option>
                          <option>Medical Bills</option>
                          <option>Family Support</option>
                          <option>Memorial Fund</option>
                          <option>Other</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label>Linked Memorial (optional)</Label>
                        <select value={fundraiserLinkedMemorialId} onChange={(event) => setFundraiserLinkedMemorialId(event.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                          <option value="">Select memorial</option>
                          {fundraiserMemorialOptions.map((item) => (
                            <option key={item.id} value={item.id}>{item.title}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label>Organizer Name</Label>
                        <Input value={fundraiserOrganizerName} onChange={(event) => setFundraiserOrganizerName(event.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Contact Phone *</Label>
                        <Input value={fundraiserContactPhone} onChange={(event) => setFundraiserContactPhone(event.target.value)} />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label>Contact Email *</Label>
                        <Input type="email" value={fundraiserContactEmail} onChange={(event) => setFundraiserContactEmail(event.target.value)} />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label>Privacy</Label>
                        <select value={fundraiserPrivacy} onChange={(event) => setFundraiserPrivacy(event.target.value as "PUBLIC" | "LINK_ONLY" | "PRIVATE")} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                          <option value="PUBLIC">Public (visible to everyone)</option>
                          <option value="LINK_ONLY">Link-only</option>
                          <option value="PRIVATE">Private (invite only)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ) : null}

                {fundraiserStep === 2 ? (
                  <div className="space-y-4">
                    <h2 className="font-display text-3xl">Step 2: Fundraiser Story</h2>
                    <div className="space-y-2">
                      <Label>Story / Description</Label>
                      <Textarea value={fundraiserStory} onChange={(event) => setFundraiserStory(event.target.value)} rows={6} />
                    </div>
                    <div className="space-y-2">
                      <Label>What funds will cover (bullet style)</Label>
                      <Textarea value={fundraiserFundsCover} onChange={(event) => setFundraiserFundsCover(event.target.value)} rows={4} placeholder="- Burial costs&#10;- Medical bills&#10;- Family support" />
                    </div>
                    <div className="space-y-2">
                      <Label>Timeline (end date optional)</Label>
                      <Input type="date" value={fundraiserEndDate} onChange={(event) => setFundraiserEndDate(event.target.value)} />
                    </div>
                    <p className="text-xs text-muted-foreground">Be transparent about how funds will be used.</p>
                    <Button type="button" variant="outline" onClick={applyFundraiserStoryAssist}>AI assist draft</Button>
                  </div>
                ) : null}

                {fundraiserStep === 3 ? (
                  <div className="space-y-4">
                    <h2 className="font-display text-3xl">Step 3: Goal & Payout</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Target Amount *</Label>
                        <Input type="number" min={1} value={fundraiserTarget} onChange={(event) => setFundraiserTarget(event.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Currency</Label>
                        <select value={fundraiserCurrency} onChange={(event) => setFundraiserCurrency(event.target.value as "KES" | "USD")} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                          <option value="KES">KES</option>
                          <option value="USD">USD</option>
                        </select>
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label>Minimum contribution (optional)</Label>
                        <Input type="number" min={1} value={fundraiserMinimumContribution} onChange={(event) => setFundraiserMinimumContribution(event.target.value)} />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label>Suggested amounts</Label>
                        <div className="flex flex-wrap gap-2">
                          {fundraiserSuggestedAmounts.map((amount) => (
                            <button key={amount} type="button" className="rounded-full bg-muted px-3 py-1 text-sm">{amount}</button>
                          ))}
                          <Input className="w-28" placeholder="Custom" onKeyDown={(event) => {
                            if (event.key !== "Enter") return;
                            event.preventDefault();
                            const target = event.currentTarget;
                            const value = target.value.trim();
                            if (!value) return;
                            setFundraiserSuggestedAmounts((prev) => (prev.includes(value) ? prev : [...prev, value]));
                            target.value = "";
                          }} />
                        </div>
                      </div>
                    </div>

                    <div className="rounded-xl border border-border p-4 space-y-3">
                      <h3 className="font-semibold">Payout Details</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Input placeholder="Bank Name" value={fundraiserBankName} onChange={(event) => setFundraiserBankName(event.target.value)} />
                        <Input placeholder="Account Name" value={fundraiserAccountName} onChange={(event) => setFundraiserAccountName(event.target.value)} />
                        <Input placeholder="Account Number" value={fundraiserAccountNumber} onChange={(event) => setFundraiserAccountNumber(event.target.value)} />
                        <Input placeholder="MPESA Number" value={fundraiserMpesaNumber} onChange={(event) => setFundraiserMpesaNumber(event.target.value)} />
                        <Input className="md:col-span-2" placeholder="Beneficiary Name" value={fundraiserBeneficiaryName} onChange={(event) => setFundraiserBeneficiaryName(event.target.value)} />
                      </div>
                    </div>

                    <label className="inline-flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={fundraiserPermissionConfirmed} onChange={(event) => setFundraiserPermissionConfirmed(event.target.checked)} />
                      I confirm I have permission to raise funds for this cause.
                    </label>
                  </div>
                ) : null}

                {fundraiserStep === 4 ? (
                  <div className="space-y-4">
                    <h2 className="font-display text-3xl">Step 4: Add Image</h2>
                    <div className="rounded-xl border-2 border-dashed border-border p-4">
                      <Label>Cover Image Upload (Required)</Label>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (!file) return;
                          void uploadFundraiserCover(file);
                        }}
                      />
                      {fundraiserCoverImage ? (
                        <div className="mt-3 space-y-2">
                          <img src={fundraiserCoverImage} alt="Fundraiser cover" className="h-48 w-full object-cover rounded-xl border border-border" />
                          <Button type="button" variant="outline" onClick={() => setFundraiserCoverImage("")}>Replace image</Button>
                        </div>
                      ) : null}
                    </div>
                    <div className="space-y-2">
                      <Label>Additional Images (optional)</Label>
                      <input
                        type="file"
                        multiple
                        accept="image/jpeg,image/png,image/webp"
                        onChange={(event) => {
                          if (!event.target.files) return;
                          void uploadFundraiserAdditional(event.target.files);
                        }}
                      />
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {fundraiserAdditionalImages.map((img) => (
                          <img key={img.id} src={img.dataUrl} alt="Additional" className="h-28 w-full object-cover rounded-lg border border-border" />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">Technical validation: JPG/PNG/WEBP, max 5MB, auto-compressed before save.</p>
                  </div>
                ) : null}

                {fundraiserStep === 5 ? (
                  <div className="space-y-4">
                    <h2 className="font-display text-3xl">Step 5: Contribution Settings</h2>
                    <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={fundraiserAllowAnonymous} onChange={(event) => setFundraiserAllowAnonymous(event.target.checked)} /> Allow anonymous donations</label>
                    <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={fundraiserShowDonorsPublicly} onChange={(event) => setFundraiserShowDonorsPublicly(event.target.checked)} /> Show donor list publicly</label>
                    <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={fundraiserAllowComments} onChange={(event) => setFundraiserAllowComments(event.target.checked)} /> Allow comments from donors</label>
                    <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={fundraiserRequireAdminApproval} onChange={(event) => setFundraiserRequireAdminApproval(event.target.checked)} /> Require admin approval before going live</label>
                    <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={fundraiserUrgentBadge} onChange={(event) => setFundraiserUrgentBadge(event.target.checked)} /> Add “Urgent” badge</label>
                    <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={fundraiserAutoCloseWhenGoalReached} onChange={(event) => setFundraiserAutoCloseWhenGoalReached(event.target.checked)} /> Auto-close when goal reached</label>
                  </div>
                ) : null}

                {fundraiserStep === 6 ? (
                  <div className="space-y-4">
                    <h2 className="font-display text-3xl">Step 6: Review & Publish</h2>
                    <div className="rounded-xl border border-border p-4 text-sm space-y-2">
                      {fundraiserCoverImage ? <img src={fundraiserCoverImage} alt="Cover preview" className="h-52 w-full object-cover rounded-xl border border-border mb-3" /> : null}
                      <p><strong>Title:</strong> {fundraiserTitle || "-"}</p>
                      <p><strong>Story:</strong> {fundraiserStory || "-"}</p>
                      <p><strong>Goal:</strong> {fundraiserCurrency} {Number(fundraiserTarget || 0).toLocaleString()}</p>
                      <p><strong>Timeline:</strong> {fundraiserEndDate || "Open"}</p>
                      <p><strong>Payout recipient:</strong> {fundraiserBeneficiaryName || "Not set"}</p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <Button type="button" variant="outline" onClick={saveFundraiserDraft}>Save Draft</Button>
                      <Button type="submit" disabled={creatingFundraiser}>{creatingFundraiser ? "Publishing..." : "Publish Fundraiser"}</Button>
                    </div>
                    {latestFundraiserInvite ? (
                      <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-2 text-sm">
                        <p><strong>Invite Code:</strong> {latestFundraiserInvite.code}</p>
                        <p className="break-all"><strong>Invite Link:</strong> {latestFundraiserInvite.link}</p>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={async () => {
                              await navigator.clipboard.writeText(latestFundraiserInvite.code);
                              toast.success("Invite code copied");
                            }}
                          >
                            Copy Code
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={async () => {
                              await navigator.clipboard.writeText(latestFundraiserInvite.link);
                              toast.success("Invite link copied");
                            }}
                          >
                            Copy Link
                          </Button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : null}

                <div className="flex items-center gap-3">
                  <Button type="button" variant="outline" onClick={goBackFundraiserStep} disabled={fundraiserStep === 1}>Back</Button>
                  <Button type="button" onClick={goNextFundraiserStep} disabled={fundraiserStep === 6}>Continue</Button>
                </div>
              </form>
            ) : null}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Dashboard;
