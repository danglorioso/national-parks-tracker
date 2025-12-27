export default function Legend() {
    return (
        <div className="bg-white rounded-lg shadow-lg p-4 z-10">
                <h4 className="font-semibold text-gray-900 mb-3 text-sm">Legend</h4>
                <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                        <div className="w-5 h-5 bg-green-600 rounded-full border-2 border-white shadow"></div>
                        <span className="text-sm text-gray-600">Visited Parks</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-gray-300 rounded-full border-2 border-white shadow"></div>
                        <span className="text-sm text-gray-600">Not Visited</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <div className="w-5 h-5 bg-yellow-400 rounded-full border-2 border-white shadow"></div>
                        <span className="text-sm text-gray-600">Bucket List</span>
                    </div>
                </div>
            </div>
    );
}