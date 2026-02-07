"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import { Plus } from "lucide-react";
import { CreateAgentDialog } from "@/components/marketplace/create-agent-dialog";

/**
 * Marketplace header with logo, Dashboard/My Dashboard links, Create Agent button, and wallet connect.
 * Owns CreateAgentDialog; opens it when "Create Agent" is clicked. No props.
 */
export function MarketplaceNav() {
  const pathname = usePathname();
  const { login, logout, authenticated, user } = usePrivy();
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const navLinks = [
    { href: "/dashboard", label: "Marketplace" },
    { href: "/my-dashboard", label: "Dashboard" },
  ];

  return (
    <>
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center">
              <Image
                src="/gambitWhite.png"
                alt="gambAIt"
                width={140}
                height={50}
                className="h-12 w-auto"
                priority
              />
            </Link>
            <div className="flex items-center gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={
                    pathname === link.href
                      ? "text-violet-400 font-medium"
                      : "text-slate-300 hover:text-white transition-colors"
                  }
                >
                  {link.label}
                </Link>
              ))}
              <button
                type="button"
                onClick={() => setCreateModalOpen(true)}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white px-6 py-2.5 rounded-lg font-medium hover:from-violet-700 hover:to-purple-700 transition-all shadow-lg shadow-violet-500/25"
              >
                <Plus className="w-4 h-4" />
                Create Agent
              </button>
            {authenticated ? (
              <button
                onClick={logout}
                className="bg-slate-800 text-white px-4 py-2 rounded-lg text-sm hover:bg-slate-700 transition-colors"
              >
                {user?.wallet?.address
                  ? `${user.wallet.address.slice(0, 6)}...${user.wallet.address.slice(-4)}`
                  : "Connected"}
              </button>
            ) : (
              <button
                onClick={login}
                className="bg-gradient-to-r from-violet-600 to-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:from-violet-700 hover:to-purple-700 transition-all"
              >
                Connect Wallet
              </button>
            )}
          </div>
        </div>
      </div>
    </header>

      <CreateAgentDialog
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
      />
    </>
  );
}
