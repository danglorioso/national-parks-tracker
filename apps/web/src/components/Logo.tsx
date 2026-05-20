import { Trees } from "lucide-react";
import Link from "next/link";

export default function Logo() {
    return (
        <Link href="/" className="flex items-center group transition p-2 rounded-lg">
            <div className="flex items-center gap-2">
                {/* Logo */}
                <Trees className="w-8 h-8 text-green-600" />
                {/* Title */}
                <span className="text-xl font-bold text-gray-900 group-hover:text-green-600 duration-200">ParkQuest</span>
            </div>
        </Link>
    );
}