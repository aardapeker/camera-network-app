import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useNavigation,
} from "react-router";

import type { Route } from "./+types/root";
import "./app.css";
import { ThemeProvider } from "./contexts/theme-provider";
import { LanguageProvider } from "./contexts/language-provider";
import "./lib/i18n";
import { Toaster } from "./components/ui/sonner";
import LoadingPage from "./routes/loading-page";
import { PwaInstallPrompt } from "./components/pwa-install-prompt";
import { isServicePortalHost } from "./lib/service-portal";

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
  { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
  // Installed to a technician's home screen, the portal host should be the
  // service form app, not the topology app.
  {
    rel: "manifest",
    href: isServicePortalHost()
      ? "/servisform.webmanifest"
      : "/manifest.webmanifest",
  },
];

const themeScript = `
(function() {
  try {
    var stored = localStorage.getItem('vite-ui-theme');
    var theme = stored === 'light' || stored === 'dark' ? stored
      : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.classList.add(theme);
  } catch(e) {}
})();
`;

const langScript = `
(function() {
  try {
    var stored = localStorage.getItem('app-language');
    document.documentElement.lang = stored === 'tr' ? 'tr' : 'en';
  } catch(e) {}
})();
`;

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="FieldDesk" />
        <meta name="theme-color" content="#ffffff" />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <script dangerouslySetInnerHTML={{ __html: langScript }} />
        <Meta />
        <Links />
      </head>
      <body suppressHydrationWarning>
        <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
          <LanguageProvider defaultLanguage="en" storageKey="app-language">
            {children}
            <Toaster />
            <PwaInstallPrompt />
          </LanguageProvider>
        </ThemeProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

function NavigationProgress() {
  const navigation = useNavigation();
  const isNavigating = navigation.state !== "idle";

  return (
    <div
      aria-hidden
      className="fixed top-0 left-0 right-0 z-[10050] h-0.5 overflow-hidden pointer-events-none transition-opacity duration-150"
      style={{ opacity: isNavigating ? 1 : 0 }}
    >
      {isNavigating && (
        <div className="h-full w-1/3 bg-primary animate-nav-progress" />
      )}
    </div>
  );
}

export default function App() {
  return (
    <>
      <NavigationProgress />
      <Outlet />
    </>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}

export function HydrateFallback() {
  return <LoadingPage />;
}
