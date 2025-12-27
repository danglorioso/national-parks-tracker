export default function QuickStats() {
    return (
        <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Quick Stats</h3>
            <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-50 rounded-lg p-3">
                    <div className="text-2xl font-bold text-blue-600">5</div>
                    <div className="text-xs text-blue-600">States</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-3">
                    <div className="text-2xl font-bold text-purple-600">8</div>
                    <div className="text-xs text-purple-600">Badges</div>
                </div>
                <div className="bg-orange-50 rounded-lg p-3">
                    <div className="text-2xl font-bold text-orange-600">47</div>
                    <div className="text-xs text-orange-600">Photos</div>
                </div>
                <div className="bg-pink-50 rounded-lg p-3">
                    <div className="text-2xl font-bold text-pink-600">23</div>
                    <div className="text-xs text-pink-600">Posts</div>
                </div>
            </div>
        </div>
    );
}