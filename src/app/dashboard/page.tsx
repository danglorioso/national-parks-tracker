import ProgressCard from '@/components/ProgressCard';
import Nav from '@/components/NavBar';
import QuickStats from '@/components/QuickStats';
import RecentBadges from '@/components/RecentBadges';
import Legend from '@/components/Legend';

export default function DashboardPage() {
    return (
        <div className="">
            {/* Navigation Bar */}
            <Nav />

            {/* Body */}
            <div className="flex flex-row h-[calc(100vh-64px)]">

                {/* Left Sidebar */}
                <div className=" bg-gray-50 border-r border-gray-200 overflow-y-auto p-6">
                    <ProgressCard />
                    <QuickStats />
                    <RecentBadges />
                </div>

                {/* Right Map */}
                <div className="flex-1 p-8 overflow-y-auto relative">
                    {/* Main dashboard content can go here */}
                    <h1 className="text-2xl font-bold mb-4">Welcome to your Dashboard</h1>
                    <p className="text-gray-700">Here you can track your park visits, view badges, and explore the community.</p>
                    <div className="absolute bottom-4 left-4">
                        <Legend />
                    </div>
                </div>

            </div>
        </div>
    );
}