import { FormEvent, Fragment, useEffect, useMemo, useState } from "react";
import { apiRequest, clearToken, getToken, setToken } from "./lib/api";

interface Stats {
  users: number;
  legacyPlans: number;
  activeFundraisers: number;
  totalRaised: number;
  memorials: number;
  activeListings: number;
  activities: number;
}

interface AdminUser {
  id: string;
  fullName: string;
  email: string;
  role: "ADMIN" | "USER";
  createdAt: string;
}

interface Fundraiser {
  id: string;
  title: string;
  owner: { fullName: string };
  status: "ACTIVE" | "CLOSED";
  totalRaised: number;
  targetAmount: number;
  currency: string;
}

interface Memorial {
  id: string;
  title: string;
  owner: { fullName: string };
  isPublic: boolean;
  createdAt: string;
}

interface Listing {
  id: string;
  title: string;
  vendorName: string;
  vendorContact: string | null;
  category: { name: string };
  status: "ACTIVE" | "INACTIVE";
  imageUrl: string | null;
  currency: string;
  price: number;
}

interface Category {
  id: string;
  name: string;
}

interface EventItem {
  id: string;
  type: string;
  entityType: string;
  entityId: string;
  createdAt: string;
}

interface Overview {
  stats: Stats;
  legacyPlanList: Array<{
    id: string;
    userId: string;
    user: { id: string; fullName: string; email: string };
    hasWishes: boolean;
    hasInstructions: boolean;
    hasAssets: boolean;
    hasBeneficiaries: boolean;
    updatedAt: string;
    createdAt: string;
  }>;
  fundraiserList: Fundraiser[];
  memorialList: Memorial[];
  listingList: Listing[];
  recentActivities: EventItem[];
  usersList: AdminUser[];
  rolesSummary: {
    admin: number;
    user: number;
  };
}

interface CategoriesResponse {
  categories: Category[];
}

interface AdminService {
  id: string;
  title: string;
  imageUrl: string | null;
  isActive: boolean;
  sortOrder: number;
  updatedAt: string | null;
}

interface ServicesResponse {
  services: AdminService[];
}

interface VendorApplication {
  id: string;
  businessName: string;
  businessType: "INDIVIDUAL" | "REGISTERED_BUSINESS" | "COMPANY";
  ownerFullName: string;
  email: string;
  phoneNumber: string;
  whatsappNumber?: string;
  idOrRegistrationNumber: string;
  businessCategory: string;
  businessDescription: string;
  county: string;
  physicalAddress?: string;
  offersDelivery: boolean;
  yearsInBusiness: number;
  status: "PENDING" | "APPROVED" | "REJECTED";
  submittedAt: string;
  reviewedAt: string | null;
  reviewNote: string | null;
}

interface VendorApplicationsResponse {
  applications: VendorApplication[];
}

interface LoginResponse {
  user: {
    role: string;
  };
  token: string;
}

const emptyStats: Stats = {
  users: 0,
  legacyPlans: 0,
  activeFundraisers: 0,
  totalRaised: 0,
  memorials: 0,
  activeListings: 0,
  activities: 0,
};

const vendorContacts: Record<string, string> = {
  "kenfume memorials": "+254 700 101 101",
  "kenfuse memorial supplies": "+254 700 101 101",
  "kenfuse transport services": "+254 700 202 202",
  "kenfuse catering services": "+254 700 303 303",
  "kenfuse event coordination": "+254 700 404 404",
  kabuthia: "+254 700 505 505",
};

function getVendorContact(vendorName: string) {
  return vendorContacts[vendorName.trim().toLowerCase()] ?? "+254 700 000 999";
}

type Tab = "legacy" | "fundraisers" | "memorials" | "marketplace" | "vendors" | "services" | "activity" | "users";

