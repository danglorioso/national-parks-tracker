import { ClipboardCheck, Award, Users, ChartColumnIncreasing, Map, Clock } from "lucide-react";

export default function Features() {
    return (
        <div id="features" className="bg-gray-50 py-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-4xl font-bold text-gray-900 mb-4">Everything You Need to Explore</h2>
                    <p className="text-xl text-gray-600">Track, share, and celebrate your national park adventures</p>
                </div>
                
                <div className="grid md:grid-cols-3 gap-8">
                    <div className="bg-white rounded-xl p-8 shadow-sm hover:shadow-lg transition">
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                            <ClipboardCheck className="w-6 h-6 text-green-600" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Track Your Visits</h3>
                        <p className="text-gray-600">Check off parks as you visit them. Add photos, notes, and ratings to remember your adventures.</p>
                    </div>

                    <div className="bg-white rounded-xl p-8 shadow-sm hover:shadow-lg transition">
                        <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-4">
                            <Award className="w-6 h-6 text-yellow-600" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Earn Badges</h3>
                        <p className="text-gray-600">Unlock achievements as you explore. From &quot;First Timer&quot; to &quot;Park Champion&quot; - collect them all!</p>
                    </div>

                    <div className="bg-white rounded-xl p-8 shadow-sm hover:shadow-lg transition">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                            <Users className="w-6 h-6 text-blue-600" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Share Experiences</h3>
                        <p className="text-gray-600">Post photos and stories from your trips. Connect with fellow adventurers and get inspired.</p>
                    </div>

                    <div className="bg-white rounded-xl p-8 shadow-sm hover:shadow-lg transition">
                        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                            <ChartColumnIncreasing className="w-6 h-6 text-purple-600" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">View Your Stats</h3>
                        <p className="text-gray-600">See your progress, most visited regions, and compare with other explorers on the leaderboard.</p>
                    </div>

                    <div className="bg-white rounded-xl p-8 shadow-sm hover:shadow-lg transition">
                        <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                            <Map className="w-6 h-6 text-red-600" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Interactive Map</h3>
                        <p className="text-gray-600">Visualize all parks on an interactive map. Plan your next adventure with detailed park information.</p>
                    </div>

                    <div className="bg-white rounded-xl p-8 shadow-sm hover:shadow-lg transition">
                        <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                            <Clock className="w-6 h-6 text-orange-600" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Trip Planning</h3>
                        <p className="text-gray-600">Create bucket lists, plan routes, and get personalized recommendations for your next visit.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}