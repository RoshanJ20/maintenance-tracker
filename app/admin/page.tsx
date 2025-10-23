"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Users, ClipboardList, AlertTriangle, CheckCircle, Package, BarChart3, Pencil, Trash2, UserCog, Plus, Calendar, FileText } from "lucide-react";

interface DashboardStats {
  totalUsers: number;
  totalTasks: number;
  overdueTasks: number;
  completedToday: number;
}

interface User {
  id: string;
  email: string;
  name: string | null;
  role: "admin" | "maintainer";
}

interface UserFormData {
  email: string;
  name: string;
  role: "admin" | "maintainer";
}

interface Asset {
  id: string;
  name: string;
  type: string;
  description: string | null;
  purchasedate: string | null;
  created_at: string;
  updated_at: string;
}

interface AssetFormData {
  name: string;
  type: string;
  description: string;
  purchasedate: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>("");
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalTasks: 0,
    overdueTasks: 0,
    completedToday: 0
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "dashboard");
  
  // User management state
  const [users, setUsers] = useState<User[]>([]);
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [userFormData, setUserFormData] = useState<UserFormData>({
    email: "",
    name: "",
    role: "maintainer"
  });
  const [formError, setFormError] = useState<string>("");

  // Asset management state
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isAssetDialogOpen, setIsAssetDialogOpen] = useState(false);
  const [isAssetDeleteDialogOpen, setIsAssetDeleteDialogOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [deletingAsset, setDeletingAsset] = useState<Asset | null>(null);
  const [assetFormData, setAssetFormData] = useState<AssetFormData>({
    name: "",
    type: "",
    description: "",
    purchasedate: ""
  });
  const [assetFormError, setAssetFormError] = useState<string>("");

  useEffect(() => {
    fetchUserAndStats();
  }, []);

  useEffect(() => {
    // Update URL when tab changes (optional, for bookmarkable tabs)
    const newTab = searchParams.get("tab") || "dashboard";
    if (newTab !== activeTab) {
      setActiveTab(newTab);
    }
  }, [searchParams]);

  const fetchUserAndStats = async () => {
    const { data } = await supabase.auth.getSession();
    const currentUser = data.session?.user;
    
    if (!currentUser) {
      window.location.href = "/";
      return;
    }

    setUser(currentUser);

    const { data: roleData } = await supabase
      .from("users")
      .select("role")
      .eq("id", currentUser.id)
      .single();

    if (roleData?.role !== "admin" && roleData?.role !== "supervisor") {
      window.location.href = "/dashboard";
      return;
    }

    setUserRole(roleData.role);

    // Fetch stats
    const [usersCount, tasksCount, overdueCount] = await Promise.all([
      supabase.from("users").select("id", { count: 'exact' }),
      supabase.from("tasks").select("id", { count: 'exact' }),
      supabase
        .from("tasks")
        .select("id", { count: 'exact' })
        .lt("next_due_date", new Date().toISOString().split('T')[0])
    ]);

    setStats({
      totalUsers: usersCount.count || 0,
      totalTasks: tasksCount.count || 0,
      overdueTasks: overdueCount.count || 0,
      completedToday: 0
    });

    setLoading(false);
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    // Update URL without reload
    router.push(`/admin?tab=${value}`, { scroll: false });
    
    // Fetch data when switching tabs
    if (value === "users") {
      fetchUsers();
    } else if (value === "assets") {
      fetchAssets();
    }
  };

  // ===== USER MANAGEMENT FUNCTIONS =====
  
  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .order("role", { ascending: true })
      .order("name", { ascending: true });

    if (error) {
      console.error("Error fetching users:", error);
      return;
    }

    setUsers(data || []);
  };

  const openEditDialog = (user: User) => {
    setEditingUser(user);
    setUserFormData({
      email: user.email || "",
      name: user.name || "",
      role: user.role
    });
    setFormError("");
    setIsUserDialogOpen(true);
  };

  const openDeleteDialog = (user: User) => {
    setDeletingUser(user);
    setIsDeleteDialogOpen(true);
  };

  const handleSaveUser = async () => {
    setFormError("");

    // Validation
    if (!userFormData.name.trim()) {
      setFormError("Name is required");
      return;
    }

    // Update existing user metadata only
    const { error } = await supabase
      .from("users")
      .update({
        name: userFormData.name,
        role: userFormData.role
      })
      .eq("id", editingUser!.id);

    if (error) {
      setFormError(error.message);
      return;
    }

    setIsUserDialogOpen(false);
    fetchUsers();
    fetchUserAndStats(); // Refresh stats
  };

  const handleDeleteUser = async () => {
    if (!deletingUser) return;

    const { error } = await supabase
      .from("users")
      .delete()
      .eq("id", deletingUser.id);

    if (error) {
      console.error("Error deleting user:", error);
      return;
    }

    setIsDeleteDialogOpen(false);
    setDeletingUser(null);
    fetchUsers();
    fetchUserAndStats(); // Refresh stats
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800 border-red-200";
      case "maintainer":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  // ===== ASSET MANAGEMENT FUNCTIONS =====
  
  const fetchAssets = async () => {
    const { data, error } = await supabase
      .from("assets")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching assets:", error);
      return;
    }

    setAssets(data || []);
  };

  const openCreateAssetDialog = () => {
    setEditingAsset(null);
    setAssetFormData({
      name: "",
      type: "",
      description: "",
      purchasedate: ""
    });
    setFormError("");
    setIsAssetDialogOpen(true);
  };

  const openEditAssetDialog = (asset: Asset) => {
    setEditingAsset(asset);
    setAssetFormData({
      name: asset.name,
      type: asset.type,
      description: asset.description || "",
      purchasedate: asset.purchasedate || ""
    });
    setFormError("");
    setIsAssetDialogOpen(true);
  };

  const openDeleteAssetDialog = (asset: Asset) => {
    setDeletingAsset(asset);
    setIsAssetDeleteDialogOpen(true);
  };

  const handleSaveAsset = async () => {
    setFormError("");

    // Validation
    if (!assetFormData.name.trim()) {
      setFormError("Asset name is required");
      return;
    }
    if (!assetFormData.type.trim()) {
      setFormError("Asset type is required");
      return;
    }

    if (editingAsset) {
      // Update existing asset
      const { error } = await supabase
        .from("assets")
        .update({
          name: assetFormData.name,
          type: assetFormData.type,
          description: assetFormData.description || null,
          purchasedate: assetFormData.purchasedate || null
        })
        .eq("id", editingAsset.id);

      if (error) {
        setFormError(error.message);
        return;
      }
    } else {
      // Create new asset
      const { error } = await supabase
        .from("assets")
        .insert({
          name: assetFormData.name,
          type: assetFormData.type,
          description: assetFormData.description || null,
          purchasedate: assetFormData.purchasedate || null
        });

      if (error) {
        setFormError(error.message);
        return;
      }
    }

    setIsAssetDialogOpen(false);
    fetchAssets();
  };

  const handleDeleteAsset = async () => {
    if (!deletingAsset) return;

    const { error } = await supabase
      .from("assets")
      .delete()
      .eq("id", deletingAsset.id);

    if (error) {
      console.error("Error deleting asset:", error);
      return;
    }

    setIsAssetDeleteDialogOpen(false);
    setDeletingAsset(null);
    fetchAssets();
  };

  const getAssetTypeBadgeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      "equipment": "bg-blue-100 text-blue-800 border-blue-200",
      "vehicle": "bg-green-100 text-green-800 border-green-200",
      "building": "bg-purple-100 text-purple-800 border-purple-200",
      "machinery": "bg-orange-100 text-orange-800 border-orange-200",
      "tool": "bg-yellow-100 text-yellow-800 border-yellow-200",
    };
    
    return colors[type.toLowerCase()] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <AdminLayout userEmail={user.email} userRole={userRole}>
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-flex">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Users</span>
          </TabsTrigger>
          <TabsTrigger value="tasks" className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            <span className="hidden sm:inline">Tasks</span>
          </TabsTrigger>
          <TabsTrigger value="assets" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            <span className="hidden sm:inline">Assets</span>
          </TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-6">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
            <p className="text-gray-500 mt-2">Overview of your maintenance system</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalUsers}</div>
                <p className="text-xs text-muted-foreground">Active system users</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
                <ClipboardList className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalTasks}</div>
                <p className="text-xs text-muted-foreground">Maintenance tasks</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Overdue</CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats.overdueTasks}</div>
                <p className="text-xs text-muted-foreground">Need attention</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.completedToday}</div>
                <p className="text-xs text-muted-foreground">Tasks finished</p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest updates across the system</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                No recent activity to display
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Users</h2>
              <p className="text-gray-500 mt-2">Manage user roles and permissions</p>
            </div>
          </div>

          {/* User Stats */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{users.length}</div>
                <p className="text-xs text-muted-foreground">Registered in system</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Administrators</CardTitle>
                <UserCog className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {users.filter(u => u.role === "admin").length}
                </div>
                <p className="text-xs text-muted-foreground">With full access</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Maintainers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {users.filter(u => u.role === "maintainer").length}
                </div>
                <p className="text-xs text-muted-foreground">Task managers</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>All Users</CardTitle>
              <CardDescription>Complete list of system users with their roles and permissions</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                        No users found in the system.
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <UserCog className="h-4 w-4 text-gray-500" />
                            {user.name || "No name"}
                          </div>
                        </TableCell>
                        <TableCell>
                          {user.email}
                        </TableCell>
                        <TableCell>
                          <Badge className={getRoleBadgeColor(user.role)}>
                            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => openEditDialog(user)}
                              className="hover:bg-blue-50"
                            >
                              <Pencil className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => openDeleteDialog(user)}
                              className="hover:bg-red-50 text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tasks Tab */}
        <TabsContent value="tasks" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Tasks</h2>
              <p className="text-gray-500 mt-2">Manage maintenance tasks</p>
            </div>
            <Button>Create Task</Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>All Tasks</CardTitle>
              <CardDescription>View and manage maintenance tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-gray-500">
                Task management interface coming soon...
                <p className="text-sm mt-2">Will include task list, status tracking, and assignments</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Assets Tab */}
        <TabsContent value="assets" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Assets</h2>
              <p className="text-gray-500 mt-2">Manage maintenance assets and equipment</p>
            </div>
            <Button onClick={openCreateAssetDialog} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Asset
            </Button>
          </div>

          {/* Asset Stats */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{assets.length}</div>
                <p className="text-xs text-muted-foreground">Registered assets</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Asset Types</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {new Set(assets.map(a => a.type)).size}
                </div>
                <p className="text-xs text-muted-foreground">Unique categories</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Recent Additions</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {assets.filter(a => {
                    const created = new Date(a.created_at);
                    const thirtyDaysAgo = new Date();
                    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                    return created > thirtyDaysAgo;
                  }).length}
                </div>
                <p className="text-xs text-muted-foreground">Last 30 days</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">With Purchase Date</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {assets.filter(a => a.purchasedate).length}
                </div>
                <p className="text-xs text-muted-foreground">Documented purchases</p>
              </CardContent>
            </Card>
          </div>

          {/* Assets Table */}
          <Card>
            <CardHeader>
              <CardTitle>All Assets</CardTitle>
              <CardDescription>Complete list of maintenance assets and equipment</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Purchase Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assets.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                        No assets found. Click "Add Asset" to create your first asset.
                      </TableCell>
                    </TableRow>
                  ) : (
                    assets.map((asset) => (
                      <TableRow key={asset.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-gray-500" />
                            {asset.name}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getAssetTypeBadgeColor(asset.type)}>
                            {asset.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {asset.description || <span className="text-gray-400 italic">No description</span>}
                        </TableCell>
                        <TableCell>{formatDate(asset.purchasedate)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => openEditAssetDialog(asset)}
                              className="hover:bg-blue-50"
                            >
                              <Pencil className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => openDeleteAssetDialog(asset)}
                              className="hover:bg-red-50 text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* User Dialog */}
      <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5" />
              Edit User
            </DialogTitle>
            <DialogDescription>
              Update user information and permissions
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={userFormData.email}
                disabled
                className="bg-gray-50"
              />
              <p className="text-xs text-gray-500">Email cannot be changed</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">
                Full Name *
              </Label>
              <div className="relative">
                <UserCog className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="name"
                  placeholder="John Doe"
                  className="pl-10"
                  value={userFormData.name}
                  onChange={(e) => setUserFormData({ ...userFormData, name: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="role" className="text-sm font-medium">
                Role *
              </Label>
              <Select
                value={userFormData.role}
                onValueChange={(value) => setUserFormData({ ...userFormData, role: value as "admin" | "maintainer" })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Admin</span>
                      <span className="text-xs text-gray-500">- Full system access</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="maintainer">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Maintainer</span>
                      <span className="text-xs text-gray-500">- Task management only</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">
                {userFormData.role === "admin" 
                  ? "Admins can manage users, assets, and tasks" 
                  : "Maintainers can view and complete maintenance tasks"}
              </p>
            </div>
            {formError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                {formError}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUserDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveUser} className="gap-2">
              <Pencil className="h-4 w-4" />
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Delete User
            </DialogTitle>
            <DialogDescription className="pt-2">
              Are you sure you want to delete <span className="font-semibold">{deletingUser?.name || deletingUser?.email}</span>? 
              This action cannot be undone and will remove all user data.
            </DialogDescription>
          </DialogHeader>
          {deletingUser && (
            <div className="bg-gray-50 border border-gray-200 rounded-md p-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Name:</span>
                <span className="font-medium">{deletingUser.name || "No name"}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Email:</span>
                <span className="font-medium">{deletingUser.email}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Role:</span>
                <Badge className={getRoleBadgeColor(deletingUser.role)}>
                  {deletingUser.role.charAt(0).toUpperCase() + deletingUser.role.slice(1)}
                </Badge>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteUser} className="gap-2">
              <Trash2 className="h-4 w-4" />
              Delete User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Asset Dialog */}
      <Dialog open={isAssetDialogOpen} onOpenChange={setIsAssetDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editingAsset ? <Pencil className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
              {editingAsset ? "Edit Asset" : "Add New Asset"}
            </DialogTitle>
            <DialogDescription>
              {editingAsset 
                ? "Update asset information and details" 
                : "Create a new asset for maintenance tracking"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="asset-name" className="text-sm font-medium">
                  Asset Name *
                </Label>
                <Input
                  id="asset-name"
                  placeholder="e.g., HVAC Unit A"
                  value={assetFormData.name}
                  onChange={(e) => setAssetFormData({ ...assetFormData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="asset-type" className="text-sm font-medium">
                  Asset Type *
                </Label>
                <Input
                  id="asset-type"
                  placeholder="e.g., Equipment, Vehicle"
                  value={assetFormData.type}
                  onChange={(e) => setAssetFormData({ ...assetFormData, type: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="asset-description" className="text-sm font-medium">
                Description
              </Label>
              <Textarea
                id="asset-description"
                placeholder="Enter asset description, model, serial number, location, etc."
                rows={4}
                value={assetFormData.description}
                onChange={(e) => setAssetFormData({ ...assetFormData, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="asset-purchasedate" className="text-sm font-medium">
                Purchase Date
              </Label>
              <Input
                id="asset-purchasedate"
                type="date"
                value={assetFormData.purchasedate}
                onChange={(e) => setAssetFormData({ ...assetFormData, purchasedate: e.target.value })}
              />
            </div>
            {formError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                {formError}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssetDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveAsset} className="gap-2">
              {editingAsset ? (
                <>
                  <Pencil className="h-4 w-4" />
                  Save Changes
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Create Asset
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Asset Dialog */}
      <Dialog open={isAssetDeleteDialogOpen} onOpenChange={setIsAssetDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Delete Asset
            </DialogTitle>
            <DialogDescription className="pt-2">
              Are you sure you want to delete <span className="font-semibold">{deletingAsset?.name}</span>? 
              This will also delete all associated maintenance tasks. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {deletingAsset && (
            <div className="bg-gray-50 border border-gray-200 rounded-md p-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Name:</span>
                <span className="font-medium">{deletingAsset.name}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Type:</span>
                <Badge className={getAssetTypeBadgeColor(deletingAsset.type)}>
                  {deletingAsset.type}
                </Badge>
              </div>
              {deletingAsset.purchasedate && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Purchased:</span>
                  <span className="font-medium">{formatDate(deletingAsset.purchasedate)}</span>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssetDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteAsset} className="gap-2">
              <Trash2 className="h-4 w-4" />
              Delete Asset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
