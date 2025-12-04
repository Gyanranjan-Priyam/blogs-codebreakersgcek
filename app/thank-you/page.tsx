import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Heart, Mail, Phone, Home } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FaDiscord, FaInstagram, FaWhatsapp } from "react-icons/fa";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Thank You",
  description: "Thank you for your interest in CodeBreakers",
};

export default function ThankYouPage() {
  return (
    <div className="min-h-screen bg-linear-to-br flex items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-8">
        {/* Main Thank You Card */}
        <Card className="border-2 bg-green-200/10 shadow-xl mt-10">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-4 bg-green-100 rounded-full p-3 w-16 h-16 flex items-center justify-center animate-pulse">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-3xl font-bold text-white mb-2">
              Thank You for Your Interest!
            </CardTitle>
            <CardDescription className="text-lg font-bold text-white/60">
              Registration for CodeBreakers events is currently closed
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center space-y-4">
              <p className="text-white leading-relaxed">
                We appreciate your enthusiasm for participating in <span className="font-semibold text-amber-500">CodeBreakers</span>, 
                the flagship technical fest of Government College of Engineering Kalahandi, Bhawanipatna (GCEK).
              </p>

              <div className="bg-amber-100/60 border border-amber-200 rounded-lg p-4">
                <p className="text-white text-xl font-medium mb-2 flex items-center justify-center gap-2">
                  <Heart className="w-5 h-5" />
                  Stay Connected with Us
                </p>
                <p className="text-black font-bold text-sm">
                  Registration will reopen soon! Follow our official channels for the latest updates 
                  and announcements about upcoming events and competitions.
                </p>
              </div>
            </div>

            {/* Contact Information */}
            <div className="border-t pt-6">
              <h3 className="font-semibold text-amber-100 text-xl mb-4 text-center">Get in Touch</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Mail className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-gray-900">Email</p>
                    <p className="text-sm font-semibold text-gray-600">CodeBreakers.gcekbpatna@gmail.com</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Phone className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-medium text-gray-900">Phone</p>
                    <p className="text-sm text-gray-600">+91 XXXXX XXXXX</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Social Media Links */}
            <div className="text-center mt-10 space-y-3">
              <p className="text-amber-100">Follow us on social media for updates:</p>
              <div className="flex justify-center space-x-4">
                <Button variant="outline" size="sm" asChild>
                  <Link href="https://instagram.com/CodeBreakers.gcek" target="_blank">
                    <FaInstagram/> Instagram
                  </Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link href="https://facebook.com/CodeBreakers.gcek" target="_blank">
                    <FaWhatsapp/> WhatsApp
                  </Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link href="https://linkedin.com/company/CodeBreakers" target="_blank">
                    <FaDiscord/> Discord
                  </Link>
                </Button>
              </div>
            </div>

            {/* Back to Home */}
            <div className="text-center pt-4">
              <Button asChild className="bg-indigo-600 hover:bg-indigo-700">
                <Link href="/">
                  <Home className="w-4 h-4 mr-2" />
                  Back to Home
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}