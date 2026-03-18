"use client";

import { Bell, Search, UserRound } from "lucide-react";
import Logo from "./Logo";
import Link from "next/link";
import AccountDropdown from "./AccountDropdown";
import { useState, useRef, useEffect, useCallback } from "react";
import { useUser, useClerk } from "@clerk/nextjs";
import { usePathname, useRouter } from "next/navigation";
import { Skeleton } from "./ui/skeleton";

interface NavBarProps {
    visitedParksCount: number;
    totalParksCount: number;
}

interface SearchResult {
    username: string;
    full_name: string | null;
    avatar_url: string | null;
    is_self: boolean;
}

export default function NavBar({ visitedParksCount, totalParksCount }: NavBarProps) {
    const [accountDropdownOpen, setAccountDropdownOpen] = useState(false);
    const { user, isLoaded } = useUser();
    const { signOut } = useClerk();
    const dropdownRef = useRef<HTMLDivElement>(null);
    const pathname = usePathname();
    const router = useRouter();
    const [username, setUsername] = useState<string | null>(null);

    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [searchOpen, setSearchOpen] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);
    const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const runSearch = useCallback((q: string) => {
        if (!q.trim()) { setSearchResults([]); setSearchOpen(false); return; }
        fetch(`/api/users/search?q=${encodeURIComponent(q)}`)
            .then(r => r.ok ? r.json() : [])
            .then((data: SearchResult[]) => { setSearchResults(data); setSearchOpen(data.length > 0); })
            .catch(() => {});
    }, []);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const q = e.target.value;
        setSearchQuery(q);
        if (searchTimer.current) clearTimeout(searchTimer.current);
        searchTimer.current = setTimeout(() => runSearch(q), 250);
    };

    const handleSearchSelect = (result: SearchResult) => {
        setSearchQuery("");
        setSearchResults([]);
        setSearchOpen(false);
        router.push(`/profile/${result.username}`);
    };

    useEffect(() => {
        if (!isLoaded || !user) return;
        fetch('/api/users/me')
            .then(r => r.ok ? r.json() : null)
            .then(data => { if (data?.username) setUsername(data.username); })
            .catch(() => {});
    }, [isLoaded, user]);

    const fullName = user?.firstName && user?.lastName 
        ? `${user.firstName} ${user.lastName}` 
        : user?.firstName || user?.lastName || 'User';
    
    const emailVerified = user?.emailAddresses?.find(email => email.id === user.primaryEmailAddressId)?.verification?.status === 'verified';
    const profileImageUrl = user?.imageUrl || '';

    // Close dropdowns when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setAccountDropdownOpen(false);
            }
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setSearchOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

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
                                href={username ? `/profile/${username}` : '/visits'}
                                className={`px-4 py-2 rounded-lg font-medium transition ${
                                    pathname.startsWith('/profile')
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
                                href="/feed"
                                className={`px-4 py-2 rounded-lg font-medium transition ${
                                    pathname === '/feed'
                                        ? 'font-semibold text-green-600 bg-green-50'
                                        : 'text-gray-600 hover:bg-gray-100'
                                }`}
                            >
                                Feed
                            </Link>
                        </div>
                    </div>

                    {/* Search */}
                    <div ref={searchRef} className="relative hidden md:block w-56">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={handleSearchChange}
                            onFocus={() => { if (searchResults.length > 0) setSearchOpen(true); }}
                            placeholder="Find users…"
                            className="w-full pl-8 pr-3 py-1.5 text-sm bg-gray-100 border border-transparent rounded-lg outline-none focus:bg-white focus:border-gray-300 transition-colors"
                        />
                        {searchOpen && searchResults.length > 0 && (
                            <div className="absolute top-full mt-1.5 left-0 w-72 bg-white rounded-xl border border-gray-200 shadow-lg z-50 overflow-hidden">
                                {searchResults.map(result => (
                                    <button
                                        key={result.username}
                                        onClick={() => handleSearchSelect(result)}
                                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left"
                                    >
                                        {result.avatar_url ? (
                                            <img src={result.avatar_url} alt={result.username} className="w-8 h-8 rounded-full object-cover shrink-0" />
                                        ) : (
                                            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                                                <UserRound className="w-4 h-4 text-emerald-600" />
                                            </div>
                                        )}
                                        <div className="min-w-0">
                                            {result.full_name && <p className="text-sm font-medium text-gray-900 truncate">{result.full_name}</p>}
                                            <p className="text-xs text-gray-500 truncate">@{result.username}{result.is_self ? " (you)" : ""}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
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
                            
                            <AccountDropdown isOpen={accountDropdownOpen} onSignOut={handleSignOut} username={username} />
                        </div>
                        
                    </div>
                </div>
            </div>
        </nav>
    );
}