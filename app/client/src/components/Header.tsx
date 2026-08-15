import { Link, useLocation } from "react-router-dom";
import { Moon, Sun, Settings as SettingsIcon } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { Button } from "./ui/button";
import { Show, SignInButton, SignUpButton, UserButton } from '@clerk/react';
import { dark } from '@clerk/themes';

export default function Header() {
    const { theme, setTheme } = useTheme();
    const location = useLocation();

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
                    <Show when="signed-in">
                        <UserButton
                            appearance={{
                                theme: theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches) ? dark : undefined,
                            }}
                        >
                            <UserButton.UserProfilePage 
                                label="Credentials" 
                                url="credentials" 
                                labelIcon={<SettingsIcon size={16} />}
                            >
                                <div>
                                    <h1 className="text-xl font-bold mb-4">Credentials</h1>
                                    <p className="text-muted-foreground">Credentials section is completely empty for now.</p>
                                </div>
                            </UserButton.UserProfilePage>
                        </UserButton>
                    </Show>
                    <Show when="signed-out">
                        <div className="flex items-center gap-2">
                            <SignInButton mode="modal">
                                <Button variant="ghost" className="font-medium">Sign In</Button>
                            </SignInButton>
                            <SignUpButton mode="modal">
                                <Button className="font-medium">Sign Up</Button>
                            </SignUpButton>
                        </div>
                    </Show>
                </div>
            </div>
        </header>
    );
}
