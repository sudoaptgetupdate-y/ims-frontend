// src/pages/SaleDetailPage.jsx

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import useAuthStore from "@/store/authStore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

export default function SaleDetailPage() {
    const { saleId } = useParams();
    const navigate = useNavigate();
    const token = useAuthStore((state) => state.token);
    const [sale, setSale] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSaleDetails = async () => {
            if (!saleId || !token) return;
            try {
                setLoading(true);
                const response = await axios.get(`http://localhost:5001/api/sales/${saleId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setSale(response.data);
            } catch (error) {
                toast.error("Failed to fetch sale details.");
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchSaleDetails();
    }, [saleId, token]);

    if (loading) {
        return <p>Loading sale details...</p>;
    }

    if (!sale) {
        return <p>Sale not found.</p>;
    }

    return (
        <div className="space-y-6">
            {/* --- START: ส่วนที่แก้ไข --- */}
            <Button variant="outline" onClick={() => navigate(-1)}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
            </Button>
            {/* --- END --- */}

            <Card>
                <CardHeader>
                    <CardTitle>Sale Details</CardTitle>
                    <CardDescription>Sale ID: {sale.id}</CardDescription>
                </CardHeader>
                <CardContent className="grid md:grid-cols-3 gap-4 text-sm">
                    <div>
                        <p className="font-semibold">Customer</p>
                        <p>{sale.customer.name}</p>
                    </div>
                    <div>
                        <p className="font-semibold">Sale Date</p>
                        <p>{new Date(sale.saleDate).toLocaleString()}</p>
                    </div>
                    <div>
                        <p className="font-semibold">Sold By</p>
                        <p>{sale.soldBy.name}</p>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Items Sold ({sale.itemsSold.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="border-b">
                                <th className="p-2">Product Model</th>
                                <th className="p-2">Serial Number</th>
                                <th className="p-2">MAC Address</th>
                                <th className="p-2 text-right">Price (Pre-VAT)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sale.itemsSold.map(item => (
                                <tr key={item.id} className="border-b">
                                    <td className="p-2">{item.productModel.modelNumber}</td>
                                    <td className="p-2">{item.serialNumber}</td>
                                    <td className="p-2">{item.macAddress}</td>
                                    <td className="p-2 text-right">{item.productModel.sellingPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })} THB</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                             <tr className="font-semibold">
                                <td colSpan="3" className="p-2 text-right">Subtotal</td>
                                <td className="p-2 text-right">{sale.subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })} THB</td>
                            </tr>
                            <tr className="font-semibold">
                                <td colSpan="3" className="p-2 text-right">VAT (7%)</td>
                                <td className="p-2 text-right">{sale.vatAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })} THB</td>
                            </tr>
                            <tr className="font-bold text-lg border-t-2">
                                <td colSpan="3" className="p-2 text-right">Total Price</td>
                                <td className="p-2 text-right">{sale.total.toLocaleString('en-US', { minimumFractionDigits: 2 })} THB</td>
                            </tr>
                        </tfoot>
                    </table>
                </CardContent>
            </Card>
        </div>
    );
}