// src/pages/CustomerHistoryPage.jsx

import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import useAuthStore from "@/store/authStore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ArrowLeft, ShoppingCart, PackageOpen, History } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const HistoryList = ({ transactions }) => {
    const navigate = useNavigate();
    const getTransactionIcon = (type) => {
      if (type === 'SALE') return <ShoppingCart className="h-5 w-5 text-green-600" />;
      if (type === 'BORROWING') return <PackageOpen className="h-5 w-5 text-blue-600" />;
      return null;
    };
    const getDetailLink = (item) => {
      if (item.type === 'SALE') return `/sales/${item.details.id}`;
      if (item.type === 'BORROWING') return `/borrowings/${item.details.id}`;
      return '#';
    };
    if (transactions.length === 0) {
        return <p className="text-center py-8 text-muted-foreground">No transaction history found.</p>
    }
    return (
        <div className="space-y-4 pt-4">
            {transactions.map((item) => (
                <Card key={item.id}>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <div className="flex items-center gap-3">
                            {getTransactionIcon(item.type)}
                            <CardTitle className="text-lg">{item.type}</CardTitle>
                        </div>
                        <p className="text-sm text-muted-foreground">{new Date(item.date).toLocaleString()}</p>
                    </CardHeader>
                    <CardContent>
                        <div className="flex justify-between items-center">
                            <p>{item.itemCount} items involved.</p>
                            <Button variant="secondary" onClick={() => navigate(getDetailLink(item))}>
                                View Details
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
};

const SummaryView = ({ summary }) => {
    const navigate = useNavigate();
    const { id: customerId } = useParams();
    if (!summary) return <p className="text-center py-8">Loading summary...</p>;
    return (
        <div className="space-y-6 pt-4">
            <Card 
                className={summary.currentlyBorrowedItems.length > 0 ? "cursor-pointer hover:border-primary transition-colors" : ""}
                onClick={() => {
                    if (summary.currentlyBorrowedItems.length > 0) {
                        navigate(`/customers/${customerId}/active-borrowings`);
                    }
                }}
            >
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><PackageOpen className="text-blue-600"/>Currently Borrowed Items ({summary.currentlyBorrowedItems.length})</CardTitle>
                    <CardDescription>Click to view all and manage returns.</CardDescription>
                </CardHeader>
                <CardContent>
                    {summary.currentlyBorrowedItems.length > 0 ? (
                        <ul className="list-disc list-inside space-y-1">
                            {summary.currentlyBorrowedItems.slice(0, 5).map(item => (
                                <li key={`current-${item.id}`}>{item.productModel.modelNumber} (S/N: {item.serialNumber || 'N/A'})</li>
                            ))}
                        </ul>
                    ) : <p className="text-sm text-muted-foreground">No items currently borrowed.</p>}
                </CardContent>
            </Card>

            <Card 
                className={summary.returnedItemsHistory.length > 0 ? "cursor-pointer hover:border-primary transition-colors" : ""}
                onClick={() => {
                    if (summary.returnedItemsHistory.length > 0) {
                        navigate(`/customers/${customerId}/returned-history`);
                    }
                }}
            >
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><History className="text-gray-500"/>Returned Items History</CardTitle>
                    <CardDescription>Total {summary.returnedItemsHistory.length} items. Click to view all.</CardDescription>
                </CardHeader>
                <CardContent>
                    {summary.returnedItemsHistory.length > 0 ? (
                        <ul className="list-disc list-inside space-y-1">
                            {summary.returnedItemsHistory.slice(0, 5).map(item => (
                                <li key={`returned-${item.id}`}>
                                    {item.productModel.modelNumber} (S/N: {item.serialNumber || 'N/A'}) - Returned on: {item.returnDate ? new Date(item.returnDate).toLocaleDateString() : 'N/A'}
                                </li>
                            ))}
                        </ul>
                    ) : <p className="text-sm text-muted-foreground">No returned items history.</p>}
                </CardContent>
            </Card>

            <Card
                className={summary.purchaseHistory.length > 0 ? "cursor-pointer hover:border-primary transition-colors" : ""}
                onClick={() => {
                    if (summary.purchaseHistory.length > 0) {
                        navigate(`/customers/${customerId}/purchase-history`);
                    }
                }}
            >
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><ShoppingCart className="text-green-600"/>Purchase History</CardTitle>
                    <CardDescription>Total {summary.purchaseHistory.length} items. Click to view all.</CardDescription>
                </CardHeader>
                <CardContent>
                    {summary.purchaseHistory.length > 0 ? (
                        <ul className="list-disc list-inside space-y-1">
                            {summary.purchaseHistory.slice(0, 5).map(item => (
                                <li key={`purchased-${item.id}`}>{item.productModel.modelNumber} (S/N: {item.serialNumber || 'N/A'}) - Purchased on {new Date(item.transactionDate).toLocaleDateString()}</li>
                            ))}
                        </ul>
                    ) : <p className="text-sm text-muted-foreground">No purchase history.</p>}
                </CardContent>
            </Card>
        </div>
    )
}

export default function CustomerHistoryPage() {
    const { id: customerId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const token = useAuthStore((state) => state.token);
    
    // --- START: ส่วนที่แก้ไข ---
    // 1. ตั้งค่าเริ่มต้นให้เป็น 'history' เสมอ
    const [activeTab, setActiveTab] = useState('history');
    // --- END ---
    
    const [history, setHistory] = useState([]);
    const [summary, setSummary] = useState(null);
    const [customer, setCustomer] = useState(null);
    const [loading, setLoading] = useState(true);
    
    // 2. ใช้ useEffect เพื่ออัปเดต tab ตาม location.state ที่ส่งมา
    useEffect(() => {
        if (location.state?.defaultTab) {
            setActiveTab(location.state.defaultTab);
        }
    }, [location.state]);


    useEffect(() => {
        const fetchData = async () => {
            if (!customerId || !token) return;
            try {
                setLoading(true);
                const [historyRes, summaryRes, customerRes] = await Promise.all([
                    axios.get(`http://localhost:5001/api/customers/${customerId}/history`, { headers: { Authorization: `Bearer ${token}` } }),
                    axios.get(`http://localhost:5001/api/customers/${customerId}/summary`, { headers: { Authorization: `Bearer ${token}` } }),
                    axios.get(`http://localhost:5001/api/customers/${customerId}`, { headers: { Authorization: `Bearer ${token}` } })
                ]);
                setHistory(historyRes.data);
                setSummary(summaryRes.data);
                setCustomer(customerRes.data);
            } catch (error) {
                toast.error("Failed to fetch customer data.");
                navigate("/customers");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [customerId, token, navigate]);

    if (loading) return <p>Loading customer data...</p>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">Customer Details</h1>
                    <p className="text-muted-foreground">For Customer: {customer?.name || '...'}</p>
                </div>
                <Button variant="outline" onClick={() => navigate('/customers')}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Customers
                </Button>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="history" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow">Transaction History</TabsTrigger>
                    <TabsTrigger value="summary" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow">Asset Summary</TabsTrigger>
                </TabsList>
                
                <TabsContent value="history">
                    <HistoryList transactions={history} />
                </TabsContent>
                <TabsContent value="summary">
                    <SummaryView summary={summary} />
                </TabsContent>
            </Tabs>
        </div>
    );
}