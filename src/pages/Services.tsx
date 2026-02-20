import Layout from "@/components/Layout";
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";

interface ServiceItem {
  id: string;
  title: string;
  imageUrl: string | null;
}

interface ServicesResponse {
  services: ServiceItem[];
}

const Services = () => {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadServices() {
      try {
        setError(null);
        const response = await apiRequest<ServicesResponse>("/api/services");
        setServices(response.services);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load services");
      } finally {
        setLoading(false);
      }
    }

    void loadServices();
  }, []);

  return (
    <Layout>
      <section className="pt-28 pb-20">
        <div className="container mx-auto px-4 lg:px-8 max-w-6xl">
          <div className="text-center mb-12">
            <h1 className="font-display text-4xl sm:text-5xl font-bold text-foreground">Kenfuse Services</h1>
            <p className="mt-4 text-muted-foreground text-lg">
              Find Local Funeral Service Providers by Alphabet.
            </p>
          </div>

          {loading ? <p className="text-muted-foreground text-center">Loading services...</p> : null}
          {error ? <p className="text-red-600 text-center">{error}</p> : null}

          {!loading && !error ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {services.map((service) => (
                <article key={service.id} className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
                  {service.imageUrl ? (
                    <img src={service.imageUrl} alt={service.title} className="h-56 w-full object-cover" loading="lazy" />
                  ) : (
                    <div className="h-56 w-full bg-muted flex items-center justify-center text-sm text-muted-foreground">
                      Service Image Placeholder
                    </div>
                  )}
                  <div className="p-4">
                    <h2 className="font-medium text-foreground">{service.title}</h2>
                  </div>
                </article>
              ))}
            </div>
          ) : null}

          <p className="mt-10 text-center font-display text-2xl text-foreground">
            Created To Ease Your Funeral Planning Needs
          </p>
        </div>
      </section>
    </Layout>
  );
};

export default Services;
