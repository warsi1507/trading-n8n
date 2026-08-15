import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { ArrowRight } from "lucide-react";
import AnimatedWorkflow from "../components/AnimatedWorkflow";

export default function Home() {
    return (
        <div className="min-h-screen flex items-center relative overflow-hidden pt-24">
            {/* Global Ambient Animated Blobs */}
            
            {/* Left Blob: Bigger and more spread */}
            <div className="absolute top-[10%] -left-[10%] w-[600px] h-[600px] bg-emerald-400/20 dark:bg-emerald-500/10 rounded-full blur-[150px] animate-blob pointer-events-none"></div>
            
            {/* Right Blob: Smaller on extreme right end */}
            <div className="absolute top-[30%] right-[5%] w-[400px] h-[400px] bg-sky-400/20 dark:bg-sky-500/10 rounded-full blur-[100px] animate-blob animation-delay-2000 pointer-events-none"></div>

            <div className="container px-6 md:px-12 mx-auto grid md:grid-cols-2 gap-12 relative z-10 w-full">
                {/* Left Side: Text Content */}
                <div className="flex flex-col items-start justify-center pt-10 md:pt-0 relative z-20">

                    {/* Main Heading */}
                    <h1 
                        className="text-5xl md:text-6xl lg:text-[5rem] leading-[1.1] tracking-tight mb-10 animate-fade-slide-up"
                        style={{ fontFamily: "'Nunito', sans-serif" }}
                    >
                        <span className="font-medium text-foreground/80 block mb-2">Automated Trading Workflows</span>
                    </h1>

                    {/* CTA Button */}
                    <div className="animate-fade-slide-up mb-14" style={{ animationDelay: '200ms' }}>
                        <Link to="/create-workflow">
                            <Button size="lg" className="h-14 px-8 text-lg font-semibold rounded-md shadow-md transition-all hover:scale-105 active:scale-95">
                                Create Workflow
                                <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>
                        </Link>
                    </div>

                    {/* Bottom Paragraph */}
                    <p 
                        className="text-lg md:text-xl text-muted-foreground max-w-[500px] leading-relaxed animate-fade-slide-up"
                        style={{ animationDelay: '400ms' }}
                    >
                        Build visually, connect to live market data, and execute trades automatically. Deploy the workflow here only.
                    </p>
                    <p 
                        className="text-lg md:text-xl text-muted-foreground max-w-[500px] leading-relaxed animate-fade-slide-up"
                        style={{ animationDelay: '400ms' }}
                    >
                        Every step of your strategy's logic is traceable.
                    </p>
                </div>

                {/* Right Side: Graphic */}
                <div className="hidden md:flex items-center justify-center relative min-h-[500px]">
                    <AnimatedWorkflow />
                </div>
            </div>
            
        </div>
    )
}
