"use client";

import Logo from "./Logo";
import Link from "next/link";
import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { Menu, X, CheckCircle2, Mail, LogOut } from "lucide-react";
import { SignInButton, SignUpButton, useUser, useClerk } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

export default function Header() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [accountDropdownOpen, setAccountDropdownOpen] = useState(false);
    const { isSignedIn, user, isLoaded } = useUser();
    const { signOut } = useClerk();
    const dropdownRef = useRef<HTMLDivElement>(null);

    const navLinks = (
        <>
            <Link href="#features" className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition p-2 rounded-lg font-medium">Features</Link>
            <Link href="#how-it-works" className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition p-2 rounded-lg font-medium">How It Works</Link>
        </>
    );

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
        <nav className="bg-white shadow-sm sticky top-0 z-50 border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 py-2">
                <div className="flex justify-between items-center h-16">
                    <Logo />
                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-4">
                        {navLinks}
                        {isSignedIn && isLoaded && user ? (
                            <>
                                <Link href="/">
                                    <Button variant="outline" className="text-green-600 border-green-400 hover:text-green-700 hover:bg-gray-100">
                                        Dashboard
                                    </Button>
                                </Link>
                                <div className="relative" ref={dropdownRef}>
                                    <button
                                        onClick={() => setAccountDropdownOpen(!accountDropdownOpen)}
                                        className="flex items-center gap-3 hover:bg-gray-100 rounded-lg px-3 py-2 transition"
                                    >
                                        {profileImageUrl ? (
                                            <Image 
                                                src={profileImageUrl} 
                                                alt={fullName}
                                                width={40}
                                                height={40}
                                                className="w-10 h-10 rounded-full border-2 border-green-500 object-cover"
                                            />
                                        ) : (
                                            <div className="w-10 h-10 rounded-full border-2 border-green-500 bg-gray-200 flex items-center justify-center text-gray-500 text-sm font-medium">
                                                {fullName.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                        <span className="text-sm font-medium text-gray-900 hidden sm:block">
                                            {fullName}
                                        </span>
                                    </button>
                                    
                                    {/* Account Dropdown */}
                                    {accountDropdownOpen && user && (
                                        <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                                            <div className="p-6 space-y-4">
                                                <div>
                                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h3>
                                                    <div className="space-y-4">
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-500">Name</p>
                                                            <p className="text-lg font-semibold">{fullName}</p>
                                                        </div>
                                                        {user.firstName && (
                                                            <div>
                                                                <p className="text-sm font-medium text-gray-500">First Name</p>
                                                                <p className="text-base">{user.firstName}</p>
                                                            </div>
                                                        )}
                                                        {user.lastName && (
                                                            <div>
                                                                <p className="text-sm font-medium text-gray-500">Last Name</p>
                                                                <p className="text-base">{user.lastName}</p>
                                                            </div>
                                                        )}
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
                            </>
                        ) : (
                            <>
                                <SignInButton mode="modal">
                                    <Button variant="outline" className="text-green-600 border-green-400 hover:text-green-700 hover:bg-gray-100">
                                        Sign In
                                    </Button>
                                </SignInButton>
                                <SignUpButton mode="modal">
                                    <Button className="bg-green-600 hover:bg-green-700 text-white">
                                        Get Started
                                    </Button>
                                </SignUpButton>
                            </>
                        )}
                    </div>
                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="md:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
                        aria-label="Toggle menu"
                    >
                        {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                    </button>
                </div>
                {/* Mobile Menu */}
                {mobileMenuOpen && (
                    <div className="md:hidden mt-2 pb-4 space-y-2 border-t border-gray-200 pt-4">
                        <div className="flex flex-col space-y-2">
                            {navLinks}
                            {isSignedIn && isLoaded && user ? (
                                <>
                                    <Link href="/">
                                        <Button variant="outline" className="w-full text-green-600 border-green-400 hover:text-green-700 hover:bg-gray-100">
                                            Dashboard
                                        </Button>
                                    </Link>
                                    <div className="relative w-full">
                                        <button
                                            onClick={() => {
                                                setAccountDropdownOpen(!accountDropdownOpen);
                                                setMobileMenuOpen(false);
                                            }}
                                            className="flex items-center gap-3 hover:bg-gray-100 rounded-lg px-3 py-2 transition w-full"
                                        >
                                            {profileImageUrl ? (
                                                <Image 
                                                    src={profileImageUrl} 
                                                    alt={fullName}
                                                    width={40}
                                                    height={40}
                                                    className="w-10 h-10 rounded-full border-2 border-green-500 object-cover"
                                                    unoptimized
                                                />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full border-2 border-green-500 bg-gray-200 flex items-center justify-center text-gray-500 text-sm font-medium">
                                                    {fullName.charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                            <span className="text-sm font-medium text-gray-900">
                                                {fullName}
                                            </span>
                                        </button>
                                        
                                        {/* Mobile Account Dropdown */}
                                        {accountDropdownOpen && user && (
                                            <div className="mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                                                <div className="p-6 space-y-4">
                                                    <div>
                                                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h3>
                                                        <div className="space-y-4">
                                                            <div>
                                                                <p className="text-sm font-medium text-gray-500">Name</p>
                                                                <p className="text-lg font-semibold">{fullName}</p>
                                                            </div>
                                                            {user.firstName && (
                                                                <div>
                                                                    <p className="text-sm font-medium text-gray-500">First Name</p>
                                                                    <p className="text-base">{user.firstName}</p>
                                                                </div>
                                                            )}
                                                            {user.lastName && (
                                                                <div>
                                                                    <p className="text-sm font-medium text-gray-500">Last Name</p>
                                                                    <p className="text-base">{user.lastName}</p>
                                                                </div>
                                                            )}
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
                                </>
                            ) : (
                                <>
                                    <SignInButton mode="modal">
                                        <Button variant="outline" className="w-full text-green-600 border-green-400 hover:text-green-700 hover:bg-gray-100">
                                            Sign In
                                        </Button>
                                    </SignInButton>
                                    <SignUpButton mode="modal">
                                        <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
                                            Get Started
                                        </Button>
                                    </SignUpButton>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
}