import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen pt-24 pb-8">
            <h1 className="text-6xl font-extrabold tracking-tight mb-4">404</h1>
            <p className="text-xl text-muted-foreground mb-8">Oops! The page you are looking for doesn't exist.</p>
            <Button asChild size="lg">
                <Link to="/">Go Home</Link>
            </Button>
        </div>
    )
}
