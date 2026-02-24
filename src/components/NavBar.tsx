"use client";

import { Bell } from "lucide-react";
import Logo from "./Logo";
import Link from "next/link";
import AccountDropdown from "./AccountDropdown";
import { useState, useRef, useEffect } from "react";
import { useUser, useClerk } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import { Skeleton } from "./ui/skeleton";

interface NavBarProps {
    visitedParksCount: number;
    totalParksCount: number;
}

export default function NavBar({ visitedParksCount, totalParksCount }: NavBarProps) {
    const [accountDropdownOpen, setAccountDropdownOpen] = useState(false);
    const { user, isLoaded } = useUser();
    const { signOut } = useClerk();
    const dropdownRef = useRef<HTMLDivElement>(null);
    const pathname = usePathname();

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

    return (
        <nav className="bg-gray-50 border-b border-gray-200 sticky top-0 z-[1000]">
            <div className="max-w-full px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">

                    {/* Left Side */}
                    <div className="flex items-center space-x-8">
                        
                        {/* Branding */}
                        <Logo />

                        {/* Navigation Links */}
                        <div className="hidden md:flex space-x-1">
                            <Link 
                                href="/map" 
                                className={`px-4 py-2 rounded-lg font-medium transition ${
                                    pathname === '/map'
                                        ? 'font-semibold text-green-600 bg-green-50'
                                        : 'text-gray-600 hover:bg-gray-100'
                                }`}
                            >
                                Map
                            </Link>
                            <Link 
                                href="/visits" 
                                className={`px-4 py-2 rounded-lg font-medium transition ${
                                    pathname === '/visits'
                                        ? 'font-semibold text-green-600 bg-green-50'
                                        : 'text-gray-600 hover:bg-gray-100'
                                }`}
                            >
                                My Visits
                            </Link>
                            <Link 
                                href="/badges" 
                                className={`px-4 py-2 rounded-lg font-medium transition ${
                                    pathname === '/badges'
                                        ? 'font-semibold text-green-600 bg-green-50'
                                        : 'text-gray-600 hover:bg-gray-100'
                                }`}
                            >
                                Badges
                            </Link>
                            <Link 
                                href="/community" 
                                className={`px-4 py-2 rounded-lg font-medium transition ${
                                    pathname === '/community'
                                        ? 'font-semibold text-green-600 bg-green-50'
                                        : 'text-gray-600 hover:bg-gray-100'
                                }`}
                            >
                                Community
                            </Link>
                        </div>
                    </div>
                    {/* Right Side */}
                    <div className="flex items-center space-x-4">

                        {/* Notification Bell */}
                        <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition hover:cursor-pointer">
                            <Bell className="w-6 h-6" />
                        </button>

                        {/* User */}
                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={() => setAccountDropdownOpen(!accountDropdownOpen)}
                                className="flex items-center space-x-3 hover:bg-gray-100 rounded-lg px-2 py-1 transition hover:cursor-pointer"
                            >
                                <div className="text-right hidden sm:block">
                                    {isLoaded ? (<div className="text-sm font-medium text-gray-900">{fullName}</div>) : (<Skeleton className="h-4 w-20 rounded-md bg-gray-300 mb-2" />)}
                                    {isLoaded ? (<div className="text-xs text-gray-500">{visitedParksCount}/{totalParksCount} Parks</div>) : (<Skeleton className="h-2 w-20 rounded-md bg-gray-300" />)}
                                </div>
                                {isLoaded ? (<img 
                                    src={profileImageUrl} 
                                    alt={fullName}
                                    className="w-10 h-10 rounded-full border-2 border-green-500 object-cover" 
                                />) : (<Skeleton className="w-10 h-10 rounded-full bg-gray-300 border-green-500 border-2" />)}
                            </button>
                            
                            <AccountDropdown isOpen={accountDropdownOpen} onSignOut={handleSignOut} />
                        </div>
                        
                    </div>
                </div>
            </div>
        </nav>
    );
}