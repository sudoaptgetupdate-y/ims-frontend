// src/components/dialogs/CustomerFormDialog.jsx

import { useEffect, useState } from "react";
import axios from "axios";
import useAuthStore from "@/store/authStore";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const initialData = {
    customerCode: "",
    name: "",
    phone: "",
    address: ""
};

export default function CustomerFormDialog({ open, onOpenChange, customer, isEditMode, onSuccess }) {
    const token = useAuthStore((state) => state.token);
    const [formData, setFormData] = useState(initialData);

    useEffect(() => {
        if (isEditMode && customer) {
            setFormData({
                customerCode: customer.customerCode,
                name: customer.name,
                phone: customer.phone || "",
                address: customer.address || "",
            });
        } else {
            setFormData(initialData);
        }
    }, [isEditMode, customer, open]);

    const handleInputChange = (e) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const url = isEditMode
            ? `http://localhost:5001/api/customers/${customer.id}`
            : "http://localhost:5001/api/customers";
        const method = isEditMode ? 'put' : 'post';

        try {
            await axios[method](url, formData, { headers: { Authorization: `Bearer ${token}` } });
            toast.success(`Customer has been ${isEditMode ? 'updated' : 'created'} successfully.`);
            onSuccess(); // Re-fetch data on the parent page
            onOpenChange(false); // Close the dialog
        } catch (error) {
            toast.error(error.response?.data?.error || `Failed to ${isEditMode ? 'update' : 'create'} customer.`);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{isEditMode ? 'Edit Customer' : 'Add New Customer'}</DialogTitle>
                    <DialogDescription>
                        {isEditMode ? `Editing details for ${customer?.name}.` : "Fill in the details for the new customer."}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="customerCode">Customer Code</Label>
                        <Input id="customerCode" value={formData.customerCode} onChange={handleInputChange} required />
                    </div>
                    <div>
                        <Label htmlFor="name">Full Name</Label>
                        <Input id="name" value={formData.name} onChange={handleInputChange} required />
                    </div>
                    <div>
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input id="phone" value={formData.phone} onChange={handleInputChange} />
                    </div>
                    <div>
                        <Label htmlFor="address">Address</Label>
                        <Input id="address" value={formData.address} onChange={handleInputChange} />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button type="submit">{isEditMode ? 'Save Changes' : 'Create Customer'}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}