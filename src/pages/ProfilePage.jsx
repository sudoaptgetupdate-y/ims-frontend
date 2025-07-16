// src/pages/ProfilePage.jsx

import { useState, useEffect } from 'react';
import useAuthStore from '@/store/authStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import axios from 'axios';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; // 1. Import Tabs

export default function ProfilePage() {
    const { user, token, login } = useAuthStore();
    
    // State สำหรับฟอร์ม Profile
    const [name, setName] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [isProfileLoading, setIsProfileLoading] = useState(false);

    // State สำหรับฟอร์ม Change Password
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isPasswordLoading, setIsPasswordLoading] = useState(false);

    useEffect(() => {
        if (user) {
            setName(user.name || '');
            setUsername(user.username || '');
            setEmail(user.email || '');
        }
    }, [user]);

    // Handler สำหรับอัปเดต Profile
    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        setIsProfileLoading(true);
        try {
            const response = await axios.patch('http://localhost:5001/api/users/me/profile', 
                { name, username, email },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            login(token, response.data);
            toast.success("Profile updated successfully!");
        } catch (error) {
            toast.error(error.response?.data?.error || "Failed to update profile.");
        } finally {
            setIsProfileLoading(false);
        }
    };

    // Handler สำหรับเปลี่ยนรหัสผ่าน
    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            toast.error("New password and confirmation do not match.");
            return;
        }
        if (newPassword.length < 6) {
             toast.error("New password must be at least 6 characters long.");
            return;
        }

        setIsPasswordLoading(true);
        try {
            const response = await axios.patch('http://localhost:5001/api/users/me/password', 
                { currentPassword, newPassword },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success(response.data.message);
            // เคลียร์ฟอร์มรหัสผ่าน
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error) {
            toast.error(error.response?.data?.error || "Failed to change password.");
        } finally {
            setIsPasswordLoading(false);
        }
    };

    return (
        // 2. ใช้ Tabs เป็นตัวครอบหลัก
        <Tabs defaultValue="profile" className="max-w-2xl mx-auto">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="profile">Profile Details</TabsTrigger>
                <TabsTrigger value="password">Change Password</TabsTrigger>
            </TabsList>
            
            {/* 3. เนื้อหาของแท็บ Profile */}
            <TabsContent value="profile">
                <Card>
                    <CardHeader>
                        <CardTitle>My Profile</CardTitle>
                        <CardDescription>View and update your personal information.</CardDescription>
                    </CardHeader>
                    <form onSubmit={handleProfileSubmit}>
                        <CardContent className="space-y-4">
                            <div className="space-y-2"><Label htmlFor="username">Username</Label><Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} required /></div>
                            <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
                            <div className="space-y-2"><Label htmlFor="name">Full Name</Label><Input id="name" value={name} onChange={(e) => setName(e.target.value)} required /></div>
                            <div className="space-y-2"><Label htmlFor="role">Role</Label><Input id="role" value={user?.role || ''} disabled /></div>
                        </CardContent>
                        <CardFooter><Button type="submit" disabled={isProfileLoading}>{isProfileLoading ? 'Saving...' : 'Save Changes'}</Button></CardFooter>
                    </form>
                </Card>
            </TabsContent>

            {/* 4. เนื้อหาของแท็บ Change Password */}
            <TabsContent value="password">
                <Card>
                    <CardHeader>
                        <CardTitle>Change Password</CardTitle>
                        <CardDescription>Enter your current password and a new password.</CardDescription>
                    </CardHeader>
                    <form onSubmit={handlePasswordSubmit}>
                        <CardContent className="space-y-4">
                             <div className="space-y-2"><Label htmlFor="currentPassword">Current Password</Label><Input id="currentPassword" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required /></div>
                             <div className="space-y-2"><Label htmlFor="newPassword">New Password</Label><Input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required /></div>
                             <div className="space-y-2"><Label htmlFor="confirmPassword">Confirm New Password</Label><Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required /></div>
                        </CardContent>
                        <CardFooter><Button type="submit" disabled={isPasswordLoading}>{isPasswordLoading ? 'Saving...' : 'Change Password'}</Button></CardFooter>
                    </form>
                </Card>
            </TabsContent>
        </Tabs>
    );
}