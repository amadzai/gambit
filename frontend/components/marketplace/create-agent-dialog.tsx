'use client';

import { useState } from 'react';
import { X, Sparkles, ChevronDown } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { useWriteContract, usePublicClient } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';
import type { AgentPlaystyle, Agent } from '@/types/agent';
import { apiService } from '@/utils/apiService';
import { useWallet } from '@/hooks/useWallet';
import { agentFactoryAbi } from '@/lib/contracts/abis';
import { getAgentFactoryAddress, getUsdcAddress } from '@/lib/contracts/config';
import { maxUint256 } from 'viem';
import { readContract } from 'wagmi/actions';
import { wagmiConfig } from '@/config/wagmiConfig';
import usdcAbi from "@/lib/contracts/erc20.json"

export interface CreateAgentDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated?: (agent: Agent) => void;
}

const PLAYSTYLES: { value: AgentPlaystyle; name: string; desc: string }[] = [
  {
    value: 'AGGRESSIVE',
    name: 'Aggressive',
    desc: 'High-risk, high-reward tactics',
  },
  { value: 'DEFENSIVE', name: 'Defensive', desc: 'Focus on solid positioning' },
  { value: 'POSITIONAL', name: 'Positional', desc: 'Long-term strategic play' },
];

const SAN_OPENINGS = ['e4', 'd4', 'c4', 'Nf3', 'g3', 'b3', 'f4'] as const;

const DEFAULT_PLAYSTYLE: AgentPlaystyle = 'AGGRESSIVE';

const USDC_AMOUNT = BigInt(1_000_000_000); // 100 USDC (6 decimals)

function deriveSymbol(name: string): string {
  return name.trim().split(/\s+/)[0].toUpperCase().slice(0, 6);
}

/**
 * Modal for creating a new agent. Creates in DB, deploys on-chain via AgentFactory,
 * then registers the token address.
 */
