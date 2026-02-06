"use client";

import { useState } from "react";

interface TradePanelProps {
  price: number;
  agentName?: string;
}

export function TradePanel({ price, agentName }: TradePanelProps) {
  const [tradeAmount, setTradeAmount] = useState("");
  const [tradeType, setTradeType] = useState<"buy" | "sell">("buy");

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 sticky top-6">
      <h2 className="text-xl font-bold text-white mb-6">
        Trade {agentName ? `${agentName} ` : ""}Shares
      </h2>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTradeType("buy")}
          className={`flex-1 py-2.5 rounded-lg font-medium transition-colors ${
            tradeType === "buy"
              ? "bg-green-600 text-white"
              : "bg-slate-800 text-slate-400 hover:bg-slate-700"
          }`}
        >
          Buy
        </button>
        <button
          onClick={() => setTradeType("sell")}
          className={`flex-1 py-2.5 rounded-lg font-medium transition-colors ${
            tradeType === "sell"
              ? "bg-red-600 text-white"
              : "bg-slate-800 text-slate-400 hover:bg-slate-700"
          }`}
        >
          Sell
        </button>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Amount (ETH)
        </label>
        <input
          type="number"
          value={tradeAmount}
          onChange={(e) => setTradeAmount(e.target.value)}
          placeholder="0.00"
          step="0.01"
          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors"
        />
      </div>

      <div className="bg-slate-800/50 rounded-lg p-4 mb-6 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-slate-400">Price per share</span>
          <span className="text-white font-medium">${price.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-400">Est. shares</span>
          <span className="text-white font-medium">
            {tradeAmount
              ? (parseFloat(tradeAmount) / price).toFixed(2)
              : "0.00"}
          </span>
        </div>
        <div className="flex justify-between text-sm pt-2 border-t border-slate-700">
          <span className="text-slate-400">Platform fee (2%)</span>
          <span className="text-white font-medium">
            {tradeAmount
              ? (parseFloat(tradeAmount) * 0.02).toFixed(4)
              : "0.00"}{" "}
            ETH
          </span>
        </div>
      </div>

      <button
        className={`w-full py-3.5 rounded-lg font-medium transition-all ${
          tradeType === "buy"
            ? "bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg shadow-green-500/25"
            : "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg shadow-red-500/25"
        }`}
      >
        {tradeType === "buy" ? "Buy Shares" : "Sell Shares"}
      </button>

      <div className="mt-6 pt-6 border-t border-slate-800">
        <div className="text-sm text-slate-400 mb-2">Your Holdings</div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-slate-300">Shares</span>
          <span className="font-bold text-white">12.5</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-slate-300">Value</span>
          <span className="font-bold text-violet-400">
            ${(12.5 * price).toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}
