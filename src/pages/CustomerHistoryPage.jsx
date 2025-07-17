// src/pages/CustomerHistoryPage.jsx

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import useAuthStore from "@/store/authStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ArrowLeft, ShoppingCart, PackageOpen } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function CustomerHistoryPage() {
    const { id: customerId } = useParams();
    const navigate = useNavigate();
    const token = useAuthStore((state) => state.token);
    const [history, setHistory] = useState([]);
    const [customer, setCustomer] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('ALL');

    useEffect(() => {
        const fetchHistory = async () => {
            if (!customerId || !token) return;
            try {
                setLoading(true);
                const [historyRes, customerRes] = await Promise.all([
                    axios.get(`http://localhost:5001/api/customers/${customerId}/history`, {
                        headers: { Authorization: `Bearer ${token}` }
                    }),
                    axios.get(`http://localhost:5001/api/customers/${customerId}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    })
                ]);
                setHistory(historyRes.data);
                setCustomer(customerRes.data);
            } catch (error) {
                toast.error("Failed to fetch customer history.");
                navigate("/customers");
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, [customerId, token, navigate]);

    const filteredHistory = history.filter(item => {
        if (filter === 'ALL') return true;
        if (filter === 'SALE') return item.type === 'SALE';
        if (filter === 'BORROWING') return item.type === 'BORROWING';
        return true;
    });

    if (loading) return <p>Loading history...</p>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">Transaction History</h1>
                    <p className="text-muted-foreground">For Customer: {customer?.name || '...'}</p>
                </div>
                <Button variant="outline" onClick={() => navigate('/customers')}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Customers
                </Button>
            </div>

            <Tabs defaultValue="ALL" onValueChange={setFilter} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="ALL">All Transactions</TabsTrigger>
                    <TabsTrigger value="SALE">Sales History</TabsTrigger>
                    <TabsTrigger value="BORROWING">Borrowing History</TabsTrigger>
                </TabsList>
                
                <TabsContent value="ALL">
                    <HistoryList history={filteredHistory} />
                </TabsContent>
                <TabsContent value="SALE">
                    <HistoryList history={filteredHistory} />
                </TabsContent>
                <TabsContent value="BORROWING">
                    <HistoryList history={filteredHistory} />
                </TabsContent>
            </Tabs>
        </div>
    );
}

const HistoryList = ({ history }) => {
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

    if (history.length === 0) {
        return <p className="text-center py-8 text-muted-foreground">No transaction history found for this filter.</p>
    }

    return (
        <div className="space-y-4 pt-4">
            {history.map((item) => (
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