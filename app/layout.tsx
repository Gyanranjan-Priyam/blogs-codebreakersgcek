import type { Metadata } from "next";
import { Source_Code_Pro } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import LenisProvider from "@/components/providers/lenis-provider";
import { Analytics } from "@vercel/analytics/next"
import { ThemeProvider } from "next-themes"
import { SocketProvider } from "@/components/providers/socket-provider";
import Footer from "@/components/Footer";


const sourceCodePro = Source_Code_Pro({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-source-code-pro", 
})

export const metadata: Metadata = {
  title: {
    template: "%s | Codebreakers Blog",
    default: "Codebreakers Blog - A platform for sharing knowledge and insights"
  },
  description: "A platform for sharing knowledge and insights through blogs",
  icons: {
    icon: [
      { url: "/assets/logo.png", sizes: "any" },
    ],
    apple: [
      { url: "/assets/logo.png" },
    ],
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={` ${sourceCodePro.variable} antialiased`}
      >
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <SocketProvider>
            <LenisProvider>
              <div className="flex flex-col min-h-screen">
                <main className="flex-1">
                  {children}
                </main>
                <Footer />
              </div>
            </LenisProvider>
          </SocketProvider>
          <Toaster position="top-center" richColors closeButton />
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  );
}
