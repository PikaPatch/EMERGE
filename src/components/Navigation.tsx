import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Home, Atom, BookOpen, Download, HelpCircle,
  Network, Search, Sprout, Menu, X,ChartNetwork
} from "lucide-react";
import logo from "/public/img/logo2.png";

export const Navigation = () => {
  const location = useLocation();
  const currentPath = location.pathname;
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { path: "/", label: "Home", icon: Home },
    { path: "/Background", label: "Background", icon: BookOpen },
    { path: "/Morphology", label: "Morphology Map", icon: Atom },
    { path: "/lineage-tree", label: "Lineage Tree", icon: Network },
    { path: "/contact-network", label: "Contact Network", icon: ChartNetwork },
    { path: "/browse", label: "Single Cell", icon: Search },
    { path: "/download", label: "Download", icon: Download },
    { path: "/help", label: "Help", icon: HelpCircle },
  ];

  return (
    <nav className="w-full border-b bg-background">
      {/* ── Top bar ── */}
      <div className="flex items-center justify-between px-4 py-2">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="EMERGE logo" className="h-8 w-auto" />
          <span className="font-bold text-lg">EMERGE</span>
        </Link>

        {/* Desktop nav — hidden on mobile */}
        <div className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPath === item.path;
            return (
              <Button
                key={item.path}
                variant={isActive ? "default" : "ghost"}
                size="sm"
                asChild
              >
                <Link to={item.path} className="flex items-center gap-1">
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              </Button>
            );
          })}
        </div>

        {/* Hamburger — visible only on mobile */}
        <button
          className="md:hidden p-2 rounded-md hover:bg-muted"
          onClick={() => setIsOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* ── Mobile drawer ── */}
      {isOpen && (
        <div className="md:hidden border-t px-4 py-2 flex flex-col gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPath === item.path;
            return (
              <Button
                key={item.path}
                variant={isActive ? "default" : "ghost"}
                size="sm"
                className="justify-start w-full"
                asChild
              >
                <Link
                  to={item.path}
                  className="flex items-center gap-2"
                  onClick={() => setIsOpen(false)}   // close on nav
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              </Button>
            );
          })}
        </div>
      )}
    </nav>
  );
};