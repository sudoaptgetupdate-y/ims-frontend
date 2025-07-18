// src/pages/CreateAssetAssignmentPage.jsx

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import useAuthStore from "@/store/authStore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { UserCombobox } from "@/components/ui/UserCombobox";

function useDebounce(value, delay) {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => { setDebouncedValue(value); }, delay);
        return () => { clearTimeout(handler); };
    }, [value, delay]);
    return debouncedValue;
}

export default function CreateAssetAssignmentPage() {
    const navigate = useNavigate();
    const token = useAuthStore((state) => state.token);

    const [availableAssets, setAvailableAssets] = useState([]);
    const [selectedUserId, setSelectedUserId] = useState("");
    const [selectedAssets, setSelectedAssets] = useState([]);
    const [assetSearch, setAssetSearch] = useState("");
    const [notes, setNotes] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const debouncedAssetSearch = useDebounce(assetSearch, 500);

    useEffect(() => {
        const fetchAvailableAssets = async () => {
            if (!token) return;
            setIsLoading(true);
            try {
                const response = await axios.get("http://localhost:5001/api/inventory-items", {
                    headers: { Authorization: `Bearer ${token}` },
                    params: { 
                        itemType: 'ASSET',
                        status: 'IN_WAREHOUSE',
                        search: debouncedAssetSearch,
                        limit: 100 
                    }
                });
                
                const selectedIds = new Set(selectedAssets.map(i => i.id));
                const newAvailable = response.data.data.filter(asset => !selectedIds.has(asset.id));
                setAvailableAssets(newAvailable);

            } catch (error) {
                toast.error("Failed to fetch available assets.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchAvailableAssets();
    }, [token, debouncedAssetSearch]);

    const handleAddItem = (assetToAdd) => {
        setSelectedAssets(prev => [...prev, assetToAdd]);
        setAvailableAssets(prev => prev.filter(asset => asset.id !== assetToAdd.id));
    };

    const handleRemoveItem = (assetToRemove) => {
        setSelectedAssets(selectedAssets.filter(asset => asset.id !== assetToRemove.id));
        if (!assetSearch) {
             setAvailableAssets(prev => [assetToRemove, ...prev].sort((a, b) => a.assetCode.localeCompare(b.assetCode)));
        }
    };

    const handleSubmit = async () => {
        if (!selectedUserId) {
            toast.error("Please select an employee.");
            return;
        }
         if (selectedAssets.length === 0) {
            toast.error("Please add at least one asset.");
            return;
        }

        const payload = {
            assigneeId: parseInt(selectedUserId),
            inventoryItemIds: selectedAssets.map(item => item.id),
            notes: notes,
        };

        try {
            const response = await axios.post("http://localhost:5001/api/asset-assignments", payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success("Assignment created successfully!");
            // เด้งไปหน้า Detail ของ Assignment ที่เพิ่งสร้าง
            navigate(`/asset-assignments/${response.data.id}`);
        } catch (error) {
            toast.error(error.response?.data?.error || "Failed to create assignment.");
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
                <CardHeader>
                    <CardTitle>Select Assets to Assign</CardTitle>
                    <CardDescription>Search for available assets in the warehouse.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Input
                        placeholder="Search by Asset Code, S/N, or Product Model..."
                        value={assetSearch}
                        onChange={(e) => setAssetSearch(e.target.value)}
                        className="mb-4"
                    />
                    <div className="h-[500px] overflow-y-auto border rounded-md">
                        <table className="w-full text-sm">
                            <thead className="sticky top-0 bg-slate-100">
                                <tr className="border-b">
                                    <th className="p-2 text-left">Asset Code</th>
                                    <th className="p-2 text-left">Product</th>
                                    <th className="p-2 text-left">Serial No.</th>
                                    <th className="p-2 text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    <tr><td colSpan="4" className="text-center p-4">Searching...</td></tr>
                                ) : availableAssets.map(asset => (
                                    <tr key={asset.id} className="border-b">
                                        <td className="p-2">{asset.assetCode}</td>
                                        <td className="p-2">{asset.productModel.modelNumber}</td>
                                        <td className="p-2">{asset.serialNumber || '-'}</td>
                                        <td className="p-2 text-center">
                                            <Button size="sm" onClick={() => handleAddItem(asset)}>Add</Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader><CardTitle>Assignment Summary</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>Assign To (Employee)</Label>
                        <UserCombobox
                            selectedValue={selectedUserId}
                            onSelect={setSelectedUserId}
                        />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="notes">Notes (Optional)</Label>
                        <Textarea 
                            id="notes"
                            placeholder="Add any relevant notes here..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        />
                    </div>
                    <Separator />
                    <div className="space-y-2">
                        <h4 className="text-sm font-medium">Selected Assets ({selectedAssets.length})</h4>
                        {selectedAssets.length > 0 ? (
                            <div className="h-64 overflow-y-auto space-y-2 pr-2">
                                {selectedAssets.map(asset => (
                                    <div key={asset.id} className="flex justify-between items-center bg-slate-50 p-2 rounded-md">
                                        <div>
                                            <p className="font-semibold">{asset.assetCode}</p>
                                            <p className="text-xs text-slate-500">{asset.productModel.modelNumber}</p>
                                        </div>
                                        <Button variant="destructive" size="sm" onClick={() => handleRemoveItem(asset)}>Remove</Button>
                                    </div>
                                ))}
                            </div>
                        ) : (<p className="text-sm text-slate-500 text-center py-8">No assets selected.</p>)}
                    </div>
                </CardContent>
                <CardFooter>
                    <Button
                        className="w-full"
                        size="lg"
                        onClick={handleSubmit}
                        disabled={!selectedUserId || selectedAssets.length === 0}
                    >
                        Confirm Assignment
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}