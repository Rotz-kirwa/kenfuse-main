import { useEffect, useMemo, useState } from "react";
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

  return (
    <Layout>
      <section className="pt-32 pb-24">
        <div className="w-full px-4 lg:px-8 2xl:px-12">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h1 className="font-display text-4xl sm:text-5xl font-bold text-foreground">Funeral Marketplace</h1>
            <p className="mt-4 text-muted-foreground text-lg">Browse trusted products and services from verified vendors.</p>
          </div>

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
