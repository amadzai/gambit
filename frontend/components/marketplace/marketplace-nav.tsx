'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { usePrivy } from '@privy-io/react-auth';
import { useConnection, useEnsName, useReadContract, useWriteContract } from 'wagmi';
import { styledToast } from '@/components/ui/sonner';
import { Plus, Droplets, LogOut, Loader2, Menu, X } from 'lucide-react';
import { CreateAgentDialog } from '@/components/marketplace/create-agent-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useWallet } from '@/hooks/useWallet';
import { getUsdcAddress } from '@/lib/contracts/config';
import erc20Abi from '@/lib/contracts/erc20.json';
import { baseSepolia, mainnet } from 'wagmi/chains';
import { useChainId, useSwitchChain } from 'wagmi';

const USDC_DECIMALS = 6;
const FAUCET_AMOUNT = BigInt(10000 * 10 ** USDC_DECIMALS); // 100 USDC

function formatUsdc(balance: bigint | undefined): string {
  if (balance === undefined) return '—';
  const n = Number(balance) / 10 ** USDC_DECIMALS;
  return n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Marketplace header with logo, Dashboard/My Dashboard links, Create Agent button, and wallet connect.
 * Owns CreateAgentDialog; opens it when "Create Agent" is clicked. No props.
 */
export function MarketplaceNav() {
  const pathname = usePathname();
  const { login, logout, authenticated, user } = usePrivy();
  const { address } = useWallet();
  const { data: ensName } = useEnsName({ address: address as `0x${string}` | undefined, chainId: mainnet.id });
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isConnected } = useConnection();
  const chainId = useChainId();
  const { mutateAsync: switchChainAsync } = useSwitchChain();

  useEffect(() => {
    if (!isConnected) return;

    if (chainId !== baseSepolia.id) {
      switchChainAsync({ chainId: baseSepolia.id }).catch(() => {
        // user rejected or wallet doesn't support programmatic switching
      });
    }
  }, [isConnected, chainId, switchChainAsync]);
  const usdcAddress = (() => {
    try {
      return getUsdcAddress();
    } catch {
      return undefined;
    }
  })();

  const { data: usdcBalance, refetch: refetchUsdc } = useReadContract({
    address: usdcAddress,
    abi: erc20Abi as readonly unknown[],
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: baseSepolia.id,
  });

  const { mutateAsync: writeContractMutateAsync, isPending: isFaucetPending } =
    useWriteContract();

  const handleFaucet = async () => {
    if (!usdcAddress) return;
    try {
      await writeContractMutateAsync({
        address: usdcAddress,
        abi: erc20Abi as readonly unknown[],
        functionName: 'faucet',
        args: [FAUCET_AMOUNT],
        chainId: baseSepolia.id,
      });
      await refetchUsdc();
      styledToast.success({
        title: 'USDC Received',
        description: 'Successfully received USDC from faucet.',
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Faucet request failed.';
      styledToast.error({ title: 'Faucet Failed', description: message });
    }
  };

  const navLinks = [
    { href: '/dashboard', label: 'Marketplace' },
    { href: '/my-dashboard', label: 'Dashboard' },
  ];

  return (
    <>
      <header className="border-b border-neutral-800 bg-neutral-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-5">
          <div className="relative flex items-center justify-between">
            {/* Left – Create Agent (desktop only) */}
            <button
              type="button"
              onClick={() => setCreateModalOpen(true)}
              className="hidden md:inline-flex items-center gap-2 bg-gradient-to-r from-brand-600 to-brand-500 text-white px-6 py-2 rounded-lg font-medium hover:from-brand-700 hover:to-brand-600 transition-all shadow-lg shadow-brand-500/25"
            >
              <Plus className="w-4 h-4" />
              Create Agent
            </button>

            {/* Center – Logo (always visible) */}
            <Link
              href="/"
              className="md:absolute md:left-1/2 md:-translate-x-1/2 flex items-center"
            >
              <Image
                src="/gambitWhite.png"
                alt="gambAIt"
                width={140}
                height={50}
                className="h-10 md:h-13 w-auto"
                priority
              />
            </Link>

            {/* Right – Desktop nav */}
            <div className="hidden md:flex items-center gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={
                    pathname === link.href
                      ? 'text-brand-400 font-medium'
                      : 'text-neutral-300 hover:text-white transition-colors'
                  }
                >
                  {link.label}
                </Link>
              ))}
              {authenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="bg-neutral-800 border-neutral-700 text-white px-6 py-2.5 rounded-lg text-sm hover:bg-neutral-700 hover:text-white"
                    >
                      {ensName ?? (user?.wallet?.address
                        ? `${user.wallet.address.slice(0, 6)}...${user.wallet.address.slice(-4)}`
                        : 'Connected')}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-52 bg-neutral-900 border-neutral-700"
                  >
                    {usdcAddress && (
                      <>
                        <div className="px-2 py-2 text-xs text-neutral-400 border-b border-neutral-700">
                          {formatUsdc(usdcBalance as bigint | undefined)} USDC
                        </div>
                        <DropdownMenuItem
                          onClick={() => {
                            handleFaucet();
                          }}
                          disabled={isFaucetPending}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          {isFaucetPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Droplets className="h-4 w-4" />
                          )}
                          {isFaucetPending ? 'Minting…' : 'Faucet'}
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuItem
                      onClick={() => logout()}
                      className="flex items-center gap-2 text-red-400 focus:text-red-400 focus:bg-red-500/10"
                      variant="destructive"
                    >
                      <LogOut className="h-4 w-4" />
                      Disconnect
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <button
                  onClick={login}
                  className="bg-gradient-to-r from-brand-600 to-brand-500 text-white px-6 py-2 rounded-lg font-medium hover:from-brand-700 hover:to-brand-600 transition-all"
                >
                  Connect Wallet
                </button>
              )}
            </div>

            {/* Right – Mobile hamburger */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              className="md:hidden p-2 text-neutral-300 hover:text-white transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>

          {/* Mobile menu panel */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-4 pb-2 border-t border-neutral-800 pt-4 flex flex-col gap-3">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block py-2 px-3 rounded-lg transition-colors ${
                    pathname === link.href
                      ? 'text-brand-400 font-medium bg-brand-500/10'
                      : 'text-neutral-300 hover:text-white hover:bg-neutral-800/50'
                  }`}
                >
                  {link.label}
                </Link>
              ))}

              <button
                type="button"
                onClick={() => {
                  setCreateModalOpen(true);
                  setMobileMenuOpen(false);
                }}
                className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-brand-600 to-brand-500 text-white px-6 py-2.5 rounded-lg font-medium hover:from-brand-700 hover:to-brand-600 transition-all shadow-lg shadow-brand-500/25"
              >
                <Plus className="w-4 h-4" />
                Create Agent
              </button>

              {authenticated ? (
                <div className="flex flex-col gap-2 bg-neutral-800/50 rounded-lg p-3">
                  <div className="text-sm text-neutral-300 truncate">
                    {user?.wallet?.address
                      ? `${user.wallet.address.slice(0, 6)}...${user.wallet.address.slice(-4)}`
                      : 'Connected'}
                  </div>
                  {usdcAddress && (
                    <>
                      <div className="text-xs text-neutral-400">
                        {formatUsdc(usdcBalance as bigint | undefined)} USDC
                      </div>
                      <button
                        onClick={() => {
                          handleFaucet();
                        }}
                        disabled={isFaucetPending}
                        className="inline-flex items-center justify-center gap-2 text-sm text-neutral-300 hover:text-white bg-neutral-700 hover:bg-neutral-600 rounded-lg px-4 py-2 transition-colors disabled:opacity-50"
                      >
                        {isFaucetPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Droplets className="h-4 w-4" />
                        )}
                        {isFaucetPending ? 'Minting…' : 'Faucet'}
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                    }}
                    className="inline-flex items-center justify-center gap-2 text-sm text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 rounded-lg px-4 py-2 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Disconnect
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    login();
                    setMobileMenuOpen(false);
                  }}
                  className="bg-gradient-to-r from-brand-600 to-brand-500 text-white px-6 py-2.5 rounded-lg font-medium hover:from-brand-700 hover:to-brand-600 transition-all text-center"
                >
                  Connect Wallet
                </button>
              )}
            </div>
          )}
        </div>
      </header>

      <CreateAgentDialog
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
      />
    </>
  );
}
