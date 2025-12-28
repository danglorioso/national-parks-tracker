export default function Footer() {
  return (
    <footer className="bg-green-900 border-t border-white/10 mt-auto">
      <div className="max-w-6xl mx-auto px-6 py-4">
        <div className="flex flex-col items-center space-y-4">
          {/* Main content */}
          <div className="text-center">
            <p className="text-white text-sm md:text-base mb-1">
              Created by{" "}
              <a
                href="https://danglorioso.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white hover:text-yellow-200 font-medium transition-colors duration-300 underline decoration-white/60 hover:decoration-yellow-200 underline-offset-2"
              >
                Dan Glorioso
              </a>
              .
            </p>
            <p className="text-white/80 text-xs">
              © {new Date().getFullYear()} All rights reserved
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
