import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Activity, BarChart3, ShieldAlert, Users, WalletCards } from "lucide-react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { apiRequest } from "@/lib/api";
import { authHeader, getSessionUser, isLoggedIn } from "@/lib/session";
import { toast } from "@/components/ui/sonner";

interface AdminStats {
  users: number;
  legacyPlans: number;
  activeFundraisers: number;
  totalRaised: number;
  memorials: number;
  activeListings: number;
  activities: number;
}

interface AdminActivity {
  id: string;
  type: string;
  entityType: string;
  entityId: string;
  createdAt: string;
}

interface AdminFundraiser {
  id: string;
  title: string;
  status: "ACTIVE" | "CLOSED";
  totalRaised: number;
  targetAmount: number;
  currency: string;
  owner: { fullName: string };
}

interface AdminMemorial {
  id: string;
  title: string;
  isPublic: boolean;
  owner: { fullName: string };
  createdAt: string;
}

interface AdminListing {
  id: string;
  title: string;
  vendorName: string;
  status: "ACTIVE" | "INACTIVE";
  category: { name: string };
  price: number;
  currency: string;
}

interface AdminOverviewResponse {
  stats: AdminStats;
  recentActivities: AdminActivity[];
  fundraiserList: AdminFundraiser[];
  memorialList: AdminMemorial[];
  listingList: AdminListing[];
}

const emptyStats: AdminStats = {
  users: 0,
  legacyPlans: 0,
  activeFundraisers: 0,
  totalRaised: 0,
  memorials: 0,
  activeListings: 0,
  activities: 0,
};

