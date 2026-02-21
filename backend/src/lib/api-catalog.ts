export interface ApiEndpointInfo {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  access: "public" | "auth" | "admin";
  description: string;
}

export const API_CATALOG: ApiEndpointInfo[] = [
  { method: "GET", path: "/health", access: "public", description: "Health check" },

  { method: "POST", path: "/api/auth/register", access: "public", description: "Register user" },
  { method: "POST", path: "/api/auth/login", access: "public", description: "Login user" },
  { method: "GET", path: "/api/auth/me", access: "auth", description: "Current authenticated user" },

  { method: "GET", path: "/api/legacy-plan/me", access: "auth", description: "Get own legacy plan" },
  { method: "PUT", path: "/api/legacy-plan/me", access: "auth", description: "Create/update own legacy plan" },

  { method: "GET", path: "/api/fundraisers", access: "public", description: "List fundraisers" },
  { method: "GET", path: "/api/fundraisers/:id", access: "public", description: "Fundraiser details (inviteCode query for private/link-only)" },
  { method: "POST", path: "/api/fundraisers", access: "auth", description: "Create fundraiser" },
  { method: "GET", path: "/api/fundraisers/:id/invite", access: "auth", description: "Get invite code/link for own fundraiser" },
  { method: "POST", path: "/api/fundraisers/:id/invite-code/regenerate", access: "auth", description: "Regenerate invite code for own fundraiser" },
  { method: "POST", path: "/api/fundraisers/:id/contributions", access: "public", description: "Create contribution" },

  { method: "GET", path: "/api/memorials", access: "public", description: "List public memorials" },
  { method: "GET", path: "/api/memorials/:id", access: "public", description: "Memorial details" },
  { method: "POST", path: "/api/memorials", access: "auth", description: "Create memorial" },
  { method: "POST", path: "/api/memorials/:id/tributes", access: "public", description: "Create tribute" },

  { method: "GET", path: "/api/marketplace/categories", access: "public", description: "Marketplace categories" },
  { method: "GET", path: "/api/marketplace/listings", access: "public", description: "Marketplace listings" },
  { method: "POST", path: "/api/marketplace/listings", access: "admin", description: "Create listing (admin only)" },
  { method: "POST", path: "/api/marketplace/vendor-applications", access: "public", description: "Submit marketplace vendor application" },

  { method: "GET", path: "/api/activities/me", access: "auth", description: "Own activity feed" },
  { method: "GET", path: "/api/activities/feed", access: "public", description: "Global activity feed" },
  { method: "GET", path: "/api/services", access: "public", description: "Public services directory list" },

  { method: "GET", path: "/api/admin/overview", access: "admin", description: "Admin dashboard data" },
  { method: "POST", path: "/api/admin/listings", access: "admin", description: "Admin create listing" },
  { method: "PATCH", path: "/api/admin/fundraisers/:id/status", access: "admin", description: "Admin update fundraiser status" },
  { method: "PATCH", path: "/api/admin/listings/:id/status", access: "admin", description: "Admin update listing status" },
  { method: "PATCH", path: "/api/admin/listings/:id/image", access: "admin", description: "Admin set/remove listing image" },
  { method: "PATCH", path: "/api/admin/listings/:id/contact", access: "admin", description: "Admin set listing vendor contact" },
  { method: "PATCH", path: "/api/admin/memorials/:id/visibility", access: "admin", description: "Admin update memorial visibility" },
  { method: "GET", path: "/api/admin/services", access: "admin", description: "Admin list services directory items" },
  { method: "PATCH", path: "/api/admin/services/:id", access: "admin", description: "Admin update service title/image/visibility/order" },
  { method: "POST", path: "/api/admin/services/bulk-images", access: "admin", description: "Admin bulk update service images" },
  { method: "GET", path: "/api/admin/vendor-applications", access: "admin", description: "Admin list vendor applications" },
  { method: "PATCH", path: "/api/admin/vendor-applications/:id/status", access: "admin", description: "Admin review vendor application status" },
  { method: "GET", path: "/api/admin/legacy-plans/:id", access: "admin", description: "Admin view full legacy/will record" },

  { method: "GET", path: "/api/meta/endpoints", access: "public", description: "API endpoint catalog with required roles" },
];
