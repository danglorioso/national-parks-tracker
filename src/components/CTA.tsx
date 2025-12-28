import { useState } from "react";
import SignUpModal from "./SignUpModal";

export default function CTA() {
    const [showSignUpModal, setShowSignUpModal] = useState(false);
    return (
        <div className="bg-green-800/90 py-20">
            <div className="max-w-4xl mx-auto text-center px-4">
                <h2 className="text-4xl font-bold text-white mb-6">Ready to Start Your Adventure?</h2>
                <p className="text-xl text-green-50 mb-8">Join other explorers tracking their national park journeys. And it&#39;s completely free!</p>
                <button className="bg-white text-green-700 px-8 py-4 rounded-lg font-bold text-lg hover:bg-green-50 transition shadow-lg" onClick={() => setShowSignUpModal(true)}>
                    Create Free Account
                </button>
            </div>
            {showSignUpModal && <SignUpModal open={showSignUpModal} onOpenChange={setShowSignUpModal} />}
        </div>
    );
}