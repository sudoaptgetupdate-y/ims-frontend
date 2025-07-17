// src/pages/CreateSalePage.jsx

import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import useAuthStore from "@/store/authStore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { CustomerCombobox } from "@/components/ui/CustomerCombobox";

// Debounce hook to prevent API calls on every keystroke
function useDebounce(value, delay) {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => { setDebouncedValue(value); }, delay);
        return () => { clearTimeout(handler); };
    }, [value, delay]);
    return debouncedValue;
}

export default function CreateSalePage() {
    const navigate = useNavigate();
    const token = useAuthStore((state) => state.token);
    const location = useLocation();
    
    // ตั้งค่า state เริ่มต้นจาก location state หากมี
    const initialItemsFromState = location.state?.initialItems || [];
    const [availableItems, setAvailableItems] = useState([]);
    const [selectedItems, setSelectedItems] = useState(initialItemsFromState);
    
    const [selectedCustomerId, setSelectedCustomerId] = useState("");
    const [itemSearch, setItemSearch] = useState("");
    const debouncedItemSearch = useDebounce(itemSearch, 500);

    // useEffect สำหรับดึงข้อมูลสินค้าคงคลัง
    useEffect(() => {
        const fetchInventory = async () => {
            if (!token) return;
            try {
                const inventoryRes = await axios.get("http://localhost:5001/api/inventory-items", {
                    headers: { Authorization: `Bearer ${token}` },
                    params: { 
                        all: 'true',
                        search: debouncedItemSearch
                    }
                });
                
                // กรองรายการสินค้าที่ถูกเลือกไปแล้วออกจากรายการที่แสดงให้เลือก
                const selectedIds = new Set(selectedItems.map(i => i.id));
                setAvailableItems(inventoryRes.data.filter(item => !selectedIds.has(item.id)));

            } catch (error) {
                toast.error("Failed to fetch inventory items.");
            }
        };
        fetchInventory();
    }, [token, debouncedItemSearch]); // เอา selectedItems ออก เพื่อไม่ให้ re-fetch ทุกครั้งที่เพิ่ม/ลบ

    const handleAddItem = (itemToAdd) => {
        // เพิ่มในรายการที่เลือก
        setSelectedItems(prev => [...prev, itemToAdd]);
        // ลบออกจากรายการที่ว่าง
        setAvailableItems(prev => prev.filter(item => item.id !== itemToAdd.id));
    };

    const handleRemoveItem = (itemToRemove) => {
        // ลบออกจากรายการที่เลือก
        setSelectedItems(prev => prev.filter(item => item.id !== itemToRemove.id));
        // เพิ่มกลับเข้ารายการที่ว่าง (ถ้าไม่มีการค้นหา)
        if (!itemSearch) {
            setAvailableItems(prev => [itemToRemove, ...prev]);
        }
    };

    const handleSubmitSale = async () => {
        if (!selectedCustomerId) {
            toast.error("Please select a customer.");
            return;
        }
         if (selectedItems.length === 0) {
            toast.error("Please add at least one item to the sale.");
            return;
        }
        const payload = {
            customerId: parseInt(selectedCustomerId),
            inventoryItemIds: selectedItems.map(item => item.id),
        };
        try {
            await axios.post("http://localhost:5001/api/sales", payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success("Sale created successfully!");
            navigate("/sales");
        } catch (error) {
            toast.error(error.response?.data?.error || "Failed to create sale.");
        }
    };
    
    const subtotal = selectedItems.reduce((total, item) => total + (item.productModel?.sellingPrice || 0), 0);
    const vatAmount = subtotal * 0.07;
    const total = subtotal + vatAmount;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
                <CardHeader>
                    <CardTitle>Select Items to Sell</CardTitle>
                    <CardDescription>Search for available items and add them to the sale.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Input
                        placeholder="Search by Serial No, MAC, or Product Model..."
                        value={itemSearch}
                        onChange={(e) => setItemSearch(e.target.value)}
                        className="mb-4"
                    />
                    <div className="h-96 overflow-y-auto border rounded-md">
                        <table className="w-full text-sm">
                            <thead className="sticky top-0 bg-slate-100">
                                <tr className="border-b">
                                    <th className="p-2 text-left">Category</th>
                                    <th className="p-2 text-left">Brand</th>
                                    <th className="p-2 text-left">Product</th>
                                    <th className="p-2 text-left">Serial No.</th>
                                    <th className="p-2 text-right">Price (Pre-VAT)</th>
                                    <th className="p-2 text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {availableItems.map(item => (
                                    <tr key={item.id} className="border-b">
                                        <td className="p-2">{item.productModel.category.name}</td>
                                        <td className="p-2">{item.productModel.brand.name}</td>
                                        <td className="p-2">{item.productModel.modelNumber}</td>
                                        <td className="p-2">{item.serialNumber || '-'}</td>
                                        <td className="p-2 text-right">{item.productModel.sellingPrice.toLocaleString()}</td>
                                        <td className="p-2 text-center"><Button size="sm" onClick={() => handleAddItem(item)}>Add</Button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader><CardTitle>Sale Summary</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>Customer</Label>
                        <CustomerCombobox
                            selectedValue={selectedCustomerId}
                            onSelect={setSelectedCustomerId}
                        />
                    </div>
                    <Separator />
                    <div className="space-y-2">
                        <h4 className="text-sm font-medium">Selected Items ({selectedItems.length})</h4>
                        {selectedItems.length > 0 ? (
                            <div className="h-48 overflow-y-auto space-y-2 pr-2">
                                {selectedItems.map(item => (
                                    <div key={item.id} className="flex justify-between items-center bg-slate-50 p-2 rounded-md">
                                        <div>
                                            <p className="font-semibold">{item.productModel.modelNumber}</p>
                                            <p className="text-xs text-slate-500">{item.serialNumber || 'No S/N'}</p>
                                        </div>
                                        <Button variant="destructive" size="sm" onClick={() => handleRemoveItem(item)}>Remove</Button>
                                    </div>
                                ))}
                            </div>
                        ) : (<p className="text-sm text-slate-500 text-center py-8">No items selected.</p>)}
                    </div>
                </CardContent>
                <CardFooter className="flex-col items-stretch space-y-4">
                    <Separator />
                    <div className="flex justify-between text-sm text-slate-600">
                        <span>Subtotal</span>
                        <span>{subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })} THB</span>
                    </div>
                    <div className="flex justify-between text-sm text-slate-600">
                        <span>VAT (7%)</span>
                        <span>{vatAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })} THB</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg">
                        <span>Total Price</span>
                        <span>{total.toLocaleString('en-US', { minimumFractionDigits: 2 })} THB</span>
                    </div>
                    <Button
                        size="lg"
                        onClick={handleSubmitSale}
                        disabled={!selectedCustomerId || selectedItems.length === 0}
                    >
                        Submit Sale
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}