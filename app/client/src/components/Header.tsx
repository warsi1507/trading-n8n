import { Link, useLocation } from "react-router-dom";
import { Moon, Sun, User, Settings as SettingsIcon, LogOut } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

export default function Header() {
    const { theme, setTheme } = useTheme();
    const location = useLocation();

    // Mock authentication state for now
    const isLoggedIn = true;

    const navLinks = [
        { path: "/", label: "Home" },
        { path: "/workflows", label: "Workflows" },
        { path: "/about", label: "About" }
    ];

    return (
        <header className="fixed top-0 z-50 w-full border-b border-border/10 bg-background/5 backdrop-blur-lg supports-[backdrop-filter]:bg-background/5">
            <div className="container flex h-16 items-center justify-between mx-auto px-4 md:px-8 max-w-full">
                
                {/* Left: Logo */}
                <div className="flex items-center gap-2">
                    <Link to="/" className="flex items-center">
                        <img src="/logo-light.svg" alt="FlowTrade Logo" className="h-24 w-auto -ml-4 dark:hidden" />
                        <img src="/logo-dark.svg" alt="FlowTrade Logo" className="h-24 w-auto -ml-4 hidden dark:block" />
                        <span 
                            className="text-2xl font-extrabold tracking-tight hidden sm:inline-block -ml-1 text-foreground"
                            style={{ fontFamily: "'Nunito', sans-serif" }}
                        >
                            FlowTrade
                        </span>
                    </Link>
                </div>

                {/* Middle: Navigation Links */}
                <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
                    {navLinks.map((link) => (
                        <Link 
                            key={link.path} 
                            to={link.path}
                            className={`transition-colors hover:text-primary ${location.pathname === link.path ? "text-foreground" : "text-muted-foreground"}`}
                        >
                            {link.label}
                        </Link>
                    ))}
                </nav>

                {/* Right: Theme Toggle & Auth */}
                <div className="flex items-center gap-4">
                    
                    {/* Theme Toggle Button */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full w-9 h-9 border"
                        onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                    >
                        <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                        <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                        <span className="sr-only">Toggle theme</span>
                    </Button>

                    {/* Auth Section */}
                    {isLoggedIn ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="secondary" size="icon" className="rounded-full w-9 h-9 border overflow-hidden">
                                    <User className="h-4 w-4" />
                                    <span className="sr-only">Toggle user menu</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem asChild className="cursor-pointer">
                                    <Link to="/settings" className="flex items-center">
                                        <SettingsIcon className="mr-2 h-4 w-4" />
                                        <span>Settings</span>
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem className="cursor-pointer text-red-600 focus:text-red-600">
                                    <LogOut className="mr-2 h-4 w-4" />
                                    <span>Logout</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                        <div className="flex items-center gap-2">
                            <Button variant="ghost" className="font-medium">Sign In</Button>
                            <Button className="font-medium">Sign Up</Button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
