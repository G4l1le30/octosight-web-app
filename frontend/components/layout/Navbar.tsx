"use client";

import Link from "next/link";
import React, { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { usePathname } from "next/navigation";

const Navbar: React.FC = () => {
  const { user, loading, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const pathname = usePathname();

  const isAdminRoute = pathname.startsWith("/admin");

  const handleLogout = async () => {
    await logout();
    setProfileOpen(false);
    window.location.href = "/";
  };

  return (
    <header className="sticky top-0 z-[100] bg-white border-b border-neutral-border shadow-sm">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary-dark to-primary-light text-2xl font-black tracking-tight">
            OCTOSIGHT
          </span>
          {isAdminRoute && (
            <span className="ml-1 px-1.5 py-0.5 bg-primary text-sm font-bold text-white rounded uppercase">
              ADMIN
            </span>
          )}
        </Link>
        
        <nav className="hidden md:flex items-center gap-8 h-full">
          {isAdminRoute ? (
            <>
              <Link href="/" className="text-sm font-bold text-secondary hover:text-primary transition-colors h-full flex items-center border-b-2 border-transparent">Home</Link>
              <Link 
                href="/admin" 
                className={`text-sm font-bold transition-colors h-full flex items-center border-b-2 ${pathname === '/admin' ? 'text-primary border-primary' : 'text-secondary hover:text-primary border-transparent'}`}
              >
                Dashboard
              </Link>
              <Link 
                href="/admin/triage" 
                className={`text-sm font-bold transition-colors h-full flex items-center border-b-2 ${pathname === '/admin/triage' ? 'text-primary border-primary' : 'text-secondary hover:text-primary border-transparent'}`}
              >
                Triage
              </Link>
            </>
          ) : (
            <>
              <Link 
                href="/" 
                className={`text-sm font-bold transition-colors h-full flex items-center border-b-2 ${pathname === '/' ? 'text-primary border-primary' : 'text-secondary hover:text-primary border-transparent'}`}
              >
                Home
              </Link>
              <Link 
                href="/report" 
                className={`text-sm font-bold transition-colors h-full flex items-center border-b-2 ${pathname === '/report' ? 'text-primary border-primary' : 'text-secondary hover:text-primary border-transparent'}`}
              >
                Report Incident
              </Link>
              <Link 
                href="/status" 
                className={`text-sm font-bold transition-colors h-full flex items-center border-b-2 ${pathname === '/status' ? 'text-primary border-primary' : 'text-secondary hover:text-primary border-transparent'}`}
              >
                Check Status
              </Link>
              <Link 
                href="/edu" 
                className={`text-sm font-bold transition-colors h-full flex items-center border-b-2 ${pathname === '/edu' ? 'text-primary border-primary' : 'text-secondary hover:text-primary border-transparent'}`}
              >
                E-Learning
              </Link>
            </>
          )}
          
          <div className="w-px h-4 bg-neutral-border mx-1"></div>

          {loading ? (
            <div className="w-20 h-8 bg-neutral-page rounded-lg animate-pulse"></div>
          ) : user ? (
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 px-3 py-1.5 border border-neutral-border rounded-lg hover:border-primary/30 transition-all"
              >
                <div className="w-7 h-7 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xs font-black">
                  {user.full_name.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-bold text-secondary max-w-[120px] truncate">{user.full_name}</span>
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-3.5 w-3.5 text-secondary/40 transition-transform ${profileOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {profileOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)}></div>
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-neutral-border rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="px-4 py-3 border-b border-neutral-border bg-neutral-page">
                      <p className="text-sm font-bold text-secondary truncate">{user.full_name}</p>
                      <p className="text-xs text-secondary/60 truncate">{user.email}</p>
                      <span className={`inline-block mt-1 text-xs font-bold px-2 py-0.5 rounded ${
                        user.role === 'admin' ? 'bg-primary/10 text-primary' : 'bg-neutral-border text-secondary/60'
                      }`}>
                        {user.role}
                      </span>
                    </div>
                    {user.role === "admin" && (
                      <Link
                        href="/admin"
                        onClick={() => setProfileOpen(false)}
                        className="block px-4 py-2.5 text-sm font-bold text-secondary hover:bg-neutral-page transition-colors"
                      >
                        Admin Dashboard
                      </Link>
                    )}
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2.5 text-sm font-bold text-risk-high hover:bg-risk-high/5 transition-colors"
                    >
                      Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login" className="text-sm font-bold text-secondary hover:text-primary px-3 py-1.5 transition-colors">Sign In</Link>
              <Link href="/register" className="text-sm font-bold text-white bg-primary hover:bg-primary-dark px-4 py-1.5 rounded-lg transition-all">Register</Link>
            </div>
          )}
        </nav>
        
        {/* Mobile menu button */}
        <button className="md:hidden text-secondary p-2" onClick={() => setMobileOpen(!mobileOpen)}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={mobileOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16m-7 6h7"} />
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-neutral-border px-4 py-4 space-y-2 animate-in slide-in-from-top-2 duration-200">
          {isAdminRoute ? (
            <>
              <Link href="/" onClick={() => setMobileOpen(false)} className="block py-2 text-sm font-medium hover:text-primary">Home</Link>
              <Link href="/admin" onClick={() => setMobileOpen(false)} className="block py-2 text-sm font-medium hover:text-primary">Dashboard</Link>
              <Link href="/admin/triage" onClick={() => setMobileOpen(false)} className="block py-2 text-sm font-medium hover:text-primary">Triage</Link>
            </>
          ) : (
            <>
              <Link href="/" onClick={() => setMobileOpen(false)} className="block py-2 text-sm font-medium hover:text-primary">Home</Link>
              <Link href="/report" onClick={() => setMobileOpen(false)} className="block py-2 text-sm font-medium hover:text-primary">Report Incident</Link>
              <Link href="/status" onClick={() => setMobileOpen(false)} className="block py-2 text-sm font-medium hover:text-primary">Check Status</Link>
              <Link href="/edu" onClick={() => setMobileOpen(false)} className="block py-2 text-sm font-medium hover:text-primary">E-Learning</Link>
            </>
          )}
          
          <div className="border-t border-neutral-border pt-3 mt-3">
            {user ? (
              <>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xs font-black">
                    {user.full_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-bold">{user.full_name}</p>
                    <p className="text-xs text-secondary/60">{user.email}</p>
                  </div>
                </div>
                {user.role === "admin" && (
                  <Link href="/admin" onClick={() => setMobileOpen(false)} className="block py-2 text-sm font-bold text-primary">Admin Dashboard</Link>
                )}
                <button onClick={handleLogout} className="block w-full text-left py-2 text-sm font-bold text-risk-high">Sign Out</button>
              </>
            ) : (
              <div className="flex gap-2">
                <Link href="/login" onClick={() => setMobileOpen(false)} className="flex-1 text-center py-2 text-sm font-bold border border-neutral-border rounded-lg">Sign In</Link>
                <Link href="/register" onClick={() => setMobileOpen(false)} className="flex-1 text-center py-2 text-sm font-bold bg-primary text-white rounded-lg">Register</Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
