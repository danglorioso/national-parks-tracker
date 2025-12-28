"use client";

import { Bell, CheckCircle2, Mail, LogOut } from "lucide-react";
import Logo from "./Logo";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { useUser, useClerk } from "@clerk/nextjs";

export default function NavBar() {
    const [accountDropdownOpen, setAccountDropdownOpen] = useState(false);
    const { user, isLoaded } = useUser();
    const { signOut } = useClerk();
    const dropdownRef = useRef<HTMLDivElement>(null);

    const fullName = user?.firstName && user?.lastName 
        ? `${user.firstName} ${user.lastName}` 
        : user?.firstName || user?.lastName || 'User';
    
    const emailVerified = user?.emailAddresses?.find(email => email.id === user.primaryEmailAddressId)?.verification?.status === 'verified';
    const profileImageUrl = user?.imageUrl || '';

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setAccountDropdownOpen(false);
            }
        }

        if (accountDropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [accountDropdownOpen]);

    const handleSignOut = async () => {
        await signOut();
        setAccountDropdownOpen(false);
    };

    if (!isLoaded || !user) {
        return null;
    }

    return (
        <nav className="bg-gray-50 border-b border-gray-200 sticky top-0 z-50">
            <div className="max-w-full px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">

                    {/* Left Side */}
                    <div className="flex items-center space-x-8">
                        
                        {/* Branding */}
                        <Logo />

                        {/* Navigation Links */}
                        <div className="hidden md:flex space-x-1">
                            <Link href="/map" className="px-4 py-2 text-green-600 bg-green-50 rounded-lg font-medium">Map</Link>
                            <Link href="/visits" className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg font-medium">My Visits</Link>
                            <Link href="/badges" className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg font-medium">Badges</Link>
                            <Link href="/community" className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg font-medium">Community</Link>
                        </div>
                    </div>
                    {/* Right Side */}
                    <div className="flex items-center space-x-4">

                        {/* Notification Bell */}
                        <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                            <Bell className="w-6 h-6" />
                        </button>

                        {/* User */}
                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={() => setAccountDropdownOpen(!accountDropdownOpen)}
                                className="flex items-center space-x-3 hover:bg-gray-100 rounded-lg px-2 py-1 transition"
                            >
                                <div className="text-right hidden sm:block">
                                    <div className="text-sm font-medium text-gray-900">{fullName}</div>
                                    <div className="text-xs text-gray-500">12/63 Parks</div>
                                </div>
                                <img 
                                    src={profileImageUrl} 
                                    alt={fullName}
                                    className="w-10 h-10 rounded-full border-2 border-green-500 object-cover" 
                                />
                            </button>
                            
                            {/* Account Dropdown */}
                            {accountDropdownOpen && (
                                <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                                    <div className="p-6 space-y-4">
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h3>
                                            <div className="space-y-4">
                                                <div>
                                                    <p className="text-sm font-medium text-gray-500">Name</p>
                                                    <p className="text-lg font-semibold">{fullName}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-500">Email</p>
                                                    <div className="flex items-center gap-2">
                                                        <Mail className="h-4 w-4 text-gray-400" />
                                                        <p className="text-base">{user.primaryEmailAddress?.emailAddress}</p>
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-500">Email Status</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        {emailVerified ? (
                                                            <>
                                                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                                                                <span className="text-sm text-green-600">Verified</span>
                                                            </>
                                                        ) : (
                                                            <span className="text-sm text-yellow-600">Pending verification</span>
                                                        )}
                                                    </div>
                                                </div>
                                                {user.createdAt && (
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-500">Member since</p>
                                                        <p className="text-base">{new Date(user.createdAt).toLocaleDateString('en-US', { 
                                                            year: 'numeric', 
                                                            month: 'long', 
                                                            day: 'numeric' 
                                                        })}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="border-t border-gray-200 pt-4">
                                            <button
                                                onClick={handleSignOut}
                                                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition font-medium"
                                            >
                                                <LogOut className="h-4 w-4" />
                                                Sign Out
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                        
                    </div>
                </div>
            </div>
        </nav>
    );
}