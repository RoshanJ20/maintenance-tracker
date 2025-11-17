"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ClipboardList, Pencil, Trash2 } from "lucide-react";

interface Asset {
  id: string;
  name: string;
}

interface Task {
  id: string;
  asset_id: string | null;
  task_name: string;
  last_done_date: string | null;
  next_due_date: string | null;
  frequency_days: number | null;
}

export default function TasksPage() {
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [userRole, setUserRole] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const [assets, setAssets] = useState<Asset[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);

  // Sorting: default by asset name ascending
  const [tasksSortBy, setTasksSortBy] = useState<string>("asset");
  const [tasksSortAsc, setTasksSortAsc] = useState<boolean>(true);

  useEffect(() => {
    (async () => {
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
          window.location.href = "/";
          return;
        }
      }

      // fetch assets and tasks
      await Promise.all([fetchAssets(), fetchTasks()]);

      setLoading(false);
    })();
  }, []);

  const fetchAssets = async () => {
    const { data, error } = await supabase.from("assets").select("id, name");
    if (error) {
      console.error("Error fetching assets:", error);
      return;
    }
    setAssets(data || []);
  };

  const fetchTasks = async () => {
    const { data, error } = await supabase.from("tasks").select("*");
    if (error) {
      console.error("Error fetching tasks:", error);
      return;
    }
    setTasks(data || []);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getTaskStatusColor = (nextDueDate: string | null) => {
    if (!nextDueDate) return "bg-gray-100 text-gray-800 border-gray-200";
    const today = new Date();
    today.setHours(0,0,0,0);
    const dueDate = new Date(nextDueDate);
    dueDate.setHours(0,0,0,0);
    const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000*60*60*24));
    if (diffDays < 0) return "bg-red-100 text-red-800 border-red-200";
    if (diffDays <= 7) return "bg-yellow-100 text-yellow-800 border-yellow-200";
    return "bg-green-100 text-green-800 border-green-200";
  };

  const getTaskStatusText = (nextDueDate: string | null) => {
    if (!nextDueDate) return "Not scheduled";
    const today = new Date();
    today.setHours(0,0,0,0);
    const dueDate = new Date(nextDueDate);
    dueDate.setHours(0,0,0,0);
    const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000*60*60*24));
    if (diffDays < 0) return `Overdue by ${Math.abs(diffDays)} days`;
    if (diffDays === 0) return "Due today";
    return `Due in ${diffDays} days`;
  };

  const getAssetName = (assetId: string | null) => {
    if (!assetId) return "No asset";
    const a = assets.find(x => x.id === assetId);
    return a ? a.name : "Unknown";
  };

  const handleTasksSort = (column: string) => {
    if (tasksSortBy === column) {
      setTasksSortAsc(!tasksSortAsc);
    } else {
      setTasksSortBy(column);
      setTasksSortAsc(true);
    }
  };

  const sortedTasks = [...tasks].sort((a, b) => {
    const col = tasksSortBy;
    const getString = (s: string | null | undefined) => (s ? s.toLowerCase() : "");
    let res = 0;
    if (col === "asset") {
      const va = getAssetName(a.asset_id);
      const vb = getAssetName(b.asset_id);
      res = getString(va).localeCompare(getString(vb));
    } else if (col === "task_name") {
      res = getString(a.task_name).localeCompare(getString(b.task_name));
    } else if (col === "next_due") {
      const ta = a.next_due_date ? new Date(a.next_due_date).getTime() : Number.POSITIVE_INFINITY;
      const tb = b.next_due_date ? new Date(b.next_due_date).getTime() : Number.POSITIVE_INFINITY;
      res = ta === tb ? 0 : (ta < tb ? -1 : 1);
    } else if (col === "frequency") {
      const fa = a.frequency_days ?? Number.POSITIVE_INFINITY;
      const fb = b.frequency_days ?? Number.POSITIVE_INFINITY;
      res = fa === fb ? 0 : (fa < fb ? -1 : 1);
    }
    return tasksSortAsc ? res : -res;
  });

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
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tasks Management</h1>
          <p className="text-gray-500 mt-2">Manage all maintenance tasks</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <ClipboardList className="h-5 w-5 mr-2" />
              Tasks Overview
            </CardTitle>
            <CardDescription>
              View and manage all maintenance tasks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead aria-sort={tasksSortBy === 'task_name' ? (tasksSortAsc ? 'ascending' : 'descending') : 'none'}>
                    <button className="flex items-center gap-2" onClick={() => handleTasksSort('task_name')}>
                      Task Name{tasksSortBy === 'task_name' ? (tasksSortAsc ? ' ▲' : ' ▼') : ''}
                    </button>
                  </TableHead>
                  <TableHead aria-sort={tasksSortBy === 'asset' ? (tasksSortAsc ? 'ascending' : 'descending') : 'none'}>
                    <button className="flex items-center gap-2" onClick={() => handleTasksSort('asset')}>
                      Asset{tasksSortBy === 'asset' ? (tasksSortAsc ? ' ▲' : ' ▼') : ''}
                    </button>
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead aria-sort={tasksSortBy === 'next_due' ? (tasksSortAsc ? 'ascending' : 'descending') : 'none'}>
                    <button className="flex items-center gap-2" onClick={() => handleTasksSort('next_due')}>
                      Next Due{tasksSortBy === 'next_due' ? (tasksSortAsc ? ' ▲' : ' ▼') : ''}
                    </button>
                  </TableHead>
                  <TableHead aria-sort={tasksSortBy === 'frequency' ? (tasksSortAsc ? 'ascending' : 'descending') : 'none'}>
                    <button className="flex items-center gap-2" onClick={() => handleTasksSort('frequency')}>
                      Frequency{tasksSortBy === 'frequency' ? (tasksSortAsc ? ' ▲' : ' ▼') : ''}
                    </button>
                  </TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedTasks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      No tasks found. Create tasks in the admin dashboard.
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedTasks.map(task => (
                    <TableRow key={task.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <ClipboardList className="h-4 w-4 text-gray-500" />
                          {task.task_name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-600">{getAssetName(task.asset_id)}</div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getTaskStatusColor(task.next_due_date)}>{getTaskStatusText(task.next_due_date)}</Badge>
                      </TableCell>
                      <TableCell>{formatDate(task.next_due_date)}</TableCell>
                      <TableCell>{task.frequency_days ? `Every ${task.frequency_days} days` : 'Not set'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" className="hover:bg-blue-50">
                            <Pencil className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button variant="outline" size="sm" className="hover:bg-red-50 text-red-600 hover:text-red-700">
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
    </AdminLayout>
  );
}
