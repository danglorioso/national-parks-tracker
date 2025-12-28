import ProgressCard from '@/components/ProgressCard';
import Nav from '@/components/NavBar';
import QuickStats from '@/components/QuickStats';
import RecentBadges from '@/components/RecentBadges';
import Legend from '@/components/Legend';

export default function DashboardPage() {
    return (
        <div className="flex flex-col min-h-screen">
            {/* Navigation Bar */}
            <Nav />

            {/* Body */}
            <div className="flex flex-1 flex-row min-h-0">

                {/* Left Sidebar */}
                <div className="w-80 bg-gray-50 border-r border-gray-200 overflow-y-auto p-6">
                    <ProgressCard />
                    <QuickStats />
                    <RecentBadges />
                </div>

                {/* Right Map */}
                <div className="flex-1 p-8 overflow-y-auto relative">
                    
                    
                    {/* Legend */}
                    <div className="absolute bottom-4 left-4">
                        <Legend />
                    </div>
                    
                </div>

            </div>
        </div>
    );
}