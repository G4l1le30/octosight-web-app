import Link from "next/link";
import React from "react";

const Footer: React.FC = () => {
  return (
    <footer className="bg-secondary text-white py-8 border-t border-neutral-border">
      <div className="container mx-auto px-4 text-center">
        <p className="text-sm opacity-80">© 2026 OctoSight. Developed by Team CyberSentinel (Universitas Brawijaya) for CIMB Niaga Simulator.</p>
        <div className="flex justify-center gap-4 mt-4 text-xs opacity-60">
          <Link href="#">Terms of Use</Link>
          <Link href="#">Privacy Policy</Link>
          <Link href="#">Contact Center</Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
