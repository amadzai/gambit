'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { usePrivy } from '@privy-io/react-auth';
import { toast } from 'sonner';
import { useConnection, useReadContract, useWriteContract } from 'wagmi';
import { Plus, Droplets, LogOut, Loader2 } from 'lucide-react';
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
import { baseSepolia } from 'wagmi/chains';
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
  const [createModalOpen, setCreateModalOpen] = useState(false);
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
      toast.success('USDC received.');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Faucet request failed.';
      toast.error(message);
    }
  };

  const navLinks = [
    { href: '/dashboard', label: 'Marketplace' },
    { href: '/my-dashboard', label: 'Dashboard' },
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
                      ? 'text-violet-400 font-medium'
                      : 'text-slate-300 hover:text-white transition-colors'
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
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="bg-slate-800 border-slate-700 text-white px-6 py-2.5 rounded-lg text-sm hover:bg-slate-700 hover:text-white"
                    >
                      {user?.wallet?.address
                        ? `${user.wallet.address.slice(0, 6)}...${user.wallet.address.slice(-4)}`
                        : 'Connected'}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-52 bg-slate-900 border-slate-700"
                  >
                    {usdcAddress && (
                      <>
                        <div className="px-2 py-2 text-xs text-slate-400 border-b border-slate-700">
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
