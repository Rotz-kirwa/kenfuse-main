import { FormEvent, useEffect, useMemo, useState } from "react";
import { Search, ShoppingBag } from "lucide-react";
import Layout from "@/components/Layout";
import { apiRequest } from "@/lib/api";
import { toast } from "@/components/ui/sonner";

interface Category {
  id: string;
  name: string;
}

interface Listing {
  id: string;
  vendorName: string;
  vendorContact: string | null;
  title: string;
  description: string;
  imageUrl: string | null;
  price: number;
  currency: string;
  category: Category;
}

interface CategoriesResponse {
  categories: Category[];
}

interface ListingsResponse {
  listings: Listing[];
}

type VendorBusinessType = "INDIVIDUAL" | "REGISTERED_BUSINESS" | "COMPANY";

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

const Marketplace = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategoryId, setFilterCategoryId] = useState<string>("");
  const [vendorOpen, setVendorOpen] = useState(false);
  const [submittingVendor, setSubmittingVendor] = useState(false);
  const [vendorBusinessName, setVendorBusinessName] = useState("");
  const [vendorBusinessType, setVendorBusinessType] = useState<VendorBusinessType>("INDIVIDUAL");
  const [vendorOwnerName, setVendorOwnerName] = useState("");
  const [vendorEmail, setVendorEmail] = useState("");
  const [vendorPhone, setVendorPhone] = useState("");
  const [vendorWhatsapp, setVendorWhatsapp] = useState("");
  const [vendorIdOrReg, setVendorIdOrReg] = useState("");
  const [vendorCategory, setVendorCategory] = useState("");
  const [vendorDescription, setVendorDescription] = useState("");
  const [vendorCounty, setVendorCounty] = useState("");
  const [vendorAddress, setVendorAddress] = useState("");
  const [vendorOffersDelivery, setVendorOffersDelivery] = useState(true);
  const [vendorYearsInBusiness, setVendorYearsInBusiness] = useState("");

  async function loadMarketplace(categoryId?: string) {
    try {
      const [categoriesResponse, listingsResponse] = await Promise.all([
        apiRequest<CategoriesResponse>("/api/marketplace/categories"),
        apiRequest<ListingsResponse>(
          categoryId ? `/api/marketplace/listings?categoryId=${categoryId}` : "/api/marketplace/listings"
        ),
      ]);

      setCategories(categoriesResponse.categories);
      setListings(listingsResponse.listings);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load marketplace");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setLoading(true);
    void loadMarketplace(filterCategoryId || undefined);
  }, [filterCategoryId]);

  const filteredListings = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    if (!search) {
      return listings;
    }

    return listings.filter((listing) => {
      const haystack = `${listing.title} ${listing.vendorName} ${listing.description}`.toLowerCase();
      return haystack.includes(search);
    });
  }, [listings, searchTerm]);

  async function submitVendorApplication(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const years = Number(vendorYearsInBusiness);
    if (!Number.isInteger(years) || years < 0) {
      toast.error("Years in business must be 0 or more");
      return;
    }

    setSubmittingVendor(true);
    try {
      await apiRequest<{ applicationId: string; status: string }>("/api/marketplace/vendor-applications", {
        method: "POST",
        body: JSON.stringify({
          businessName: vendorBusinessName.trim(),
          businessType: vendorBusinessType,
          ownerFullName: vendorOwnerName.trim(),
          email: vendorEmail.trim(),
          phoneNumber: vendorPhone.trim(),
          whatsappNumber: vendorWhatsapp.trim() || undefined,
          idOrRegistrationNumber: vendorIdOrReg.trim(),
          businessCategory: vendorCategory.trim(),
          businessDescription: vendorDescription.trim(),
          county: vendorCounty.trim(),
          physicalAddress: vendorAddress.trim() || undefined,
          offersDelivery: vendorOffersDelivery,
          yearsInBusiness: years,
        }),
      });

      toast.success("Vendor application submitted. Admin will review it.");
      setVendorBusinessName("");
      setVendorBusinessType("INDIVIDUAL");
      setVendorOwnerName("");
      setVendorEmail("");
      setVendorPhone("");
      setVendorWhatsapp("");
      setVendorIdOrReg("");
      setVendorCategory("");
      setVendorDescription("");
      setVendorCounty("");
      setVendorAddress("");
      setVendorOffersDelivery(true);
      setVendorYearsInBusiness("");
      setVendorOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to submit vendor application");
    } finally {
      setSubmittingVendor(false);
    }
  }

  return (
    <Layout>
      <section className="pt-32 pb-24">
        <div className="w-full px-4 lg:px-8 2xl:px-12">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h1 className="font-display text-4xl sm:text-5xl font-bold text-foreground">Funeral Marketplace</h1>
            <p className="mt-4 text-muted-foreground text-lg">Browse trusted products and services from verified vendors.</p>
            <div className="mt-6">
              <button
                className="px-5 py-2.5 rounded-full bg-accent text-accent-foreground hover:opacity-90 transition"
                onClick={() => setVendorOpen((value) => !value)}
              >
                {vendorOpen ? "Close Vendor Application" : "Apply as a Vendor"}
              </button>
            </div>
          </div>

          {vendorOpen ? (
            <section className="max-w-4xl mx-auto mb-10 bg-card border border-border rounded-2xl p-6 shadow-card">
              <h2 className="font-display text-2xl mb-4">Kenfuse Vendor Registration Form</h2>
              <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={submitVendorApplication}>
                <label className="text-sm text-muted-foreground">
                  Business Name *
                  <input className="w-full mt-1 rounded-lg border border-border bg-background px-3 py-2 text-foreground" value={vendorBusinessName} onChange={(event) => setVendorBusinessName(event.target.value)} required />
                </label>
                <label className="text-sm text-muted-foreground">
                  Business Type
                  <select className="w-full mt-1 rounded-lg border border-border bg-background px-3 py-2 text-foreground" value={vendorBusinessType} onChange={(event) => setVendorBusinessType(event.target.value as VendorBusinessType)}>
                    <option value="INDIVIDUAL">Individual</option>
                    <option value="REGISTERED_BUSINESS">Registered Business</option>
                    <option value="COMPANY">Company</option>
                  </select>
                </label>
                <label className="text-sm text-muted-foreground">
                  Owner Full Name *
                  <input className="w-full mt-1 rounded-lg border border-border bg-background px-3 py-2 text-foreground" value={vendorOwnerName} onChange={(event) => setVendorOwnerName(event.target.value)} required />
                </label>
                <label className="text-sm text-muted-foreground">
                  Email *
                  <input type="email" className="w-full mt-1 rounded-lg border border-border bg-background px-3 py-2 text-foreground" value={vendorEmail} onChange={(event) => setVendorEmail(event.target.value)} required />
                </label>
                <label className="text-sm text-muted-foreground">
                  Phone Number *
                  <input className="w-full mt-1 rounded-lg border border-border bg-background px-3 py-2 text-foreground" value={vendorPhone} onChange={(event) => setVendorPhone(event.target.value)} required />
                </label>
                <label className="text-sm text-muted-foreground">
                  WhatsApp Number (optional)
                  <input className="w-full mt-1 rounded-lg border border-border bg-background px-3 py-2 text-foreground" value={vendorWhatsapp} onChange={(event) => setVendorWhatsapp(event.target.value)} />
                </label>
                <label className="text-sm text-muted-foreground">
                  National ID / Registration Number *
                  <input className="w-full mt-1 rounded-lg border border-border bg-background px-3 py-2 text-foreground" value={vendorIdOrReg} onChange={(event) => setVendorIdOrReg(event.target.value)} required />
                </label>
                <label className="text-sm text-muted-foreground">
                  Business Category *
                  <select className="w-full mt-1 rounded-lg border border-border bg-background px-3 py-2 text-foreground" value={vendorCategory} onChange={(event) => setVendorCategory(event.target.value)} required>
                    <option value="">Select category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.name}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm text-muted-foreground md:col-span-2">
                  Business Description *
                  <textarea className="w-full mt-1 rounded-lg border border-border bg-background px-3 py-2 text-foreground min-h-28" value={vendorDescription} onChange={(event) => setVendorDescription(event.target.value)} required />
                </label>
                <label className="text-sm text-muted-foreground">
                  Location (County) *
                  <input className="w-full mt-1 rounded-lg border border-border bg-background px-3 py-2 text-foreground" value={vendorCounty} onChange={(event) => setVendorCounty(event.target.value)} required />
                </label>
                <label className="text-sm text-muted-foreground">
                  Physical Address
                  <input className="w-full mt-1 rounded-lg border border-border bg-background px-3 py-2 text-foreground" value={vendorAddress} onChange={(event) => setVendorAddress(event.target.value)} />
                </label>
                <label className="text-sm text-muted-foreground">
                  Do you offer delivery?
                  <select className="w-full mt-1 rounded-lg border border-border bg-background px-3 py-2 text-foreground" value={vendorOffersDelivery ? "YES" : "NO"} onChange={(event) => setVendorOffersDelivery(event.target.value === "YES")}>
                    <option value="YES">Yes</option>
                    <option value="NO">No</option>
                  </select>
                </label>
                <label className="text-sm text-muted-foreground">
                  Years in business
                  <input type="number" min={0} className="w-full mt-1 rounded-lg border border-border bg-background px-3 py-2 text-foreground" value={vendorYearsInBusiness} onChange={(event) => setVendorYearsInBusiness(event.target.value)} required />
                </label>
                <div className="md:col-span-2">
                  <button className="px-5 py-2.5 rounded-full bg-sage text-sage-foreground hover:opacity-90 transition" type="submit" disabled={submittingVendor}>
                    {submittingVendor ? "Submitting..." : "Submit Vendor Application"}
                  </button>
                </div>
              </form>
            </section>
          ) : null}

          <div className="max-w-2xl mx-auto mb-8">
            <div className="flex items-center gap-3 bg-card rounded-xl border border-border p-3 shadow-card">
              <Search size={20} className="text-muted-foreground" />
              <input
                type="text"
                placeholder="Search products and services..."
                className="flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-3 mb-10">
            <button
              className={`px-4 py-2 rounded-full text-sm transition-colors ${
                filterCategoryId === "" ? "bg-sage text-sage-foreground" : "bg-muted text-muted-foreground hover:bg-sage-light"
              }`}
              onClick={() => setFilterCategoryId("")}
            >
              All
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                className={`px-4 py-2 rounded-full text-sm transition-colors ${
                  filterCategoryId === category.id
                    ? "bg-sage text-sage-foreground"
                    : "bg-muted text-muted-foreground hover:bg-sage-light"
                }`}
                onClick={() => setFilterCategoryId(category.id)}
              >
                {category.name}
              </button>
            ))}
          </div>

          <div className="space-y-6">
            <h2 className="font-display text-3xl">Listings</h2>
            {loading ? (
              <p className="text-muted-foreground">Loading listings...</p>
            ) : filteredListings.length === 0 ? (
              <div className="text-center py-14 bg-card border border-border rounded-xl">
                <ShoppingBag size={40} className="text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">No listings match your current filters.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredListings.map((listing) => (
                  <article key={listing.id} className="bg-card border border-border rounded-xl p-5 shadow-card">
                    {(() => {
                      const contact = listing.vendorContact ?? getVendorContact(listing.vendorName);
                      const telHref = `tel:${contact.replace(/[^\d+]/g, "")}`;

                      return (
                        <>
                    {listing.imageUrl ? (
                      <img
                        src={listing.imageUrl}
                        alt={listing.title}
                        className="w-full h-80 md:h-96 lg:h-[30rem] object-cover rounded-lg mb-4 border border-border"
                        loading="lazy"
                      />
                    ) : null}
                    <p className="text-xs text-muted-foreground mb-2">{listing.category.name}</p>
                    <h3 className="font-display text-xl mb-1">{listing.title}</h3>
                    <p className="text-sm text-muted-foreground mb-3">By {listing.vendorName}</p>
                    <p className="text-sm text-muted-foreground mb-4">{listing.description}</p>
                    <p className="text-sm text-muted-foreground mb-3">
                      Contact:{" "}
                      <a className="text-accent hover:underline" href={telHref}>
                        {contact}
                      </a>
                    </p>
                    <p className="font-semibold">
                      {listing.currency} {listing.price.toLocaleString()}
                    </p>
                        </>
                      );
                    })()}
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Marketplace;
