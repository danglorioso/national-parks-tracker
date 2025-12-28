import { Star, Check } from "lucide-react";
import { useState } from "react";
import SignUpModal from "./SignUpModal";

export default function Hero() {
    const [showSignUpModal, setShowSignUpModal] = useState(false);
    return (
        <div
            className="text-white"
            style={{ background: "linear-gradient(135deg, rgba(5, 107, 78, 1), #047857 50%, #10b981 100%)" }}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">

                {/* Left Side */}
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    <div>
                        {/* <div className="inline-block bg-green-500 bg-opacity-30 rounded-full px-4 py-2 mb-6">
                            <span className="text-sm font-medium">🏆 Join 50,000+ Park Explorers</span>
                        </div> */}

                        {/* Hero Title */}
                        <h1 className="text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                            Your National Park Adventure Starts Here
                        </h1>

                        {/* Hero Subtitle */}
                        <p className="text-xl mb-8 text-green-50">
                            Track your visits, earn badges, share experiences, and discover all 63 U.S. National Parks. Turn your bucket list into reality.
                        </p>

                        {/* Buttons */}
                        <div className="flex flex-col sm:flex-row gap-4">
                            <button className="bg-white text-green-700 px-8 py-4 rounded-lg font-bold text-lg hover:bg-green-100 transition shadow-lg" onClick={() => setShowSignUpModal(true)}>
                                Start Tracking
                            </button>
                            <button className="border-2 border-white text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-green-100 hover:bg-opacity-10 hover:text-green-700 transition" onClick={() => window.location.href = '#map'}>
                                Explore Map
                            </button>
                        </div>

                        {/* Perks */}
                        <div className="mt-8 flex items-center space-x-6 text-sm">
                            <div className="flex items-center space-x-2">
                                <Star className="w-5 h-5 text-white" />
                                <span>No credit card required</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Check className="w-5 h-5 text-white" />
                                <span>Free-to-use</span>
                            </div>
                        </div>
                    </div>

                    {/* Right Side */}
                    <div className="relative">
                        <div className="bg-white rounded-2xl shadow-2xl p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-gray-900 font-bold text-lg">Your Progress</h3>
                                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">12/63 Parks</span>
                            </div>
                            <div className="space-y-3">
                                <div className="flex items-center space-x-3 bg-gray-50 p-3 rounded-lg">
                                    <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center text-white font-bold">🏔️</div>
                                    <div className="flex-1">
                                        <div className="font-medium text-gray-900">Yosemite</div>
                                        <div className="text-sm text-gray-500">Visited May {new Date().getFullYear() - 2}</div>
                                    </div>
                                    <Check className="w-6 h-6 text-white bg-green-600 rounded-full p-1" strokeWidth={4} />
                                </div>
                                <div className="flex items-center space-x-3 bg-gray-50 p-3 rounded-lg">
                                    <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center text-white font-bold">🌋</div>
                                    <div className="flex-1">
                                        <div className="font-medium text-gray-900">Yellowstone</div>
                                        <div className="text-sm text-gray-500">Visited August {new Date().getFullYear() - 1}</div>
                                    </div>
                                    <Check className="w-6 h-6 text-white bg-green-600 rounded-full p-1" strokeWidth={4} />
                                </div>
                                <div className="flex items-center space-x-3 bg-gray-50 p-3 rounded-lg opacity-50">
                                    <div className="w-12 h-12 bg-gray-300 rounded-lg flex items-center justify-center text-white font-bold">🏜️</div>
                                    <div className="flex-1">
                                        <div className="font-medium text-gray-900">Grand Canyon</div>
                                        <div className="text-sm text-gray-500">Not visited yet</div>
                                    </div>
                                    <div className="w-6 h-6 border-2 border-gray-300 rounded-full"></div>
                                </div>
                            </div>
                            <div className="mt-4 pt-4 border-t border-gray-200">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-600">Badges Earned</span>
                                    <div className="flex space-x-1">
                                        <span className="text-2xl">🏆</span>
                                        <span className="text-2xl">🎒</span>
                                        <span className="text-2xl">⭐</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                </div>
            </div>
            {showSignUpModal && <SignUpModal open={showSignUpModal} onOpenChange={setShowSignUpModal} />}
        </div>
    );
}