const Admin = () => {
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<AdminStats>(emptyStats);
  const [recentActivities, setRecentActivities] = useState<AdminActivity[]>([]);
  const [fundraisers, setFundraisers] = useState<AdminFundraiser[]>([]);
  const [memorials, setMemorials] = useState<AdminMemorial[]>([]);
  const [listings, setListings] = useState<AdminListing[]>([]);
  const [actionId, setActionId] = useState<string | null>(null);

  const loggedIn = isLoggedIn();

  async function verifyAdminAccess() {
    if (!loggedIn) {
      setCheckingAccess(false);
      return;
    }

    try {
      const me = await apiRequest<{ user: { role: string } }>("/api/auth/me", {
        headers: authHeader(),
      });
      setIsAdmin(me.user.role === "ADMIN");
    } catch {
      setIsAdmin(false);
    } finally {
      setCheckingAccess(false);
    }
  }

  async function loadOverview() {
    if (!loggedIn || !isAdmin) {
      setLoading(false);
      return;
    }

    try {
      const response = await apiRequest<AdminOverviewResponse>("/api/admin/overview", {
        headers: authHeader(),
      });

      setStats(response.stats);
      setRecentActivities(response.recentActivities);
      setFundraisers(response.fundraiserList);
      setMemorials(response.memorialList);
      setListings(response.listingList);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load admin dashboard");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void verifyAdminAccess();
  }, []);

  useEffect(() => {
    if (!checkingAccess) {
      void loadOverview();
    }
  }, [checkingAccess, isAdmin]);

  const legacyPlanCoverage = useMemo(() => {
    if (!stats.users) {
      return 0;
    }

    return Math.round((stats.legacyPlans / stats.users) * 100);
  }, [stats]);

  async function updateFundraiserStatus(item: AdminFundraiser) {
    const nextStatus = item.status === "ACTIVE" ? "CLOSED" : "ACTIVE";
    setActionId(item.id);

    try {
      await apiRequest(`/api/admin/fundraisers/${item.id}/status`, {
        method: "PATCH",
        headers: authHeader(),
        body: JSON.stringify({ status: nextStatus }),
      });
      toast.success(`Fundraiser set to ${nextStatus}`);
      setRefreshing(true);
      await loadOverview();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update fundraiser status");
    } finally {
      setActionId(null);
    }
  }

  async function updateListingStatus(item: AdminListing) {
    const nextStatus = item.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    setActionId(item.id);

    try {
      await apiRequest(`/api/admin/listings/${item.id}/status`, {
        method: "PATCH",
        headers: authHeader(),
        body: JSON.stringify({ status: nextStatus }),
      });
      toast.success(`Listing set to ${nextStatus}`);
      setRefreshing(true);
      await loadOverview();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update listing status");
    } finally {
      setActionId(null);
    }
  }

  async function updateMemorialVisibility(item: AdminMemorial) {
    setActionId(item.id);

    try {
      await apiRequest(`/api/admin/memorials/${item.id}/visibility`, {
        method: "PATCH",
        headers: authHeader(),
        body: JSON.stringify({ isPublic: !item.isPublic }),
      });
      toast.success(`Memorial visibility updated`);
      setRefreshing(true);
      await loadOverview();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update memorial visibility");
    } finally {
      setActionId(null);
    }
  }

  const sessionUser = getSessionUser();

  return (
    <Layout>
      <section className="pt-28 pb-20">
        <div className="container mx-auto px-4 lg:px-8 max-w-7xl space-y-8">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-accent font-medium">Admin Console</p>
              <h1 className="font-display text-4xl sm:text-5xl text-foreground">Site Management Dashboard</h1>
              <p className="mt-3 text-muted-foreground max-w-2xl">
                Monitor platform health, moderate user-generated content, and control fundraiser, memorial, and marketplace visibility.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="secondary">{sessionUser?.email ?? "No session"}</Badge>
              <Button
                variant="outline"
                onClick={() => {
                  setRefreshing(true);
                  void loadOverview();
                }}
                disabled={refreshing || loading}
              >
                {refreshing ? "Refreshing..." : "Refresh Data"}
              </Button>
            </div>
          </div>

          {checkingAccess ? (
            <Card>
              <CardContent className="pt-6 text-muted-foreground">Checking access...</CardContent>
            </Card>
          ) : !loggedIn ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><ShieldAlert size={18} /> Admin Sign In Required</CardTitle>
                <CardDescription>You need to sign in with an admin account.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild><Link to="/auth">Go To Sign In</Link></Button>
              </CardContent>
            </Card>
          ) : !isAdmin ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><ShieldAlert size={18} /> Access Denied</CardTitle>
                <CardDescription>Your account does not have admin privileges.</CardDescription>
              </CardHeader>
            </Card>
          ) : loading ? (
            <Card>
              <CardContent className="pt-6 text-muted-foreground">Loading dashboard...</CardContent>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                <Card>
                  <CardHeader>
                    <CardDescription>Total Users</CardDescription>
                    <CardTitle className="text-3xl flex items-center gap-2"><Users size={22} /> {stats.users}</CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader>
                    <CardDescription>Active Fundraisers</CardDescription>
                    <CardTitle className="text-3xl">{stats.activeFundraisers}</CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader>
                    <CardDescription>Total Raised</CardDescription>
                    <CardTitle className="text-3xl flex items-center gap-2"><WalletCards size={22} /> KES {stats.totalRaised.toLocaleString()}</CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader>
                    <CardDescription>Platform Activity Events</CardDescription>
                    <CardTitle className="text-3xl flex items-center gap-2"><Activity size={22} /> {stats.activities}</CardTitle>
                  </CardHeader>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2"><BarChart3 size={18} /> Legacy Plan Adoption</CardTitle>
                  <CardDescription>{stats.legacyPlans} of {stats.users} users created a plan</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Progress value={legacyPlanCoverage} />
                  <p className="text-sm text-muted-foreground">Coverage: {legacyPlanCoverage}%</p>
                </CardContent>
              </Card>

              <Tabs defaultValue="fundraisers" className="w-full">
                <TabsList className="grid grid-cols-4 h-auto w-full">
                  <TabsTrigger value="fundraisers">Fundraisers</TabsTrigger>
                  <TabsTrigger value="memorials">Memorials</TabsTrigger>
                  <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
                  <TabsTrigger value="activity">Activity Feed</TabsTrigger>
                </TabsList>

                <TabsContent value="fundraisers">
                  <Card>
                    <CardHeader>
                      <CardTitle>Fundraiser Moderation</CardTitle>
                      <CardDescription>Close or reopen campaign visibility</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Title</TableHead>
                            <TableHead>Owner</TableHead>
                            <TableHead>Progress</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {fundraisers.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell className="font-medium">{item.title}</TableCell>
                              <TableCell>{item.owner.fullName}</TableCell>
                              <TableCell>{item.currency} {item.totalRaised.toLocaleString()} / {item.targetAmount.toLocaleString()}</TableCell>
                              <TableCell>
                                <Badge variant={item.status === "ACTIVE" ? "default" : "secondary"}>{item.status}</Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button size="sm" variant="outline" onClick={() => void updateFundraiserStatus(item)} disabled={actionId === item.id}>
                                  {item.status === "ACTIVE" ? "Close" : "Reopen"}
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="memorials">
                  <Card>
                    <CardHeader>
                      <CardTitle>Memorial Moderation</CardTitle>
                      <CardDescription>Set memorial pages public or private</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Title</TableHead>
                            <TableHead>Owner</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead>Visibility</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {memorials.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell className="font-medium">{item.title}</TableCell>
                              <TableCell>{item.owner.fullName}</TableCell>
                              <TableCell>{new Date(item.createdAt).toLocaleDateString()}</TableCell>
                              <TableCell>
                                <Badge variant={item.isPublic ? "default" : "secondary"}>{item.isPublic ? "PUBLIC" : "PRIVATE"}</Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button size="sm" variant="outline" onClick={() => void updateMemorialVisibility(item)} disabled={actionId === item.id}>
                                  {item.isPublic ? "Make Private" : "Make Public"}
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="marketplace">
                  <Card>
                    <CardHeader>
                      <CardTitle>Marketplace Moderation</CardTitle>
                      <CardDescription>Activate or disable listings</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Title</TableHead>
                            <TableHead>Vendor</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Price</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {listings.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell className="font-medium">{item.title}</TableCell>
                              <TableCell>{item.vendorName}</TableCell>
                              <TableCell>{item.category.name}</TableCell>
                              <TableCell>{item.currency} {item.price.toLocaleString()}</TableCell>
                              <TableCell>
                                <Badge variant={item.status === "ACTIVE" ? "default" : "secondary"}>{item.status}</Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button size="sm" variant="outline" onClick={() => void updateListingStatus(item)} disabled={actionId === item.id}>
                                  {item.status === "ACTIVE" ? "Disable" : "Activate"}
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="activity">
                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Activity Feed</CardTitle>
                      <CardDescription>Latest 20 platform events</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {recentActivities.map((item, index) => (
                        <div key={item.id} className="space-y-3">
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-1">
                            <div className="text-sm font-medium">{item.type}</div>
                            <div className="text-xs text-muted-foreground">{new Date(item.createdAt).toLocaleString()}</div>
                          </div>
                          <p className="text-xs text-muted-foreground">{item.entityType} • {item.entityId}</p>
                          {index !== recentActivities.length - 1 ? <Separator /> : null}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default Admin;