export default function App() {
  const [tab, setTab] = useState<Tab>("fundraisers");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [authenticated, setAuthenticated] = useState(Boolean(getToken()));

  const [stats, setStats] = useState<Stats>(emptyStats);
  const [fundraisers, setFundraisers] = useState<Fundraiser[]>([]);
  const [memorials, setMemorials] = useState<Memorial[]>([]);
  const [legacyPlans, setLegacyPlans] = useState<Overview["legacyPlanList"]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activities, setActivities] = useState<EventItem[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [services, setServices] = useState<AdminService[]>([]);
  const [vendorApplications, setVendorApplications] = useState<VendorApplication[]>([]);
  const [rolesSummary, setRolesSummary] = useState({ admin: 0, user: 0 });
  const [creatingListing, setCreatingListing] = useState(false);
  const [createCategoryId, setCreateCategoryId] = useState("");
  const [createVendorName, setCreateVendorName] = useState("");
  const [createTitle, setCreateTitle] = useState("");
  const [createDescription, setCreateDescription] = useState("");
  const [createVendorContact, setCreateVendorContact] = useState("");
  const [createPrice, setCreatePrice] = useState("");
  const [createImageUrl, setCreateImageUrl] = useState("");
  const [expandedVendorId, setExpandedVendorId] = useState<string | null>(null);

  const coverage = useMemo(() => {
    if (!stats.users) {
      return 0;
    }
    return Math.round((stats.legacyPlans / stats.users) * 100);
  }, [stats]);

  async function loadOverview() {
    try {
      setError(null);
      const [data, categoriesData, servicesData, vendorAppsData] = await Promise.all([
        apiRequest<Overview>("/api/admin/overview"),
        apiRequest<CategoriesResponse>("/api/marketplace/categories"),
        apiRequest<ServicesResponse>("/api/admin/services"),
        apiRequest<VendorApplicationsResponse>("/api/admin/vendor-applications"),
      ]);
      setStats(data.stats);
      setLegacyPlans(data.legacyPlanList ?? []);
      setFundraisers(data.fundraiserList);
      setMemorials(data.memorialList);
      setListings(data.listingList);
      setActivities(data.recentActivities);
      setUsers(data.usersList);
      setRolesSummary(data.rolesSummary);
      setCategories(categoriesData.categories);
      setServices(servicesData.services);
      setVendorApplications(vendorAppsData.applications);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    if (!authenticated) {
      setLoading(false);
      return;
    }
    void loadOverview();
  }, [authenticated]);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoginLoading(true);
    setError(null);

    try {
      const result = await apiRequest<LoginResponse>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: email.trim(), password }),
      });

      if (result.user.role !== "ADMIN") {
        throw new Error("Admin access required");
      }

      setToken(result.token);
      setAuthenticated(true);
      setLoading(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
      clearToken();
      setAuthenticated(false);
    } finally {
      setLoginLoading(false);
    }
  }

  function handleLogout() {
    clearToken();
    setAuthenticated(false);
    setStats(emptyStats);
    setFundraisers([]);
    setMemorials([]);
    setLegacyPlans([]);
    setListings([]);
    setServices([]);
    setVendorApplications([]);
    setActivities([]);
    setUsers([]);
    setRolesSummary({ admin: 0, user: 0 });
    setError(null);
  }

  async function toggleFundraiser(item: Fundraiser) {
    setActionId(item.id);
    try {
      await apiRequest(`/api/admin/fundraisers/${item.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: item.status === "ACTIVE" ? "CLOSED" : "ACTIVE" }),
      });
      setRefreshing(true);
      await loadOverview();
    } finally {
      setActionId(null);
    }
  }

  async function toggleMemorial(item: Memorial) {
    setActionId(item.id);
    try {
      await apiRequest(`/api/admin/memorials/${item.id}/visibility`, {
        method: "PATCH",
        body: JSON.stringify({ isPublic: !item.isPublic }),
      });
      setRefreshing(true);
      await loadOverview();
    } finally {
      setActionId(null);
    }
  }

  async function toggleListing(item: Listing) {
    setActionId(item.id);
    try {
      await apiRequest(`/api/admin/listings/${item.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: item.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" }),
      });
      setRefreshing(true);
      await loadOverview();
    } finally {
      setActionId(null);
    }
  }

  async function updateListingImage(item: Listing, imageUrl: string | null) {
    setActionId(item.id);
    try {
      await apiRequest(`/api/admin/listings/${item.id}/image`, {
        method: "PATCH",
        body: JSON.stringify({ imageUrl }),
      });
      setRefreshing(true);
      await loadOverview();
    } finally {
      setActionId(null);
    }
  }

  async function updateListingContact(item: Listing, vendorContact: string) {
    setActionId(item.id);
    try {
      await apiRequest(`/api/admin/listings/${item.id}/contact`, {
        method: "PATCH",
        body: JSON.stringify({ vendorContact }),
      });
      setRefreshing(true);
      await loadOverview();
    } finally {
      setActionId(null);
    }
  }

  async function updateService(
    service: AdminService,
    payload: Partial<Pick<AdminService, "title" | "imageUrl" | "isActive" | "sortOrder">>
  ) {
    setActionId(service.id);
    try {
      await apiRequest(`/api/admin/services/${service.id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      setRefreshing(true);
      await loadOverview();
    } finally {
      setActionId(null);
    }
  }

  async function updateVendorApplicationStatus(
    application: VendorApplication,
    status: "PENDING" | "APPROVED" | "REJECTED"
  ) {
    setActionId(application.id);
    try {
      setError(null);
      await apiRequest(`/api/admin/vendor-applications/${application.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      setRefreshing(true);
      await loadOverview();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update vendor application status");
    } finally {
      setActionId(null);
    }
  }

  async function createListing(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsedPrice = Number(createPrice);
    if (!Number.isInteger(parsedPrice) || parsedPrice <= 0) {
      setError("Price must be a positive number");
      return;
    }

    setCreatingListing(true);

    try {
      await apiRequest("/api/admin/listings", {
        method: "POST",
        body: JSON.stringify({
          categoryId: createCategoryId,
          vendorName: createVendorName.trim(),
          title: createTitle.trim(),
          description: createDescription.trim(),
          vendorContact: createVendorContact.trim() || undefined,
          price: parsedPrice,
          currency: "KES",
          imageUrl: createImageUrl.trim() || undefined,
        }),
      });

      setCreateCategoryId("");
      setCreateVendorName("");
      setCreateTitle("");
      setCreateDescription("");
      setCreateVendorContact("");
      setCreatePrice("");
      setCreateImageUrl("");
      setRefreshing(true);
      await loadOverview();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create listing");
    } finally {
      setCreatingListing(false);
    }
  }

  if (!authenticated) {
    return (
      <main className="container">
        <div className="topbar">
          <div>
            <h1 className="title">Kenfuse Admin</h1>
            <p className="subtitle">Independent admin deployment for platform operations and moderation.</p>
          </div>
        </div>
        <section className="notice">
          <h3>Admin Login</h3>
          <form className="auth-form" onSubmit={handleLogin}>
            <label>
              Email
              <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
            </label>
            <label>
              Password
              <input type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} required />
            </label>
            <label className="small" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <input type="checkbox" checked={showPassword} onChange={(event) => setShowPassword(event.target.checked)} />
              Show password
            </label>
            <button className="primary" type="submit" disabled={loginLoading}>
              {loginLoading ? "Signing In..." : "Sign In"}
            </button>
          </form>
          {error ? <p className="small error-text">{error}</p> : null}
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <aside className="left-rail">
        <div className="rail-brand">
          <h1 className="title">Kenfuse Admin</h1>
          <p className="subtitle">Operations and moderation</p>
        </div>

        <nav className="rail-nav">
          <button className={`tab-btn ${tab === "fundraisers" ? "active" : ""}`} onClick={() => setTab("fundraisers")}>Fundraisers</button>
          <button className={`tab-btn ${tab === "legacy" ? "active" : ""}`} onClick={() => setTab("legacy")}>Legacy & Wills</button>
          <button className={`tab-btn ${tab === "memorials" ? "active" : ""}`} onClick={() => setTab("memorials")}>Memorials</button>
          <button className={`tab-btn ${tab === "marketplace" ? "active" : ""}`} onClick={() => setTab("marketplace")}>Marketplace</button>
          <button className={`tab-btn ${tab === "vendors" ? "active" : ""}`} onClick={() => setTab("vendors")}>Vendor Applications</button>
          <button className={`tab-btn ${tab === "services" ? "active" : ""}`} onClick={() => setTab("services")}>Services</button>
          <button className={`tab-btn ${tab === "activity" ? "active" : ""}`} onClick={() => setTab("activity")}>Activity</button>
          <button className={`tab-btn ${tab === "users" ? "active" : ""}`} onClick={() => setTab("users")}>Users</button>
        </nav>

        <div className="rail-actions">
          <button className="primary" onClick={() => { setRefreshing(true); void loadOverview(); }} disabled={refreshing || loading}>
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
          <button onClick={handleLogout}>Sign Out</button>
        </div>
      </aside>

      <section className="main-area">
        <div className="container">
          {loading ? <div className="notice">Loading dashboard...</div> : null}
          {error ? <div className="notice">{error}. Ensure this account is ADMIN and backend CORS allows this admin origin.</div> : null}

          {!loading && !error ? (
            <>
              <section className="grid">
                <article className="card"><div>Users</div><div className="metric">{stats.users}</div></article>
                <article className="card"><div>Active Fundraisers</div><div className="metric">{stats.activeFundraisers}</div></article>
                <article className="card"><div>Total Raised (KES)</div><div className="metric">{stats.totalRaised.toLocaleString()}</div></article>
                <article className="card"><div>Activity Events</div><div className="metric">{stats.activities}</div></article>
              </section>

              <section className="card progress">
                <h3>Role Summary</h3>
                <p className="small">ADMIN: {rolesSummary.admin} • USER: {rolesSummary.user}</p>
              </section>

              <section className="card progress">
                <h3>Legacy Plan Adoption</h3>
                <div className="progress-track"><div className="progress-bar" style={{ width: `${coverage}%` }} /></div>
                <p className="small">{stats.legacyPlans} of {stats.users} users ({coverage}%)</p>
              </section>

              {tab === "legacy" ? (
                <section className="table-wrap">
                  <table>
                    <thead>
                      <tr><th>User</th><th>Email</th><th>Wishes</th><th>Will/Instructions</th><th>Assets</th><th>Beneficiaries</th><th>Last Updated</th></tr>
                    </thead>
                    <tbody>
                      {legacyPlans.map((plan) => (
                        <tr key={plan.id}>
                          <td>{plan.user.fullName}</td>
                          <td>{plan.user.email}</td>
                          <td><span className={`badge ${plan.hasWishes ? "ok" : "bad"}`}>{plan.hasWishes ? "YES" : "NO"}</span></td>
                          <td><span className={`badge ${plan.hasInstructions ? "ok" : "bad"}`}>{plan.hasInstructions ? "YES" : "NO"}</span></td>
                          <td><span className={`badge ${plan.hasAssets ? "ok" : "bad"}`}>{plan.hasAssets ? "YES" : "NO"}</span></td>
                          <td><span className={`badge ${plan.hasBeneficiaries ? "ok" : "bad"}`}>{plan.hasBeneficiaries ? "YES" : "NO"}</span></td>
                          <td>{new Date(plan.updatedAt).toLocaleString()}</td>
                        </tr>
                      ))}
                      {legacyPlans.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="small">No legacy/will records yet.</td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </section>
              ) : null}

              {tab === "fundraisers" ? (
                <section className="table-wrap">
                  <table>
                    <thead>
                      <tr><th>Title</th><th>Owner</th><th>Progress</th><th>Status</th><th>Action</th></tr>
                    </thead>
                    <tbody>
                      {fundraisers.map((f) => (
                        <tr key={f.id}>
                          <td>{f.title}</td>
                          <td>{f.owner.fullName}</td>
                          <td>{f.currency} {f.totalRaised.toLocaleString()} / {f.targetAmount.toLocaleString()}</td>
                          <td><span className={`badge ${f.status === "ACTIVE" ? "ok" : "bad"}`}>{f.status}</span></td>
                          <td className="row-actions">
                            <button onClick={() => void toggleFundraiser(f)} disabled={actionId === f.id}>{f.status === "ACTIVE" ? "Close" : "Reopen"}</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </section>
              ) : null}

              {tab === "memorials" ? (
                <section className="table-wrap">
                  <table>
                    <thead>
                      <tr><th>Title</th><th>Owner</th><th>Created</th><th>Visibility</th><th>Action</th></tr>
                    </thead>
                    <tbody>
                      {memorials.map((m) => (
                        <tr key={m.id}>
                          <td>{m.title}</td>
                          <td>{m.owner.fullName}</td>
                          <td>{new Date(m.createdAt).toLocaleDateString()}</td>
                          <td><span className={`badge ${m.isPublic ? "ok" : "bad"}`}>{m.isPublic ? "PUBLIC" : "PRIVATE"}</span></td>
                          <td><button onClick={() => void toggleMemorial(m)} disabled={actionId === m.id}>{m.isPublic ? "Make Private" : "Make Public"}</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </section>
              ) : null}

              {tab === "marketplace" ? (
                <>
                  <section className="card">
                    <h3>Create Marketplace Listing</h3>
                    <form className="auth-form" onSubmit={createListing}>
                      <label>
                        Category
                        <select value={createCategoryId} onChange={(event) => setCreateCategoryId(event.target.value)} required>
                          <option value="">Select category</option>
                          {categories.map((category) => (
                            <option key={category.id} value={category.id}>{category.name}</option>
                          ))}
                        </select>
                      </label>
                      <label>
                        Vendor Name
                        <input value={createVendorName} onChange={(event) => setCreateVendorName(event.target.value)} required />
                      </label>
                      <label>
                        Title
                        <input value={createTitle} onChange={(event) => setCreateTitle(event.target.value)} required />
                      </label>
                      <label>
                        Description
                        <input value={createDescription} onChange={(event) => setCreateDescription(event.target.value)} required />
                      </label>
                      <label>
                        Vendor Contact
                        <input
                          value={createVendorContact}
                          onChange={(event) => setCreateVendorContact(event.target.value)}
                          placeholder="+254..."
                          required
                        />
                      </label>
                      <label>
                        Price (KES)
                        <input type="number" min={1} value={createPrice} onChange={(event) => setCreatePrice(event.target.value)} required />
                      </label>
                      <label>
                        Image URL (admin only)
                        <input type="url" value={createImageUrl} onChange={(event) => setCreateImageUrl(event.target.value)} />
                      </label>
                      <button className="primary" type="submit" disabled={creatingListing}>
                        {creatingListing ? "Creating..." : "Create Listing"}
                      </button>
                    </form>
                  </section>

                  <section className="table-wrap">
                    <table>
                      <thead>
                        <tr><th>Title</th><th>Vendor</th><th>Contact</th><th>Category</th><th>Image</th><th>Price</th><th>Status</th><th>Action</th></tr>
                      </thead>
                      <tbody>
                        {listings.map((l) => (
                          <tr key={l.id}>
                            <td>{l.title}</td>
                            <td>{l.vendorName}</td>
                            <td>
                              {(() => {
                                const contact = l.vendorContact ?? getVendorContact(l.vendorName);
                                return <a href={`tel:${contact.replace(/[^\d+]/g, "")}`}>{contact}</a>;
                              })()}
                            </td>
                            <td>{l.category.name}</td>
                            <td>
                              <div className="row-actions">
                                {l.imageUrl ? (
                                  <a href={l.imageUrl} target="_blank" rel="noreferrer">Preview</a>
                                ) : (
                                  <span className="small">No image</span>
                                )}
                              </div>
                            </td>
                            <td>{l.currency} {l.price.toLocaleString()}</td>
                            <td><span className={`badge ${l.status === "ACTIVE" ? "ok" : "bad"}`}>{l.status}</span></td>
                            <td>
                              <div className="row-actions">
                                <button onClick={() => void toggleListing(l)} disabled={actionId === l.id}>
                                  {l.status === "ACTIVE" ? "Disable" : "Activate"}
                                </button>
                                <button
                                  onClick={() => {
                                    const next = window.prompt("Enter vendor contact", l.vendorContact ?? getVendorContact(l.vendorName));
                                    if (next === null) return;
                                    const trimmed = next.trim();
                                    if (!trimmed) return;
                                    void updateListingContact(l, trimmed);
                                  }}
                                  disabled={actionId === l.id}
                                >
                                  Edit Contact
                                </button>
                                <button
                                  onClick={() => {
                                    const next = window.prompt("Enter image URL", l.imageUrl ?? "");
                                    if (next === null) return;
                                    const trimmed = next.trim();
                                    void updateListingImage(l, trimmed ? trimmed : null);
                                  }}
                                  disabled={actionId === l.id}
                                >
                                  {l.imageUrl ? "Update Image" : "Add Image"}
                                </button>
                                {l.imageUrl ? (
                                  <button onClick={() => void updateListingImage(l, null)} disabled={actionId === l.id}>
                                    Remove Image
                                  </button>
                                ) : null}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </section>
                </>
              ) : null}

              {tab === "vendors" ? (
                <section className="table-wrap">
                  <table>
                    <thead>
                      <tr><th>Business</th><th>Owner</th><th>Contact</th><th>Category</th><th>County</th><th>Delivery</th><th>Years</th><th>Status</th><th>Action</th></tr>
                    </thead>
                    <tbody>
                      {vendorApplications.map((application) => (
                        <Fragment key={application.id}>
                          <tr key={application.id}>
                            <td>
                              <strong>{application.businessName}</strong>
                              <div className="small">{application.businessType}</div>
                            </td>
                            <td>
                              <div>{application.ownerFullName}</div>
                              <div className="small">{application.idOrRegistrationNumber}</div>
                            </td>
                            <td>
                              <a href={`mailto:${application.email}`}>{application.email}</a>
                              <div className="small">
                                <a href={`tel:${application.phoneNumber.replace(/[^\d+]/g, "")}`}>{application.phoneNumber}</a>
                              </div>
                            </td>
                            <td>{application.businessCategory}</td>
                            <td>{application.county}</td>
                            <td>{application.offersDelivery ? "Yes" : "No"}</td>
                            <td>{application.yearsInBusiness}</td>
                            <td><span className={`badge ${application.status === "APPROVED" ? "ok" : application.status === "REJECTED" ? "bad" : ""}`}>{application.status}</span></td>
                            <td>
                              <div className="row-actions">
                                <button onClick={() => void updateVendorApplicationStatus(application, "APPROVED")} disabled={actionId === application.id}>Approve</button>
                                <button onClick={() => void updateVendorApplicationStatus(application, "REJECTED")} disabled={actionId === application.id}>Reject</button>
                                <button onClick={() => void updateVendorApplicationStatus(application, "PENDING")} disabled={actionId === application.id}>Reset</button>
                                <button onClick={() => setExpandedVendorId((current) => (current === application.id ? null : application.id))}>
                                  {expandedVendorId === application.id ? "Hide" : "View"}
                                </button>
                              </div>
                            </td>
                          </tr>
                          {expandedVendorId === application.id ? (
                            <tr>
                              <td colSpan={9}>
                                <div className="card" style={{ margin: 0 }}>
                                  <h3>Application Details</h3>
                                  <p className="small"><strong>Description:</strong> {application.businessDescription}</p>
                                  <p className="small"><strong>Physical Address:</strong> {application.physicalAddress ?? "-"}</p>
                                  <p className="small"><strong>WhatsApp:</strong> {application.whatsappNumber ?? "-"}</p>
                                  <p className="small"><strong>Submitted:</strong> {new Date(application.submittedAt).toLocaleString()}</p>
                                  <p className="small"><strong>Reviewed:</strong> {application.reviewedAt ? new Date(application.reviewedAt).toLocaleString() : "-"}</p>
                                  <p className="small"><strong>Review Note:</strong> {application.reviewNote ?? "-"}</p>
                                </div>
                              </td>
                            </tr>
                          ) : null}
                        </Fragment>
                      ))}
                      {vendorApplications.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="small">No vendor applications yet.</td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </section>
              ) : null}

              {tab === "activity" ? (
                <section className="table-wrap">
                  <table>
                    <thead>
                      <tr><th>Event</th><th>Entity</th><th>Reference</th><th>Time</th></tr>
                    </thead>
                    <tbody>
                      {activities.map((a) => (
                        <tr key={a.id}>
                          <td>{a.type}</td>
                          <td>{a.entityType}</td>
                          <td>{a.entityId}</td>
                          <td>{new Date(a.createdAt).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </section>
              ) : null}

              {tab === "services" ? (
                <section className="table-wrap">
                  <table>
                    <thead>
                      <tr><th>Service</th><th>Image</th><th>Status</th><th>Order</th><th>Updated</th><th>Action</th></tr>
                    </thead>
                    <tbody>
                      {services.map((service) => (
                        <tr key={service.id}>
                          <td>{service.title}</td>
                          <td>
                            {service.imageUrl ? (
                              <a href={service.imageUrl} target="_blank" rel="noreferrer">Preview</a>
                            ) : (
                              <span className="small">No image</span>
                            )}
                          </td>
                          <td><span className={`badge ${service.isActive ? "ok" : "bad"}`}>{service.isActive ? "ACTIVE" : "HIDDEN"}</span></td>
                          <td>{service.sortOrder}</td>
                          <td>{service.updatedAt ? new Date(service.updatedAt).toLocaleString() : "-"}</td>
                          <td>
                            <div className="row-actions">
                              <button
                                onClick={() => void updateService(service, { isActive: !service.isActive })}
                                disabled={actionId === service.id}
                              >
                                {service.isActive ? "Hide" : "Show"}
                              </button>
                              <button
                                onClick={() => {
                                  const next = window.prompt("Edit service title", service.title);
                                  if (next === null) return;
                                  const trimmed = next.trim();
                                  if (!trimmed) return;
                                  void updateService(service, { title: trimmed });
                                }}
                                disabled={actionId === service.id}
                              >
                                Edit Title
                              </button>
                              <button
                                onClick={() => {
                                  const next = window.prompt("Enter image URL", service.imageUrl ?? "");
                                  if (next === null) return;
                                  const trimmed = next.trim();
                                  void updateService(service, { imageUrl: trimmed ? trimmed : null });
                                }}
                                disabled={actionId === service.id}
                              >
                                {service.imageUrl ? "Update Image" : "Add Image"}
                              </button>
                              {service.imageUrl ? (
                                <button onClick={() => void updateService(service, { imageUrl: null })} disabled={actionId === service.id}>
                                  Remove Image
                                </button>
                              ) : null}
                              <button
                                onClick={() => {
                                  const next = window.prompt("Sort order (integer)", String(service.sortOrder));
                                  if (next === null) return;
                                  const parsed = Number(next);
                                  if (!Number.isInteger(parsed) || parsed < 0) return;
                                  void updateService(service, { sortOrder: parsed });
                                }}
                                disabled={actionId === service.id}
                              >
                                Set Order
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </section>
              ) : null}

              {tab === "users" ? (
                <section className="table-wrap">
                  <table>
                    <thead>
                      <tr><th>User</th><th>Email</th><th>Role</th><th>Created</th></tr>
                    </thead>
                    <tbody>
                      {users.map((u) => (
                        <tr key={u.id}>
                          <td>{u.fullName}</td>
                          <td>{u.email}</td>
                          <td><span className={`badge ${u.role === "ADMIN" ? "ok" : "bad"}`}>{u.role}</span></td>
                          <td>{new Date(u.createdAt).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </section>
              ) : null}

            </>
          ) : null}
        </div>
      </section>
    </main>
  );
}
