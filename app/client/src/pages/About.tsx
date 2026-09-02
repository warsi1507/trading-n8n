import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Activity, 
  ShieldCheck, 
  Zap, 
  ArrowRight,
  Globe,
  Layers,
  Blocks
} from "lucide-react";

export default function About() {
  const navigate = useNavigate();

  const features = [
    {
      icon: <Layers className="h-6 w-6 text-blue-500 dark:text-blue-400" />,
      title: "Intuitive Strategy Builder",
      description: "Design complex trading algorithms visually. Our drag-and-drop interface makes advanced strategy creation accessible to everyone without writing code."
    },
    {
      icon: <ShieldCheck className="h-6 w-6 text-emerald-500 dark:text-emerald-400" />,
      title: "Bank-Grade Security",
      description: "Your exchange keys and wallet secrets are secured with enterprise-level encryption. Trade with absolute peace of mind knowing your funds are safe."
    },
    {
      icon: <Zap className="h-6 w-6 text-amber-500 dark:text-amber-400" />,
      title: "Lightning-Fast Execution",
      description: "React instantly to market movements. Our high-performance engine processes live price feeds and executes trades in milliseconds."
    },
    {
      icon: <Globe className="h-6 w-6 text-purple-500 dark:text-purple-400" />,
      title: "Unified Ecosystem",
      description: "Deploy strategies simultaneously across top Web3 exchanges like Backpack and Hyperliquid from a single, centralized command center."
    }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20">
      <div className="container mx-auto px-4 py-16 md:py-24 max-w-6xl space-y-24">
        
        {/* Hero Section */}
        <section className="flex flex-col items-center text-center space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-700">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">
            Trading Automation 
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600">
              &nbsp;  Reimagined
            </span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-[700px] leading-relaxed">
            Build, deploy, and monitor algorithmic trading strategies effortlessly. Level the playing field and automate your edge.
          </p>
          <div className="pt-4 flex gap-4">
            <Button size="lg" className="rounded-full px-8 gap-2 h-12 text-md shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all" onClick={() => navigate("/workflows")}>
              Start Building <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </section>

        {/* Features Grid */}
        <section className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150 fill-mode-both">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight mb-4">Platform Capabilities</h2>
            <p className="text-muted-foreground">Everything you need to automate your edge, built right in.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature, idx) => (
              <Card key={idx} className="bg-card/50 backdrop-blur-sm border-border/50 hover:border-primary/20 transition-colors shadow-sm hover:shadow-md">
                <CardHeader className="pb-3">
                  <div className="mb-4 h-12 w-12 rounded-lg bg-background border flex items-center justify-center shadow-sm">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm md:text-base leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Architecture / Reliability Section */}
        <section className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300 fill-mode-both pb-12">
          <Card className="overflow-hidden border-border/50 shadow-sm bg-gradient-to-b from-card/80 to-muted/20">
            <div className="grid md:grid-cols-2 gap-0">
              <div className="p-8 md:p-12 flex flex-col justify-center space-y-6">
                <div className="inline-flex items-center rounded-lg bg-primary/10 px-3 py-1 text-sm font-medium text-primary w-fit">
                  <Activity className="mr-2 h-4 w-4" /> 24/7 Reliability
                </div>
                <h3 className="text-2xl md:text-3xl font-bold tracking-tight">Your edge never sleeps.</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Unlike traditional desktop bots, your strategies run continuously on our resilient cloud infrastructure. Even if you close your browser or turn off your computer, your automated workflows remain active, scanning the markets and executing trades around the clock.
                </p>
              </div>
              <div className="bg-black/5 dark:bg-white/5 border-t md:border-t-0 md:border-l border-border/50 p-8 flex items-center justify-center min-h-[350px]">
                <div className="relative w-full max-w-[300px] aspect-square rounded-full border border-dashed border-border flex items-center justify-center">
                  <div className="absolute inset-4 rounded-full border border-dashed border-primary/30 animate-[spin_20s_linear_infinite]" />
                  <div className="absolute inset-12 rounded-full border border-dashed border-blue-500/30 animate-[spin_15s_linear_infinite_reverse]" />
                  <Blocks className="h-16 w-16 text-muted-foreground/50" />
                  
                  {/* Floating badges representing nodes */}
                  <div className="absolute top-0 right-1/4 bg-background border shadow-sm rounded-md px-3 py-1.5 text-xs font-semibold text-primary">Trigger</div>
                  <div className="absolute bottom-1/4 -left-4 bg-background border shadow-sm rounded-md px-3 py-1.5 text-xs font-semibold text-blue-500">Backpack</div>
                  <div className="absolute bottom-0 right-1/4 bg-background border shadow-sm rounded-md px-3 py-1.5 text-xs font-semibold text-purple-500">Lighter</div>
                </div>
              </div>
            </div>
          </Card>
        </section>

      </div>
    </div>
  );
}
