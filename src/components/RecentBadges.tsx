export default function RecentBadges() {
    return (
        <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Recent Badges</h3>
            <div className="space-y-3">
                <div className="flex items-center space-x-3 bg-yellow-50 rounded-lg p-3">
                    <span className="text-3xl">🏆</span>
                    <div>
                        <div className="font-medium text-sm text-gray-900">First Timer</div>
                        <div className="text-xs text-gray-500">Visited your first park</div>
                    </div>
                </div>
                <div className="flex items-center space-x-3 bg-green-50 rounded-lg p-3">
                    <span className="text-3xl">🎒</span>
                    <div>
                        <div className="font-medium text-sm text-gray-900">Explorer</div>
                        <div className="text-xs text-gray-500">Visited 10 parks</div>
                    </div>
                </div>
                <div className="flex items-center space-x-3 bg-blue-50 rounded-lg p-3">
                    <span className="text-3xl">📸</span>
                    <div>
                        <div className="font-medium text-sm text-gray-900">Photographer</div>
                        <div className="text-xs text-gray-500">Uploaded 25 photos</div>
                    </div>
                </div>
            </div>
        </div>
    );
}