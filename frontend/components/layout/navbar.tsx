"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Main app navigation (Leaderboard, Create Agent, Arena) with wallet connect (Privy).
 * No props; uses pathname and auth state internally.
 */
export function Navbar() {
  const pathname = usePathname();
  const { login, logout, authenticated, user } = usePrivy();

  const navItems = [
    { href: "/", label: "Leaderboard" },
    { href: "/create", label: "Create Agent" },
    { href: "/arena", label: "Arena" },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center px-4">
        <div className="mr-8">
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
        </div>

        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <nav className="flex items-center space-x-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-primary",
                  pathname === item.href
                    ? "text-primary"
                    : "text-muted-foreground"
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center space-x-4">
            {authenticated ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-muted-foreground">
                  {user?.wallet?.address
                    ? `${user.wallet.address.slice(0, 6)}...${user.wallet.address.slice(-4)}`
                    : "Connected"}
                </span>
                <Button variant="outline" size="sm" onClick={logout}>
                  Disconnect
                </Button>
              </div>
            ) : (
              <Button size="sm" onClick={login}>
                Connect Wallet
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
