// src/pages/InventoryPage.jsx

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import useAuthStore from "@/store/authStore";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { usePaginatedFetch } from "@/hooks/usePaginatedFetch";
import { ProductModelCombobox } from "@/components/ui/ProductModelCombobox";

const initialFormData = {
    serialNumber: "",
    macAddress: "",
    productModelId: "",
    status: "IN_STOCK",
};

export default function InventoryPage() {
    const navigate = useNavigate();
    const token = useAuthStore((state) => state.token);
    const currentUser = useAuthStore((state) => state.user);
    const canManage = currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPER_ADMIN';

    const { 
        data: inventoryItems, pagination, isLoading, searchTerm, filters,
        handleSearchChange, handlePageChange, handleItemsPerPageChange, handleFilterChange, refreshData 
    } = usePaginatedFetch("http://localhost:5001/api/inventory-items", 10, { status: "All" });
    
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [formData, setFormData] = useState(initialFormData);
    const [editingItemId, setEditingItemId] = useState(null);
    const [isMacRequired, setIsMacRequired] = useState(true);
    const [isSerialRequired, setIsSerialRequired] = useState(true);
    const [selectedModelInfo, setSelectedModelInfo] = useState(null);

    // === จุดที่แก้ไข 1: เพิ่มสถานะ BORROWED ใน getStatusVariant ===
    const getStatusVariant = (status) => {
        const variants = { 
            IN_STOCK: 'default', 
            SOLD: 'secondary', 
            RESERVED: 'outline', 
            DEFECTIVE: 'destructive',
            BORROWED: 'default' // ใช้สีเดียวกับ IN_STOCK หรือเปลี่ยนเป็นสีอื่นได้
        };
        return variants[status] || 'secondary';
    };
    
    const openDialog = (item = null) => {
        if (item) {
            setIsEditMode(true);
            setEditingItemId(item.id);
            setFormData({
                serialNumber: item.serialNumber, macAddress: item.macAddress || '',
                productModelId: item.productModelId, status: item.status,
            });
            setSelectedModelInfo(item.productModel);
            setIsMacRequired(item.productModel.category.requiresMacAddress);
            setIsSerialRequired(item.productModel.category.requiresSerialNumber);
        } else {
            setIsEditMode(false);
            setFormData(initialFormData);
            setSelectedModelInfo(null);
            setIsMacRequired(true);
            setIsSerialRequired(true);
        }
        setIsDialogOpen(true);
    };

    const handleInputChange = (e) => setFormData({ ...formData, [e.target.id]: e.target.value });

    const handleModelSelect = (model) => {
        if (model) {
            setFormData(prev => ({ ...prev, productModelId: model.id }));
            setSelectedModelInfo(model);
            setIsMacRequired(model.category.requiresMacAddress);
            setIsSerialRequired(model.category.requiresSerialNumber);
             if (!model.category.requiresMacAddress) setFormData(prev => ({ ...prev, macAddress: '' }));
             if (!model.category.requiresSerialNumber) setFormData(prev => ({ ...prev, serialNumber: '' }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.productModelId) {
            toast.error("Please select a Product Model.");
            return;
        }
        if (isSerialRequired && !formData.serialNumber) {
            toast.error("Serial Number is required for this product category.");
            return;
        }
        if (isMacRequired && !formData.macAddress) {
            toast.error("MAC Address is required for this product category.");
            return;
        }
        
        const url = isEditMode ? `http://localhost:5001/api/inventory-items/${editingItemId}` : "http://localhost:5001/api/inventory-items";
        const method = isEditMode ? 'put' : 'post';
        
        const payload = {
            serialNumber: formData.serialNumber || null,
            macAddress: formData.macAddress || null,
            productModelId: parseInt(formData.productModelId, 10),
            status: formData.status,
        };

        try {
            await axios[method](url, payload, { headers: { Authorization: `Bearer ${token}` } });
            toast.success(`Item ${isEditMode ? 'updated' : 'added'} successfully!`);
            refreshData();
            setIsDialogOpen(false);
        } catch (error) {
            toast.error(error.response?.data?.error || `Failed to save item.`);
        }
    };
    
    const handleDelete = async (itemId) => {
        try {
            await axios.delete(`http://localhost:5001/api/inventory-items/${itemId}`, { headers: { Authorization: `Bearer ${token}` } });
            toast.success("Item deleted successfully!");
            refreshData();
        } catch (error) { toast.error(error.response?.data?.error || "Failed to delete item."); }
    };

    const handleSellItem = (itemToSell) => navigate('/sales/new', { state: { initialItems: [itemToSell] } });

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Inventory Item Management</CardTitle>
                 {canManage && <Button onClick={() => openDialog()}>Add Inventory Item</Button>}
            </CardHeader>
            <CardContent>
                <div className="flex flex-col sm:flex-row gap-4 mb-4">
                    <Input 
                        placeholder="Search by Serial, MAC, Model..." 
                        value={searchTerm}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        className="flex-grow"
                    />
                    {/* === จุดที่แก้ไข 2: เพิ่มสถานะ BORROWED ใน Filter === */}
                    <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                        <SelectTrigger className="w-full sm:w-[180px]">
                            <SelectValue placeholder="Filter by Status..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="All">All Statuses</SelectItem>
                            <SelectItem value="IN_STOCK">In Stock</SelectItem>
                            <SelectItem value="SOLD">Sold</SelectItem>
                            <SelectItem value="BORROWED">Borrowed</SelectItem> 
                            <SelectItem value="RESERVED">Reserved</SelectItem>
                            <SelectItem value="DEFECTIVE">Defective</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="border rounded-lg overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="border-b">
                                <th className="p-2 text-left">Serial Number</th>
                                <th className="p-2 text-left">MAC Address</th>
                                <th className="p-2 text-left">Product Model</th>
                                <th className="p-2 text-left">Status</th>
                                <th className="p-2 text-left">Added By</th>
                                <th className="p-2 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr><td colSpan="6" className="text-center p-4">Loading...</td></tr>
                            ) : inventoryItems.length > 0 ? (
                                inventoryItems.map((item) => (
                                    <tr key={item.id} className="border-b">
                                        <td className="p-2 max-w-xs truncate">{item.serialNumber || '-'}</td>
                                        <td className="p-2 max-w-xs truncate">{item.macAddress || '-'}</td>
                                        <td className="p-2">{item.productModel.modelNumber}</td>
                                        <td className="p-2"><Badge variant={getStatusVariant(item.status)}>{item.status}</Badge></td>
                                        <td className="p-2">{item.addedBy.name}</td>
                                        <td className="p-2">
                                            <div className="flex items-center justify-center gap-2">
                                                {/* === จุดที่แก้ไข 3: เพิ่มเงื่อนไขแสดงปุ่มตามสถานะ === */}
                                                {canManage && item.status !== 'SOLD' && item.status !== 'BORROWED' && (
                                                    <Button variant="outline" size="sm" className="w-20" onClick={() => openDialog(item)}>Edit</Button>
                                                )}
                                                {item.status === 'IN_STOCK' && (
                                                    <Button size="sm" className="w-20 bg-green-600 hover:bg-green-700" onClick={() => handleSellItem(item)}>
                                                        Sell
                                                    </Button>
                                                )}
                                                {item.status === 'SOLD' && item.saleId && (
                                                    <Button variant="secondary" size="sm" className="w-20" onClick={() => navigate(`/sales/${item.saleId}`)}>
                                                        Detail
                                                    </Button>
                                                )}
                                                {item.status === 'BORROWED' && item.borrowingId && (
                                                    <Button variant="secondary" size="sm" className="w-20" onClick={() => navigate(`/borrowings/${item.borrowingId}`)}>
                                                        Detail
                                                    </Button>
                                                )}
                                                {canManage && item.status !== 'SOLD' && item.status !== 'BORROWED' && (
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild><Button variant="destructive" size="sm" className="w-20">Delete</Button></AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader><AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete the item: <strong>{item.serialNumber}</strong>.</AlertDialogDescription></AlertDialogHeader>
                                                            <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(item.id)}>Continue</AlertDialogAction></AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan="6" className="text-center p-4">No items found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Label htmlFor="rows-per-page">Rows per page:</Label>
                    <Select value={pagination ? String(pagination.itemsPerPage) : "10"} onValueChange={handleItemsPerPageChange}>
                        <SelectTrigger id="rows-per-page" className="w-20"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {[10, 20, 50, 100].map(size => (<SelectItem key={size} value={String(size)}>{size}</SelectItem>))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="text-sm text-muted-foreground">
                    Page {pagination?.currentPage || 1} of {pagination?.totalPages || 1} ({pagination?.totalItems || 0} items)
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => handlePageChange(pagination.currentPage - 1)} disabled={!pagination || pagination.currentPage <= 1}>Previous</Button>
                    <Button variant="outline" size="sm" onClick={() => handlePageChange(pagination.currentPage + 1)} disabled={!pagination || pagination.currentPage >= pagination.totalPages}>Next</Button>
                </div>
            </CardFooter>
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>{isEditMode ? 'Edit' : 'Add New'} Item</DialogTitle></DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                        <div className="space-y-2">
                             <Label>Product Model</Label>
                             <ProductModelCombobox 
                                onSelect={handleModelSelect}
                                initialModel={selectedModelInfo}
                             />
                        </div>

                        {selectedModelInfo && (
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Category</Label>
                                    <Input value={selectedModelInfo.category.name} disabled />
                                </div>
                                <div className="space-y-2">
                                    <Label>Brand</Label>
                                    <Input value={selectedModelInfo.brand.name} disabled />
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="serialNumber">
                                Serial Number
                                {!isSerialRequired && <span className="text-xs text-slate-500 ml-2">(Optional)</span>}
                            </Label>
                            <Input id="serialNumber" value={formData.serialNumber || ''} onChange={handleInputChange} required={isSerialRequired} />
                        </div>
                        <div className="space-y-2">
                             <Label htmlFor="macAddress">
                                 MAC Address
                                 {!isMacRequired && <span className="text-xs text-slate-500 ml-2">(Optional)</span>}
                             </Label>
                             <Input id="macAddress" value={formData.macAddress || ''} onChange={handleInputChange} required={isMacRequired} />
                        </div>

                        {isEditMode && (
                             <div className="space-y-2">
                                <Label htmlFor="status">Status</Label>
                                <Select onValueChange={(value) => setFormData(prev => ({...prev, status: value}))} value={formData.status}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="IN_STOCK">In Stock</SelectItem>
                                        <SelectItem value="SOLD">Sold</SelectItem>
                                        <SelectItem value="BORROWED">Borrowed</SelectItem>
                                        <SelectItem value="RESERVED">Reserved</SelectItem>
                                        <SelectItem value="DEFECTIVE">Defective</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                        <DialogFooter><Button type="submit">Save</Button></DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </Card>
    );
}