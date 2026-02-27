import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import StoreProvider from "./redux/provider";
import Navbar from "./componets/navbar/Navbar";
import Footer from "./componets/footer/Footer";
import ErrorBoundary from "./componets/shared/ErrorBoundary";
import ErrorSuppression from "./componets/shared/ErrorSuppression";
import AuthProvider from "../lib/AuthProvider";
import ReactQueryProvider from "@/lib/ReactQueryProvider";
import SkipNavigation from "./componets/shared/SkipNavigation";
import DataInitializer from "./componets/shared/DataInitializer";
import { Analytics } from "@vercel/analytics/next"
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: 'swap',
  preload: true,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: 'swap',
  preload: true,
});

export const metadata = {
  title: "Digicam Market - Premium Camera Store",
  description: "Discover professional cameras and photography equipment at Digicam Market. Quality cameras and accessories for photographers of all levels.",
  keywords: "cameras, DSLR, mirrorless, photography, digital cameras, camera lenses, photography equipment, online camera store, Digicam Market",
  authors: [{ name: "Digicam Market" }],
  creator: "Digicam Market",
  publisher: "Digicam Market",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://digicammarket.com'),
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ErrorSuppression />
        <AuthProvider>
          <StoreProvider>
            <ReactQueryProvider>
                <DataInitializer>
                  <SkipNavigation />
                  <div className="flex flex-col min-h-screen bg-white text-black">
                    <Navbar />
                    <main id="main-content" className="flex-grow" tabIndex={-1}>
                      {children}
                    </main>
                    <Footer />
                  </div>
                </DataInitializer>
            </ReactQueryProvider>
          </StoreProvider>
        </AuthProvider>
        <Analytics/>
      </body>
    </html>
  );
}
