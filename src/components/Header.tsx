"use client";

import Logo from "./Logo";
import Link from "next/link";
import { useState  } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import SignInModal from "./SignInModal";
import SignUpModal from "./SignUpModal";

export default function Header() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [signInOpen, setSignInOpen] = useState(false);
    const [signUpOpen, setSignUpOpen] = useState(false);

    const navLinks = (
        <>
            <Link href="#features" className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition p-2 rounded-lg font-medium">Features</Link>
            <Link href="#map" className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition p-2 rounded-lg font-medium">How It Works</Link>
            <Link href="#about" className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition p-2 rounded-lg font-medium">About</Link>
        </>
    );

    return (
        <nav className="bg-white shadow-sm sticky top-0 z-50 border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 py-2">
                <div className="flex justify-between items-center h-16">
                    <Logo />
                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-4">
                        {navLinks}
                        <Button 
                            variant="outline" 
                            className="text-green-600 border-green-400 hover:text-green-700 hover:bg-gray-100 hover:cursor-pointer"
                            onClick={() => setSignInOpen(true)}
                        >
                            Sign In
                        </Button>
                        <Button 
                            className="bg-green-600 hover:bg-green-700 text-white hover:cursor-pointer"
                            onClick={() => setSignUpOpen(true)}
                        >
                            Get Started
                        </Button>
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
                            <Button 
                                variant="outline" 
                                className="w-full text-green-600 border-green-400 hover:text-green-700 hover:bg-gray-100"
                                onClick={() => {
                                    setSignInOpen(true);
                                    setMobileMenuOpen(false);
                                }}
                            >
                                Sign In
                            </Button>
                            <Button 
                                className="w-full bg-green-600 hover:bg-green-700 text-white"
                                onClick={() => {
                                    setSignUpOpen(true);
                                    setMobileMenuOpen(false);
                                }}
                            >
                                Get Started
                            </Button>
                        </div>
                    </div>
                )}
            </div>
            <SignInModal 
                open={signInOpen} 
                onOpenChange={setSignInOpen}
                switchToSignUp={() => setSignUpOpen(true)}
            />
            <SignUpModal 
                open={signUpOpen} 
                onOpenChange={setSignUpOpen}
                switchToSignIn={() => setSignInOpen(true)}
            />
        </nav>
    );
}