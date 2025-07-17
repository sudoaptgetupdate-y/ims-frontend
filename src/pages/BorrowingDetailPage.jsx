// src/pages/BorrowingDetailPage.jsx

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import useAuthStore from "@/store/authStore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ArrowLeft, CheckSquare, Square } from "lucide-react";

export default function BorrowingDetailPage() {
    const { borrowingId } = useParams();
    const navigate = useNavigate();
    const token = useAuthStore((state) => state.token);
    const [borrowing, setBorrowing] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedToReturn, setSelectedToReturn] = useState([]);

    const fetchDetails = async () => {
        if (!borrowingId || !token) return;
        try {
            setLoading(true);
            const response = await axios.get(`http://localhost:5001/api/borrowings/${borrowingId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setBorrowing(response.data);
            setSelectedToReturn(response.data.items.filter(item => item.status === 'BORROWED').map(item => item.id));
        } catch (error) {
            toast.error("Failed to fetch borrowing details.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDetails();
    }, [borrowingId, token]);

    const handleToggleReturnItem = (itemId) => {
        setSelectedToReturn(prev =>
            prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]
        );
    };

    const handleReturnItems = async () => {
        if (selectedToReturn.length === 0) {
            toast.error("Please select at least one item to return.");
            return;
        }
        try {
            await axios.patch(`http://localhost:5001/api/borrowings/${borrowingId}/return`, 
                { itemIdsToReturn: selectedToReturn },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success("Items have been returned successfully.");
            fetchDetails();
            setSelectedToReturn([]);
        } catch (error) {
            toast.error(error.response?.data?.error || "Failed to process return.");
        }
    };

    if (loading) return <p>Loading details...</p>;
    if (!borrowing) return <p>Record not found.</p>;

    const itemsBorrowed = borrowing.items.filter(item => item.status === 'BORROWED');
    const itemsReturned = borrowing.items.filter(item => item.status !== 'BORROWED');

    return (
        <div className="space-y-6">
            <Button variant="outline" onClick={() => navigate('/borrowings')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Borrowing List
            </Button>

            <Card>
                <CardHeader>
                    <CardTitle>Borrowing Details</CardTitle>
                    <CardDescription>Record ID: {borrowing.id}</CardDescription>
                </CardHeader>
                <CardContent className="grid md:grid-cols-3 gap-4 text-sm">
                    <div><p className="font-semibold">Customer</p><p>{borrowing.borrower.name}</p></div>
                    <div><p className="font-semibold">Borrow Date</p><p>{new Date(borrowing.borrowDate).toLocaleString()}</p></div>
                    <div><p className="font-semibold">Due Date</p><p>{borrowing.dueDate ? new Date(borrowing.dueDate).toLocaleDateString() : 'N/A'}</p></div>
                    <div><p className="font-semibold">Approved By</p><p>{borrowing.approvedBy.name}</p></div>
                    
                    {/* === จุดที่แก้ไข === */}
                    <div>
                        <p className="font-semibold">Status</p>
                        <div><Badge>{borrowing.status}</Badge></div>
                    </div>
                    {/* ================= */}

                    {borrowing.returnDate && (
                         <div><p className="font-semibold">Return Date</p><p>{new Date(borrowing.returnDate).toLocaleString()}</p></div>
                    )}
                </CardContent>
            </Card>

            {itemsBorrowed.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Items to Return</CardTitle>
                        <CardDescription>Select items that the customer is returning now.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {itemsBorrowed.map(item => (
                                <div key={item.id} onClick={() => handleToggleReturnItem(item.id)} className="flex items-center gap-3 p-2 border rounded-md cursor-pointer hover:bg-slate-50">
                                    {selectedToReturn.includes(item.id) ? <CheckSquare className="h-5 w-5 text-blue-600" /> : <Square className="h-5 w-5 text-slate-400" />}
                                    <div>
                                        <p className="font-medium">{item.productModel.modelNumber}</p>
                                        <p className="text-xs text-slate-500">S/N: {item.serialNumber || 'N/A'}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button onClick={handleReturnItems} disabled={selectedToReturn.length === 0}>
                            Confirm Return ({selectedToReturn.length} items)
                        </Button>
                    </CardFooter>
                </Card>
            )}

            {itemsReturned.length > 0 && (
                <Card>
                    <CardHeader><CardTitle>Already Returned Items</CardTitle></CardHeader>
                    <CardContent>
                       <ul className="list-disc list-inside text-sm text-slate-600">
                            {itemsReturned.map(item => (
                                <li key={item.id}>{item.productModel.modelNumber} (S/N: {item.serialNumber || 'N/A'})</li>
                            ))}
                       </ul>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}