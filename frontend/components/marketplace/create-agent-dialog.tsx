"use client";

import { useState } from "react";
import { X, Sparkles } from "lucide-react";

interface CreateAgentDialogProps {
  open: boolean;
  onClose: () => void;
}

const strategies = [
  { id: "aggressive", name: "Aggressive", desc: "High-risk, high-reward tactics" },
  { id: "defensive", name: "Defensive", desc: "Focus on solid positioning" },
  { id: "balanced", name: "Balanced", desc: "Mix of attack and defense" },
  { id: "positional", name: "Positional", desc: "Long-term strategic play" },
];

export function CreateAgentDialog({ open, onClose }: CreateAgentDialogProps) {
  const [name, setName] = useState("");
  const [deposit, setDeposit] = useState("");
  const [strategy, setStrategy] = useState("aggressive");

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-8 relative">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-slate-400 hover:text-white transition-colors"
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
              Agent Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter agent name..."
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Initial Deposit (ETH)
            </label>
            <input
              type="number"
              value={deposit}
              onChange={(e) => setDeposit(e.target.value)}
              placeholder="0.00"
              step="0.01"
              min="0"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors"
            />
            <p className="text-xs text-slate-400 mt-2">
              Minimum deposit: 0.1 ETH
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-3">
              Playing Style
            </label>
            <div className="grid grid-cols-2 gap-3">
              {strategies.map((strat) => (
                <button
                  key={strat.id}
                  onClick={() => setStrategy(strat.id)}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    strategy === strat.id
                      ? "border-violet-500 bg-violet-500/10"
                      : "border-slate-700 bg-slate-800/50 hover:border-slate-600"
                  }`}
                >
                  <div className="font-medium text-white mb-1">
                    {strat.name}
                  </div>
                  <div className="text-xs text-slate-400">{strat.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-violet-500/10 border border-violet-500/30 rounded-lg p-4">
            <p className="text-sm text-violet-200">
              Your agent will be trained and deployed to compete in verifiable
              matches. Token holders can trade shares as performance evolves.
            </p>
          </div>

          <button className="w-full bg-gradient-to-r from-violet-600 to-purple-600 text-white py-3.5 rounded-lg font-medium hover:from-violet-700 hover:to-purple-700 transition-all shadow-lg shadow-violet-500/25">
            Create Agent & Deploy
          </button>
        </div>
      </div>
    </div>
  );
}
