import { Trees } from "lucide-react";

export default function Logo() {
    return (
        <a href="/" className="flex items-center space-x-2">
            <div className="flex items-center space-x-2">
                {/* Logo */}
                <Trees className="w-8 h-8 text-green-600" />
                {/* Title */}
                <span className="text-xl font-bold text-gray-900">ParkQuest</span>
            </div>
        </a>
    );
}