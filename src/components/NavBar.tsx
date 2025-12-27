import { Trees, Bell } from "lucide-react";

export default function NavBar() {
    return (
        <nav className="bg-gray-50 border-b border-gray-200 sticky top-0 z-50">
            <div className="max-w-full px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">

                    {/* Left Side */}
                    <div className="flex items-center space-x-8">
                        
                        {/* Branding */}
                        <a href="/" className="flex items-center space-x-2">
                            <div className="flex items-center space-x-2">
                                {/* Logo */}
                                <Trees className="w-8 h-8 text-green-600" />
                                {/* Title */}
                                <span className="text-xl font-bold text-gray-900">ParkQuest</span>
                            </div>
                        </a>

                        {/* Navigation Links */}
                        <div className="hidden md:flex space-x-1">
                            <a href="/map" className="px-4 py-2 text-green-600 bg-green-50 rounded-lg font-medium">Map</a>
                            <a href="/visits" className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg font-medium">My Visits</a>
                            <a href="/badges" className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg font-medium">Badges</a>
                            <a href="/community" className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg font-medium">Community</a>
                        </div>
                    </div>
                    {/* Right Side */}
                    <div className="flex items-center space-x-4">

                        {/* Notification Bell */}
                        <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                            <Bell className="w-6 h-6" />
                        </button>

                        {/* User */}
                        <div className="flex items-center space-x-3">
                            <div className="text-right hidden sm:block">
                                <div className="text-sm font-medium text-gray-900">Sarah Johnson</div>
                                <div className="text-xs text-gray-500">12/63 Parks</div>
                            </div>
                            <img src="https://media.pff.com/player-photos/nfl/143969.webp" alt="Profile" className="w-10 h-10 rounded-full border-2 border-green-500" />
                        </div>
                        
                    </div>
                </div>
            </div>
        </nav>
    );
}