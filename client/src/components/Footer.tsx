import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex justify-center md:justify-start space-x-6">
            <Link href="#about" className="text-neutral-medium hover:text-primary">
              <span>About</span>
            </Link>
            <Link href="#privacy" className="text-neutral-medium hover:text-primary">
              <span>Privacy</span>
            </Link>
            <Link href="#terms" className="text-neutral-medium hover:text-primary">
              <span>Terms</span>
            </Link>
            <Link href="#contact" className="text-neutral-medium hover:text-primary">
              <span>Contact</span>
            </Link>
          </div>
          <div className="mt-8 md:mt-0">
            <p className="text-center md:text-right text-sm text-neutral-medium">
              &copy; {new Date().getFullYear()} BiasDetector. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
