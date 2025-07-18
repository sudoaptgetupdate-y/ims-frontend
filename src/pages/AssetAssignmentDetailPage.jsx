// src/pages/AssetAssignmentDetailPage.jsx

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import useAuthStore from "@/store/authStore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ArrowLeft, CheckSquare, Square, Printer } from "lucide-react"; // --- 1. เพิ่มไอคอน Printer ---
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function AssetAssignmentDetailPage() {
    const { assignmentId } = useParams();
    const navigate = useNavigate();
    const token = useAuthStore((state) => state.token);
    const [assignment, setAssignment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedToReturn, setSelectedToReturn] = useState([]);

    const fetchDetails = async () => {
        if (!assignmentId || !token) return;
        try {
            setLoading(true);
            const response = await axios.get(`http://localhost:5001/api/asset-assignments/${assignmentId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAssignment(response.data);
        } catch (error) {
            toast.error("Failed to fetch assignment details.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDetails();
    }, [assignmentId, token]);

    const handleToggleReturnItem = (itemId) => {
        setSelectedToReturn(prev =>
            prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]
        );
    };

    const handleReturnItems = async () => {
        if (selectedToReturn.length === 0) {
            toast.error("Please select at least one asset to return.");
            return;
        }
        try {
            await axios.patch(`http://localhost:5001/api/asset-assignments/${assignmentId}/return`, 
                { itemIdsToReturn: selectedToReturn },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success("Assets have been returned successfully.");
            fetchDetails();
            setSelectedToReturn([]);
        } catch (error) {
            toast.error(error.response?.data?.error || "Failed to process return.");
        }
    };
    
    // --- START: 2. เพิ่มฟังก์ชัน Print ---
    const handlePrint = () => {
        window.print();
    };
    // --- END ---
    
    const getStatusVariant = (status) => {
        switch (status) {
            case 'ASSIGNED': return 'warning';
            case 'RETURNED': return 'secondary';
            case 'PARTIALLY_RETURNED': return 'info';
            default: return 'outline';
        }
    };

    if (loading) return <p>Loading assignment details...</p>;
    if (!assignment) return <p>Record not found.</p>;
    
    const itemsToReturn = assignment.items.filter(item => !item.returnedAt);

    return (
        // --- START: 3. เพิ่ม className="printable-area" ---
        <div className="space-y-6 printable-area">
            <div className="flex justify-between items-center no-print">
                <Button variant="outline" onClick={() => navigate(-1)}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                </Button>
                <Button onClick={handlePrint}>
                    <Printer className="mr-2 h-4 w-4" />
                    Print
                </Button>
            </div>
            
            <div className="print-header hidden">
                <h1>ใบเบิกจ่ายทรัพย์สิน / Asset Assignment Note</h1>
                <p>เอกสารฉบับนี้เป็นการยืนยันการเบิกจ่ายทรัพย์สิน</p>
            </div>
            {/* --- END --- */}

            <Card>
                <CardHeader>
                    <CardTitle className="flex justify-between items-start">
                       <span>Assignment Details</span>
                       <Badge variant={getStatusVariant(assignment.status)}>{assignment.status}</Badge>
                    </CardTitle>
                    <CardDescription>Record ID: #{assignment.id}</CardDescription>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-4 text-sm print:flex print:justify-between">
                    <div>
                        <p className="font-semibold">Assignee (Employee)</p><p>{assignment.assignee.name}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 print:text-right">
                        <div><p className="font-semibold">Approved By</p><p>{assignment.approvedBy.name}</p></div>
                        <div><p className="font-semibold">Assignment Date</p><p>{new Date(assignment.assignedDate).toLocaleString()}</p></div>
                        {assignment.returnDate && (
                             <div><p className="font-semibold">Completion Date</p><p>{new Date(assignment.returnDate).toLocaleString()}</p></div>
                        )}
                    </div>
                    {assignment.notes && <div className="md:col-span-2 pt-2"><p className="font-semibold">Notes</p><p className="whitespace-pre-wrap text-muted-foreground">{assignment.notes}</p></div>}
                </CardContent>
            </Card>

            {itemsToReturn.length > 0 && (
                <Card className="no-print">
                    <CardHeader>
                        <CardTitle>Assets to Return</CardTitle>
                        <CardDescription>Select assets that the employee is returning.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="border rounded-md">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b">
                                        <th className="p-2 w-12 text-center">Return</th>
                                        <th className="p-2 text-left">Asset Code</th>
                                        <th className="p-2 text-left">Product</th>
                                        <th className="p-2 text-left">Serial Number</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {itemsToReturn.map(item => (
                                        <tr 
                                            key={item.inventoryItem.id} 
                                            className="border-b cursor-pointer hover:bg-slate-50"
                                            onClick={() => handleToggleReturnItem(item.inventoryItem.id)}
                                        >
                                            <td className="p-2 text-center">
                                                {selectedToReturn.includes(item.inventoryItem.id) 
                                                    ? <CheckSquare className="h-5 w-5 text-primary mx-auto" /> 
                                                    : <Square className="h-5 w-5 text-muted-foreground mx-auto" />
                                                }
                                            </td>
                                            <td className="p-2">{item.inventoryItem.assetCode}</td>
                                            <td className="p-2">{item.inventoryItem.productModel.modelNumber}</td>
                                            <td className="p-2">{item.inventoryItem.serialNumber || 'N/A'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button disabled={selectedToReturn.length === 0}>
                                    Confirm Return ({selectedToReturn.length} items)
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Confirm Return</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        You are about to return {selectedToReturn.length} asset(s). This will change their status back to "IN_WAREHOUSE". Are you sure?
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleReturnItems}>
                                        Continue
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </CardFooter>
                </Card>
            )}

            <Card>
                 <CardHeader><CardTitle>All Assigned Assets ({assignment.items.length})</CardTitle></CardHeader>
                 <CardContent>
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b">
                                <th className="p-2 text-left">Asset Code</th>
                                <th className="p-2 text-left">Product Model</th>
                                <th className="p-2 text-left">Serial Number</th>
                                <th className="p-2 text-left">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {assignment.items.map(item => (
                                <tr key={item.inventoryItem.id} className="border-b">
                                    <td className="p-2">{item.inventoryItem.assetCode}</td>
                                    <td className="p-2">{item.inventoryItem.productModel.modelNumber}</td>
                                    <td className="p-2">{item.inventoryItem.serialNumber || 'N/A'}</td>
                                    <td className="p-2">
                                        <Badge variant={item.returnedAt ? 'secondary' : 'warning'}>
                                            {item.returnedAt ? `Returned on ${new Date(item.returnedAt).toLocaleDateString()}` : 'Assigned'}
                                        </Badge>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                 </CardContent>
            </Card>
            
            {/* --- START: 4. เพิ่มส่วนลายเซ็นต์ --- */}
            <div className="signature-section hidden">
                <div className="signature-box">
                    <div className="signature-line"></div>
                    <p>( ..................................................... )</p>
                    <p>เจ้าหน้าที่ผู้จ่ายทรัพย์สิน / Officer</p>
                </div>
                <div className="signature-box">
                    <div className="signature-line"></div>
                    <p>( ..................................................... )</p>
                    <p>พนักงานผู้รับทรัพย์สิน / Assignee</p>
                </div>
            </div>
            {/* --- END --- */}
        </div>
    );
}