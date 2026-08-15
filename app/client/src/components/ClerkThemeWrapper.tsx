import { ClerkProvider } from '@clerk/react';
import { dark } from '@clerk/themes';
import { useTheme } from './ThemeProvider';

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key");
}

export function ClerkThemeWrapper({ children }: { children: React.ReactNode }) {
    const { theme } = useTheme();
    const isDark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

    return (
        <ClerkProvider 
            publishableKey={PUBLISHABLE_KEY} 
            appearance={{ baseTheme: isDark ? dark : undefined } as any}
            afterSignOutUrl="/"
            localization={{ userButton: { action__manageAccount: 'Settings' } }}
        >
            {children}
        </ClerkProvider>
    );
}
