import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export default function Header() {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  
  const navLinks = [
    { name: "Analyze", href: "/#analyze" },
    { name: "Compare", href: "/#compare" },
    { name: "History", href: "/#history" },
    { name: "About", href: "/#about" },
  ];

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <span className="text-primary mr-2">⚖️</span>
            <h1 className="text-2xl font-semibold text-primary">BiasDetector</h1>
          </div>
          
          <div className="hidden md:flex space-x-4 text-neutral-medium">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className={`hover:text-primary px-3 py-2 rounded-md text-sm font-medium ${
                  location === link.href ? "border-b-2 border-primary text-primary" : ""
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>
          
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                ≡
              </Button>
            </SheetTrigger>
            <SheetContent>
              <nav className="flex flex-col gap-4 mt-8">
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    href={link.href}
                    className={`px-4 py-2 text-sm font-medium rounded-md ${
                      location === link.href 
                        ? "bg-primary/10 text-primary" 
                        : "text-neutral-medium hover:text-primary hover:bg-primary/5"
                    }`}
                    onClick={() => setIsOpen(false)}
                  >
                    {link.name}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
