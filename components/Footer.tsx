import Link from "next/link";
import { Github, Globe, Instagram, MessageCircle } from "lucide-react";
import Image from "next/image";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const socialLinks = [
    {
      name: "Instagram",
      href: "https://instagram.com/codebreakersgcek",
      icon: Instagram,
    },
    {
      name: "X (Twitter)",
      href: "https://x.com/codebreakersgcek",
      icon: () => (
        <svg
          viewBox="0 0 24 24"
          className="h-5 w-5"
          fill="currentColor"
        >
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
    },
    {
      name: "Discord",
      href: "https://discord.gg/codebreakersgcek",
      icon: MessageCircle,
    },
    {
      name: "GitHub",
      href: "https://github.com/codebreakers-gcek",
      icon: Github,
    },
    {
      name: "Website",
      href: "https://codebreakersgcek.tech",
      icon: Globe,
    },
  ];

  return (
    <footer className="border-t border-border bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo and Copyright */}
          <div className="flex flex-col items-center md:items-start gap-3">
            <div className="flex items-center gap-2">
              <Image
                src="/assets/logo.png"
                alt="Codebreakers Logo"
                width={32}
                height={32}
                priority
              />
              <span className="text-lg font-bold">Codebreakers Blog</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © {currentYear} Codebreakers. All rights reserved.
            </p>
          </div>

          {/* Social Links */}
          <div className="flex items-center gap-4">
            {socialLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={link.name}
                >
                  <Icon />
                </Link>
              );
            })}
          </div>
        </div>

        {/* Additional Links */}
        <div className="mt-6 pt-6 border-t border-border">
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
            <Link href="https://www.codebreakersgcek.tech/" className="hover:text-foreground transition-colors">
              About
            </Link>
            <span>•</span>
            <Link href="https://www.codebreakersgcek.tech/privacy" className="hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
            <span>•</span>
            <Link href="https://www.codebreakersgcek.tech/terms" className="hover:text-foreground transition-colors">
              Terms of Service
            </Link>
            <span>•</span>
            <Link href="https://www.codebreakersgcek.tech/contact" className="hover:text-foreground transition-colors">
              Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
