"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

interface Asset {
  id?: string;
  name: string;
  type: string;
  lastMaintenanceDate?: string;
  nextMaintenanceDate?: string;
}

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [type, setType] = useState("");

  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("assets")
      .select("*")
      .order("nextMaintenanceDate", { ascending: true });
    if (error) {
      console.error(error);
    } else {
      setAssets(data || []);
    }
    setLoading(false);
  };

  const addAsset = async () => {
    if (!name || !type) {
      alert("Please fill in all required fields");
      return;
    }
    const { error } = await supabase.from("assets").insert([{ name, type }]);
    if (error) {
      alert("Error adding asset: " + error.message);
    } else {
      setName("");
      setType("");
      fetchAssets();
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Assets</h1>

      <div className="flex gap-2 mb-6">
        <input
          type="text"
          placeholder="Name"
          className="border rounded p-2 flex-grow"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          type="text"
          placeholder="Type (e.g. Vehicle)"
          className="border rounded p-2 flex-grow"
          value={type}
          onChange={(e) => setType(e.target.value)}
        />
        <button
          onClick={addAsset}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Add
        </button>
      </div>

      {loading ? (
        <p>Loading assets...</p>
      ) : (
        <ul className="space-y-4">
          {assets.map((asset) => (
            <li
              key={asset.id}
              className="border rounded p-4 bg-gray-50 shadow-sm"
            >
              <p className="font-semibold">
                {asset.name} ({asset.type})
              </p>
              <p>
                Next Maintenance:{" "}
                {asset.nextMaintenanceDate
                  ? new Date(asset.nextMaintenanceDate).toLocaleDateString()
                  : "N/A"}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
