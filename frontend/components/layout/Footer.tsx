import Link from "next/link";
import React from "react";
import { Mail, Instagram, Twitter } from "lucide-react";

const Footer: React.FC = () => {
  return (
    <footer className="bg-primary text-white pt-16 pb-16 px-6 mt-auto">
      <div className="container mx-auto max-w-6xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-10 md:gap-12">
          {/* Brand Column */}
          <div className="col-span-1 sm:col-span-2 text-center sm:text-left">
            <Link
              href="/"
              className="text-3xl font-black text-white tracking-tighter hover:opacity-80 transition-opacity mb-4 block"
            >
              OCTOSIGHT
            </Link>
            <p className="text-white/80 text-sm leading-relaxed mb-8 max-w-sm mx-auto sm:mx-0 font-medium">
              Empowering users to detect and report phishing threats with
              advanced AI-driven analysis and real-time security intelligence.
            </p>
            <div className="space-y-1">
              <span className="text-xs font-bold text-white block tracking-wide">
                Developed by
              </span>
              <div className="text-white text-base font-bold">
                Team CyberSentinel (Universitas Brawijaya)
              </div>
              <div className="text-white/80 text-sm font-medium">
                for CIMB Niaga Capstone Project
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="text-center sm:text-left">
            <h4 className="text-white font-bold mb-6 text-sm tracking-wider">
              Navigation
            </h4>
            <ul className="space-y-4">
              <li>
                <Link
                  href="/"
                  className="text-white hover:opacity-80 text-sm transition-colors font-medium"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href="/report"
                  className="text-white hover:opacity-80 text-sm transition-colors font-medium"
                >
                  Report Incident
                </Link>
              </li>
              <li>
                <Link
                  href="/status"
                  className="text-white hover:opacity-80 text-sm transition-colors font-medium"
                >
                  Check Status
                </Link>
              </li>
              <li>
                <Link
                  href="/edu"
                  className="text-white hover:opacity-80 text-sm transition-colors font-medium"
                >
                  E-Learning
                </Link>
              </li>
            </ul>
          </div>

          {/* Support/Legal */}
          <div className="text-center sm:text-left">
            <h4 className="text-white font-bold mb-6 text-sm tracking-wider">
              Resources
            </h4>
            <ul className="space-y-4">
              <li>
                <Link
                  href="#"
                  className="text-white hover:opacity-80 text-sm transition-colors font-medium"
                >
                  Documentation
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-white hover:opacity-80 text-sm transition-colors font-medium"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-white hover:opacity-80 text-sm transition-colors font-medium"
                >
                  Terms of Use
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact & Social */}
          <div className="text-center sm:text-left">
            <h4 className="text-white font-bold mb-6 text-sm tracking-wider">
              Connect
            </h4>
            <div className="flex flex-col items-center sm:items-start gap-5">
              <a
                href="mailto:support@octosight.id"
                className="flex items-center gap-3 text-white hover:opacity-80 text-sm transition-colors font-medium"
              >
                <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
                  <Mail className="h-4 w-4" />
                </div>
                support@octosight.id
              </a>
              <a
                href="#"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-white hover:opacity-80 text-sm transition-colors font-medium"
              >
                <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
                  <Instagram className="h-4 w-4" />
                </div>
                @octosight_web
              </a>
              <a
                href="#"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-white hover:opacity-80 text-sm transition-colors font-medium"
              >
                <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
                  <Twitter className="h-4 w-4" />
                </div>
                @octosight_web
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