export function CreateAgentDialog({
  open,
  onClose,
  onCreated,
}: CreateAgentDialogProps) {
  const { address, authenticated, login } = useWallet();
  const { mutateAsync: writeContractMutateAsync } = useWriteContract();
  const publicClient = usePublicClient({ chainId: baseSepolia.id });
  const [name, setName] = useState('');
  const [playstyle, setPlaystyle] = useState<AgentPlaystyle>(DEFAULT_PLAYSTYLE);
  const [opening, setOpening] = useState('');
  const [personality, setPersonality] = useState('');
  const [profileImage, setProfileImage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setName('');
    setPlaystyle(DEFAULT_PLAYSTYLE);
    setOpening('');
    setPersonality('');
    setProfileImage('');
    setError(null);
    setStatusText('');
  };

  const handleClose = () => {
    if (isSubmitting) return;
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    if (!authenticated) {
      login();
      return;
    }

    if (!publicClient) {
      const msg = 'Wallet not connected. Please connect your wallet.';
      setError(msg);
      toast.error(msg);
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      // Step 1: Create agent in DB
      setStatusText('Creating agent...');
      const agent = await apiService.agent.create({
        name: name.trim(),
        playstyle,
        creator: address,
        opening: opening || undefined,
        personality: personality.trim() || undefined,
        profileImage: profileImage.trim() || undefined,
      });

      const agentWalletAddress = agent.walletAddress;
      if (!agentWalletAddress) {
        const msg =
          'Agent created but no wallet address assigned. Please contact support.';
        setError(msg);
        toast.error(msg);
        setIsSubmitting(false);
        return;
      }

      // Step 2: Derive token symbol
      const symbol = deriveSymbol(name);

      // Step 3: Approve USDC spend
      setStatusText('Approving USDC...');
      const factoryAddress = getAgentFactoryAddress();
      const usdcAddress = getUsdcAddress();

      const allowance = await readContract(wagmiConfig, {
        address: usdcAddress,
        abi: usdcAbi,
        functionName: 'allowance',
        args: [address, factoryAddress],
      }) as bigint
      console.log("allowance: ", allowance);

      if (allowance < BigInt(1000)) {
        const approveHash = await writeContractMutateAsync({
          address: usdcAddress,
          abi: usdcAbi,
          functionName: 'approve',
          args: [factoryAddress, maxUint256],
          chainId: baseSepolia.id,
        });

        await publicClient.waitForTransactionReceipt({ hash: approveHash });
      }


      // Step 4: Call AgentFactory.createAgent
      setStatusText('Deploying agent on-chain...');
      const createHash = await writeContractMutateAsync({
        address: factoryAddress,
        abi: agentFactoryAbi,
        functionName: 'createAgent',
        args: [name.trim(), symbol, USDC_AMOUNT, agentWalletAddress as `0x${string}`],
        chainId: baseSepolia.id,
      });

      await publicClient.waitForTransactionReceipt({ hash: createHash });

      // Step 5: Register token via backend
      setStatusText('Registering token...');
      const updatedAgent = await apiService.agent.registerToken(agent.id, createHash);

      onCreated?.(updatedAgent);
      toast.success('Agent created and deployed on-chain.');
      resetForm();
      onClose();
    } catch (err: unknown) {
      let message: string;
      if (axios.isAxiosError(err)) {
        const raw = err.response?.data?.message ?? err.message;
        message = Array.isArray(raw) ? raw.join(', ') : raw;
      } else if (err instanceof Error) {
        message = err.message;
      } else {
        message = 'Failed to create agent. Please try again.';
      }
      setError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
      setStatusText('');
    }
  };

  const isFormValid = name.trim().length > 0;

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-8 relative">
        <button
          onClick={handleClose}
          disabled={isSubmitting}
          className="absolute top-6 right-6 text-slate-400 hover:text-white transition-colors disabled:opacity-50"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Create New Agent</h2>
            <p className="text-sm text-slate-400">
              Launch your autonomous chess AI
            </p>
          </div>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Agent Name <span className="text-slate-500">(required)</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Magnus Bot, The Aggressor"
              maxLength={30}
              disabled={isSubmitting}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-3">
              Playstyle <span className="text-slate-500">(required)</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {PLAYSTYLES.map((strat) => (
                <button
                  key={strat.value}
                  type="button"
                  onClick={() => setPlaystyle(strat.value)}
                  disabled={isSubmitting}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    playstyle === strat.value
                      ? 'border-violet-500 bg-violet-500/10'
                      : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                  } disabled:opacity-50`}
                >
                  <div className="font-medium text-white mb-1">
                    {strat.name}
                  </div>
                  <div className="text-xs text-slate-400">{strat.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Opening <span className="text-slate-500">(optional)</span>
            </label>
            <div className="relative">
              <select
                value={opening}
                onChange={(e) => setOpening(e.target.value)}
                disabled={isSubmitting}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-4 pr-10 py-3 text-white focus:outline-none focus:border-violet-500 transition-colors appearance-none disabled:opacity-50"
              >
                <option value="">None</option>
                {SAN_OPENINGS.map((move) => (
                  <option key={move} value={move}>
                    {move}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Personality <span className="text-slate-500">(optional)</span>
            </label>
            <textarea
              value={personality}
              onChange={(e) => setPersonality(e.target.value)}
              placeholder="Describe your agent's style or character..."
              rows={3}
              disabled={isSubmitting}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors resize-none disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Profile Image <span className="text-slate-500">(optional)</span>
            </label>
            <input
              type="url"
              value={profileImage}
              onChange={(e) => setProfileImage(e.target.value)}
              placeholder="https://..."
              disabled={isSubmitting}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors disabled:opacity-50"
            />
          </div>

          <div className="bg-violet-500/10 border border-violet-500/30 rounded-lg p-4">
            <p className="text-sm text-violet-200">
              Creating an agent requires a 100 USDC deposit. Your agent will be
              deployed on-chain with its own ERC-20 token.
            </p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={!isFormValid || isSubmitting}
            className="w-full bg-gradient-to-r from-violet-600 to-purple-600 text-white py-3.5 rounded-lg font-medium hover:from-violet-700 hover:to-purple-700 transition-all shadow-lg shadow-violet-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? statusText || 'Processing...' : 'Create Agent & Deploy'}
          </button>
        </div>
      </div>
    </div>
  );
}
