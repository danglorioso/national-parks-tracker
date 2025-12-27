export default function ProgressCard() {
    return (
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white mb-6">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">Your Progress</h2>
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                </svg>
            </div>
            <div className="text-4xl font-bold mb-2">12 / 63</div>
            <div className="text-green-100 text-sm mb-4">19% Complete</div>
            <div className="w-full bg-green-400 bg-opacity-30 rounded-full h-3">
                <div className="bg-white rounded-full h-3" style={{width: "19%"}}></div>
            </div>
        </div>
    );
}