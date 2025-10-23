"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Package, Plus, Pencil, Trash2, AlertTriangle, Calendar, FileText } from "lucide-react";

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

export default function AssetsPage() {
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>("");
  const [loading, setLoading] = useState(true);
  
  // Asset management state
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isAssetDialogOpen, setIsAssetDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [deletingAsset, setDeletingAsset] = useState<Asset | null>(null);
  const [assetFormData, setAssetFormData] = useState<AssetFormData>({
    name: "",
    type: "",
    description: "",
    purchasedate: ""
  });
  const [formError, setFormError] = useState<string>("");

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
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

    if (roleData) {
      setUserRole(roleData.role);
      
      if (roleData.role !== "admin" && roleData.role !== "supervisor") {
        window.location.href = "/dashboard";
        return;
      }
    }

    setLoading(false);
    fetchAssets();
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

  const openCreateDialog = () => {
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

  const openEditDialog = (asset: Asset) => {
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

  const openDeleteDialog = (asset: Asset) => {
    setDeletingAsset(asset);
    setIsDeleteDialogOpen(true);
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

    setIsDeleteDialogOpen(false);
    setDeletingAsset(null);
    fetchAssets();
  };

  const getTypeBadgeColor = (type: string) => {
    // You can customize colors based on asset types
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
    <AdminLayout userEmail={user?.email || ""} userRole={userRole}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Assets Management</h1>
            <p className="text-gray-500 mt-2">Manage all maintenance assets and equipment</p>
          </div>
          <Button onClick={openCreateDialog} className="gap-2">
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
                        <Badge className={getTypeBadgeColor(asset.type)}>
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
                            onClick={() => openEditDialog(asset)}
                            className="hover:bg-blue-50"
                          >
                            <Pencil className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => openDeleteDialog(asset)}
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
      </div>

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
                <Label htmlFor="name" className="text-sm font-medium">
                  Asset Name *
                </Label>
                <Input
                  id="name"
                  placeholder="e.g., HVAC Unit A"
                  value={assetFormData.name}
                  onChange={(e) => setAssetFormData({ ...assetFormData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type" className="text-sm font-medium">
                  Asset Type *
                </Label>
                <Input
                  id="type"
                  placeholder="e.g., Equipment, Vehicle"
                  value={assetFormData.type}
                  onChange={(e) => setAssetFormData({ ...assetFormData, type: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">
                Description
              </Label>
              <Textarea
                id="description"
                placeholder="Enter asset description, model, serial number, location, etc."
                rows={4}
                value={assetFormData.description}
                onChange={(e) => setAssetFormData({ ...assetFormData, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="purchasedate" className="text-sm font-medium">
                Purchase Date
              </Label>
              <Input
                id="purchasedate"
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

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
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
                <Badge className={getTypeBadgeColor(deletingAsset.type)}>
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
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
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
