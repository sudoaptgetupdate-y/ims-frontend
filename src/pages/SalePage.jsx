// src/pages/SalePage.jsx

import { useNavigate } from "react-router-dom";
import axios from "axios";
import useAuthStore from "@/store/authStore";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePaginatedFetch } from "@/hooks/usePaginatedFetch";
import { Badge } from "@/components/ui/badge";

// 1. Import ไอคอน SlidersHorizontal, View, Ban
import { SlidersHorizontal, View, Ban } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function SalePage() {
    const navigate = useNavigate();
    const token = useAuthStore((state) => state.token);
    const currentUser = useAuthStore((state) => state.user);
    const canManage = currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPER_ADMIN';
    const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';

    const { 
        data: sales, 
        pagination, 
        isLoading, 
        searchTerm,
        filters,
        handleSearchChange, 
        handlePageChange, 
        handleItemsPerPageChange,
        handleFilterChange,
        refreshData 
    } = usePaginatedFetch("http://localhost:5001/api/sales", 10, { status: "All" });

    const handleVoidSale = async (saleId) => {
        try {
            await axios.patch(`http://localhost:5001/api/sales/${saleId}/void`, {}, {
                headers: { Authorization: `Bearer ${token}` },
            });
            toast.success("Sale record has been voided!");
            refreshData();
        } catch (error) {
            toast.error(error.response?.data?.error || "Failed to void sale record.");
        }
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Sale Records</CardTitle>
                {canManage && (
                    <Button onClick={() => navigate('/sales/new')}>
                        Create New Sale
                    </Button>
                )}
            </CardHeader>
            <CardContent>
                <div className="flex flex-col sm:flex-row gap-4 mb-4">
                    <Input
                        placeholder="Search by Customer or Seller Name..."
                        value={searchTerm}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        className="flex-grow"
                    />
                    <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                        <SelectTrigger className="w-full sm:w-[180px]">
                            <SelectValue placeholder="Filter by Status..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="All">All Statuses</SelectItem>
                            <SelectItem value="COMPLETED">Completed</SelectItem>
                            <SelectItem value="VOIDED">Voided</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="border rounded-lg overflow-x-auto">
                    <table className="w-full text-sm whitespace-nowrap">
                        <thead>
                            <tr className="border-b">
                                <th className="p-2 text-left">Customer</th>
                                <th className="p-2 text-left">Sale Date</th>
                                <th className="p-2 text-left">Status</th>
                                <th className="p-2 text-center">Items</th>
                                <th className="p-2 text-right">Total (inc. VAT)</th>
                                <th className="p-2 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr><td colSpan="6" className="text-center p-4">Loading...</td></tr>
                            ) : sales.map((sale) => (
                                <tr key={sale.id} className="border-b">
                                    <td className="p-2 text-left">{sale.customer.name}</td>
                                    <td className="p-2 text-left">{new Date(sale.saleDate).toLocaleString()}</td>
                                    <td className="p-2 text-left">
                                        <Badge variant={sale.status === 'VOIDED' ? "destructive" : "default"}>
                                            {sale.status}
                                        </Badge>
                                    </td>
                                    <td className="p-2 text-center">{sale.itemsSold.length}</td>
                                    <td className="p-2 text-right">{sale.total.toLocaleString('en-US')} THB</td>
                                    <td className="p-2 text-center">
                                        <DropdownMenu>
                                            {/* 2. เปลี่ยนปุ่ม Action เป็นแบบ Outline และใช้ไอคอนใหม่ */}
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="outline" size="icon" className="h-8 w-8">
                                                    <span className="sr-only">Open menu</span>
                                                    <SlidersHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem onClick={() => navigate(`/sales/${sale.id}`)}>
                                                    <View className="mr-2 h-4 w-4" /> View Details
                                                </DropdownMenuItem>
                                                
                                                {isSuperAdmin && (
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <DropdownMenuItem
                                                                className="text-red-600 focus:text-red-500"
                                                                disabled={sale.status !== 'COMPLETED'}
                                                                onSelect={(e) => e.preventDefault()}
                                                            >
                                                                <Ban className="mr-2 h-4 w-4" /> Void Sale
                                                            </DropdownMenuItem>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Are you sure you want to void this sale?</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    This action will void sale record (ID: {sale.id}) and return all sold items to stock. This is irreversible.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                <AlertDialogAction onClick={() => handleVoidSale(sale.id)}>Continue</AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </CardContent>
             <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
                 <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Label htmlFor="rows-per-page">Rows per page:</Label>
                    <Select value={String(pagination.itemsPerPage)} onValueChange={handleItemsPerPageChange}>
                        <SelectTrigger id="rows-per-page" className="w-20"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {[10, 20, 50, 100].map(size => (<SelectItem key={size} value={String(size)}>{size}</SelectItem>))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="text-sm text-muted-foreground">
                    Page {pagination.currentPage} of {pagination.totalPages} ({pagination.totalItems} items)
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => handlePageChange(pagination.currentPage - 1)} disabled={!pagination || pagination.currentPage <= 1}>Previous</Button>
                    <Button variant="outline" size="sm" onClick={() => handlePageChange(pagination.currentPage + 1)} disabled={!pagination || pagination.currentPage >= pagination.totalPages}>Next</Button>
                </div>
            </CardFooter>
        </Card>
    );
}