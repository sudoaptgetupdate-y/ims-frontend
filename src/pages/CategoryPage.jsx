// src/pages/CategoryPage.jsx

import { useState } from "react";
import axios from "axios";
import useAuthStore from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { PlusCircle } from "lucide-react";
import CategoryFormDialog from "@/components/dialogs/CategoryFormDialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePaginatedFetch } from "@/hooks/usePaginatedFetch";

export default function CategoryPage() {
    const token = useAuthStore((state) => state.token);
    const user = useAuthStore((state) => state.user);
    const canManage = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
    
    const { 
        data: categories, 
        pagination, 
        isLoading, 
        searchTerm,
        handleSearchChange, 
        handlePageChange, 
        handleItemsPerPageChange,
        refreshData 
    } = usePaginatedFetch("http://localhost:5001/api/categories");

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [isEditMode, setIsEditMode] = useState(false);

    const handleAdd = () => {
        setIsEditMode(false);
        setSelectedCategory(null);
        setIsFormOpen(true);
    };

    const handleEdit = (category) => {
        setIsEditMode(true);
        setSelectedCategory(category);
        setIsFormOpen(true);
    };

    const handleDelete = (category) => {
        setSelectedCategory(category);
        setIsConfirmDeleteOpen(true);
    };

    const confirmDelete = async () => {
        try {
            await axios.delete(`http://localhost:5001/api/categories/${selectedCategory.id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            toast.success("Category deleted successfully.");
            refreshData();
        } catch (error) {
            toast.error(error.response?.data?.error || "Failed to delete category.");
        } finally {
            setIsConfirmDeleteOpen(false);
            setSelectedCategory(null);
        }
    };

    return (
        <Card>
            <CardHeader className="flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                 <div>
                    <CardTitle>Category Management</CardTitle>
                    <CardDescription>Manage product categories.</CardDescription>
                </div>
                {canManage && (
                    <Button onClick={handleAdd}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Add Category
                    </Button>
                )}
            </CardHeader>
            <CardContent>
                <Input
                    placeholder="Search by category name..."
                    value={searchTerm}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="mb-4"
                />

                <div className="border rounded-lg">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b">
                                <th className="p-2 text-left">Name</th>
                                <th className="p-2 text-left">Requires S/N</th>
                                <th className="p-2 text-left">Requires MAC</th>
                                <th className="p-2 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr><td colSpan="4" className="text-center p-4">Loading...</td></tr>
                            ) : categories.map((category) => (
                                <tr key={category.id} className="border-b">
                                    <td className="p-2">{category.name}</td>
                                    <td className="p-2">{category.requiresSerialNumber ? 'Yes' : 'No'}</td>
                                    <td className="p-2">{category.requiresMacAddress ? 'Yes' : 'No'}</td>
                                    <td className="p-2">
                                        <div className="flex items-center justify-center gap-2">
                                            {canManage ? (
                                                <>
                                                    <Button variant="outline" size="sm" className="w-20" onClick={() => handleEdit(category)}>Edit</Button>
                                                    <Button variant="destructive" size="sm" className="w-20" onClick={() => handleDelete(category)}>Delete</Button>
                                                </>
                                            ) : (
                                                <span className="text-xs text-slate-400">No actions</span>
                                            )}
                                        </div>
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

            <CategoryFormDialog
                open={isFormOpen}
                onOpenChange={setIsFormOpen}
                category={selectedCategory}
                isEditMode={isEditMode}
                onSuccess={refreshData}
            />

            <AlertDialog open={isConfirmDeleteOpen} onOpenChange={setIsConfirmDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the category: <strong>{selectedCategory?.name}</strong>.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete}>Continue</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Card>
    );
}