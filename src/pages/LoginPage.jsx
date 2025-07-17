// src/pages/LoginPage.jsx

import { useEffect, useState } from "react";
import axios from "axios";
import useAuthStore from "@/store/authStore";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";


export default function LoginPage() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    
    // ดึง Action และ State จาก Store
    const login = useAuthStore((state) => state.login);
    const token = useAuthStore((state) => state.token);
    const navigate = useNavigate();

    const handleSubmit = async (event) => {
        event.preventDefault();
        setIsLoading(true);

        try {
            const response = await axios.post("http://localhost:5001/api/auth/login", {
                username,
                password,
            });
            // เมื่อ API สำเร็จ ให้เรียก action `login` เพื่ออัปเดต state เท่านั้น
            login(response.data.token, response.data.user);
        } catch (error) {
            console.error("Login failed:", error.response?.data);
            toast.error("Invalid username or password.");
            setIsLoading(false);
        }
    };
    
    // **จุดที่แก้ไขสำคัญ**
    // ใช้ useEffect เพื่อ "รอฟัง" การเปลี่ยนแปลงของ token
    // เมื่อ token มีค่า (แสดงว่า login สำเร็จ) จึงค่อยนำทาง
    useEffect(() => {
        if (token) {
            navigate("/dashboard", { replace: true });
        }
    }, [token, navigate]);

    return (
        <div className="min-h-screen bg-slate-100 flex justify-center items-center">
            <Card className="w-full max-w-sm">
                <CardHeader>
                    <CardTitle className="text-2xl">Login</CardTitle>
                    <CardDescription>กรุณาเข้าสู่ระบบ</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit}>
                        <div className="grid gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="username">Username</Label>
                                <Input
                                    id="username"
                                    type="text"
                                    placeholder="ชื่อผู้ใช้"
                                    required
                                    disabled={isLoading}
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="password">Password</Label>
                                <Input 
                                    id="password" 
                                    type="password" 
                                    placeholder="รหัสผ่าน"
                                    required 
                                    disabled={isLoading}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? "Logging in..." : "Login"}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}