// src/pages/ActiveBorrowingsPage.jsx

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import useAuthStore from "@/store/authStore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function ActiveBorrowingsPage() {
    const { id: customerId } = useParams();
    const navigate = useNavigate();
    const token = useAuthStore((state) => state.token);
    
    const [allItems, setAllItems] = useState([]); 
    const [customer, setCustomer] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        if (!customerId || !token) return;
        try {
            setLoading(true);
            const [borrowingsRes, customerRes] = await Promise.all([
                axios.get(`http://localhost:5001/api/customers/${customerId}/active-borrowings`, {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get(`http://localhost:5001/api/customers/${customerId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
            ]);
            
            const flattenedItems = borrowingsRes.data.flatMap(transaction => 
                transaction.items.map(item => ({
                    ...item,
                    borrowingId: transaction.id
                }))
            );
            setAllItems(flattenedItems);
            setCustomer(customerRes.data);

        } catch (error) {
            toast.error("Failed to fetch data.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [customerId, token]);

    const handleReturnItem = async (borrowingId, itemId) => {
        try {
            await axios.patch(`http://localhost:5001/api/borrowings/${borrowingId}/return`,
                { itemIdsToReturn: [itemId] },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success("Item returned successfully!");
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.error || "Failed to return item.");
        }
    };

    if (loading) return <p>Loading active borrowings...</p>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">Active Borrowed Items</h1>
                    <p className="text-muted-foreground">For Customer: {customer?.name || '...'}</p>
                </div>
                <Button variant="outline" onClick={() => navigate(`/customers/${customerId}/history`, { state: { defaultTab: 'summary' } })}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Summary
                </Button>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>All Borrowed Items ({allItems.length})</CardTitle>
                    <CardDescription>
                        List of all items currently borrowed by this customer.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b">
                                <th className="p-2 text-left">Product</th>
                                <th className="p-2 text-left">Serial Number</th>
                                <th className="p-2 text-left">From Borrowing ID</th>
                                <th className="p-2 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {allItems.length > 0 ? (
                                allItems.map(item => (
                                    <tr key={item.id} className="border-b">
                                        <td className="p-2">{item.productModel.modelNumber}</td>
                                        <td className="p-2">{item.serialNumber || 'N/A'}</td>
                                        <td className="p-2">{item.borrowingId}</td>
                                        <td className="p-2 text-center">
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button size="sm">Return</Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Confirm Return</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            Return item: <strong>{item.productModel.modelNumber}</strong> (S/N: {item.serialNumber || 'N/A'})?
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleReturnItem(item.borrowingId, item.id)}>
                                                            Continue
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="4" className="p-4 text-center text-muted-foreground">
                                        This customer has no active borrowings.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </CardContent>
            </Card>
        </div>
    );
}