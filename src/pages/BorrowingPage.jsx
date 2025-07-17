// src/pages/BorrowingPage.jsx

import { useNavigate } from "react-router-dom";
import useAuthStore from "@/store/authStore";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePaginatedFetch } from "@/hooks/usePaginatedFetch";

export default function BorrowingPage() {
    const navigate = useNavigate();
    const { user: currentUser } = useAuthStore((state) => state);
    const canManage = currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPER_ADMIN';

    // ใช้ Hook เดิมได้เลย แค่เปลี่ยน API endpoint
    const { 
        data: borrowings, 
        pagination, 
        isLoading, 
        searchTerm,
        handleSearchChange, 
        handlePageChange, 
        handleItemsPerPageChange,
    } = usePaginatedFetch("http://localhost:5001/api/borrowings");

    const getStatusVariant = (status) => {
        const variants = {
            BORROWED: 'default',
            RETURNED: 'secondary',
            OVERDUE: 'destructive'
        };
        return variants[status] || 'outline';
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Borrowing Records</CardTitle>
                {canManage && (
                    <Button onClick={() => navigate('/borrowings/new')}>
                        Create New Borrowing
                    </Button>
                )}
            </CardHeader>
            <CardContent>
                <div className="mb-4">
                    <Input
                        placeholder="Search by Customer, Admin, or Serial Number..."
                        value={searchTerm}
                        onChange={(e) => handleSearchChange(e.target.value)}
                    />
                </div>
                <div className="border rounded-lg overflow-x-auto">
                    <table className="w-full text-sm whitespace-nowrap">
                        <thead>
                            <tr className="border-b">
                                <th className="p-2">Customer</th>
                                <th className="p-2">Borrow Date</th>
                                <th className="p-2">Due Date</th>
                                <th className="p-2">Status</th>
                                <th className="p-2">Approved By</th>
                                <th className="p-2 text-center">Items</th>
                                <th className="p-2 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr><td colSpan="7" className="text-center p-4">Loading...</td></tr>
                            ) : borrowings.map((b) => (
                                <tr key={b.id} className="border-b">
                                    <td className="p-2">{b.borrower.name}</td>
                                    <td className="p-2">{new Date(b.borrowDate).toLocaleDateString()}</td>
                                    <td className="p-2">{b.dueDate ? new Date(b.dueDate).toLocaleDateString() : 'N/A'}</td>
                                    <td className="p-2"><Badge variant={getStatusVariant(b.status)}>{b.status}</Badge></td>
                                    <td className="p-2">{b.approvedBy.name}</td>
                                    <td className="p-2 text-center">{b.items.length}</td>
                                    <td className="p-2 text-center">
                                        <Button variant="outline" size="sm" onClick={() => navigate(`/borrowings/${b.id}`)}>
                                            Details
                                        </Button>
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