// src/pages/LoginPage.jsx

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import useAuthStore from "@/store/authStore";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
    // 1. เปลี่ยน state จาก email เป็น username
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const login = useAuthStore((state) => state.login);
    const navigate = useNavigate();

    const handleSubmit = async (event) => {
        event.preventDefault();

        try {
            // 2. ส่ง username แทน email
            const response = await axios.post("http://localhost:5001/api/auth/login", {
                username,
                password,
            });

            login(response.data.token, response.data.user);
            navigate("/dashboard");

            toast.success("Login Successful!", {
                description: "Redirecting to your dashboard...",
            });

        } catch (error) {
            console.error("Login failed:", error.response.data);
            toast.error("Invalid username or password.");
        }
    };

    return (
        <div className="min-h-screen bg-slate-100 flex justify-center items-center">
            <Card className="w-full max-w-sm">
                <CardHeader>
                    <CardTitle className="text-2xl">Login</CardTitle>
                    <CardDescription>
                        กรุณาเข้าสู่ระบบ
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit}>
                        <div className="grid gap-4">
                            {/* 3. เปลี่ยน UI ทั้งหมดเป็น Username */}
                            <div className="grid gap-2">
                                <Label htmlFor="username">Username</Label>
                                <Input
                                    id="username"
                                    type="text"
                                    placeholder="ชื่อผู้ใช้"
                                    required
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
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                            <Button type="submit" className="w-full">
                                Login
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}