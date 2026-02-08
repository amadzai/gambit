"use client";

import { useState } from "react";
import { useReadContract } from "wagmi";
import { baseSepolia } from "wagmi/chains";
import { useWallet } from "@/hooks/useWallet";
import { erc20Abi } from "@/lib/contracts/abis";
import { TOKEN_DECIMALS } from "@/lib/contracts/uniswap";
import { styledToast } from "@/components/ui/sonner";
import type { TradePanelHoldings } from "@/types/marketplace";

/**
 * Props for the trade panel. Optional holdings and onBuy/onSell let parents wire real data and handlers.
 */
export interface TradePanelProps {
  /** Current price per share (display and share calculation). */
  price: number;
  /** Optional agent name for the heading. */
  agentName?: string;
  /** Optional. Your current shares and value for this agent (TradePanelHoldings from @/types/marketplace). When omitted, placeholder values may be shown. */
  holdings?: TradePanelHoldings;
  /** Optional. Called when user confirms a buy. Amount is the USDC amount as entered (string). */
  onBuy?: (amount: string) => void;
  /** Optional. Called when user confirms a sell. Amount is the USDC amount as entered (string). */
  onSell?: (amount: string) => void;
}

/**
 * Buy/sell panel for agent shares. Displays price, amount input, estimated shares, and optional holdings. Used on agent page.
 */
const USDC_ADDRESS = (process.env.NEXT_PUBLIC_USDC_ADDRESS ?? "") as `0x${string}`;

export function TradePanel({ price, agentName, holdings, onBuy, onSell }: TradePanelProps) {
  const [tradeAmount, setTradeAmount] = useState("");
  const [tradeType, setTradeType] = useState<"buy" | "sell">("buy");
  const { address: userAddress } = useWallet();

  const { data: rawUsdcBalance } = useReadContract({
    address: USDC_ADDRESS,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: userAddress ? [userAddress] : undefined,
    chainId: baseSepolia.id,
    query: { enabled: !!userAddress && !!USDC_ADDRESS },
  });

  const usdcBalance =
    rawUsdcBalance != null ? Number(rawUsdcBalance) / 10 ** TOKEN_DECIMALS : null;

  const handleTrade = async () => {
    const isBuy = tradeType === "buy";
    const handler = isBuy ? onBuy : onSell;
    if (!handler || !tradeAmount) return;

    const loadingId = styledToast.loading({
      title: isBuy ? "Buying Shares" : "Selling Shares",
      description: isBuy
        ? "Approving USDC and executing swap…"
        : "Approving tokens and executing swap…",
    });

    try {
      await handler(tradeAmount);
      styledToast.dismiss(loadingId);
      styledToast.success({
        title: isBuy ? "Shares Purchased" : "Shares Sold",
        description: isBuy
          ? `Successfully bought ${tradeAmount} USDC worth of shares.`
          : `Successfully sold ${tradeAmount} shares.`,
      });
      setTradeAmount("");
    } catch (err) {
      styledToast.dismiss(loadingId);
      const message = err instanceof Error ? err.message : "Transaction failed.";
      styledToast.error({
        title: isBuy ? "Buy Failed" : "Sell Failed",
        description: message,
      });
    }
  };

  const hasHandler = tradeType === "buy" ? !!onBuy : !!onSell;
  const sharesDisplay = holdings?.shares ?? 12.5;
  const valueDisplay = holdings != null ? holdings.value : 12.5 * price;

  return (
    <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-6 sticky top-6">
      <h2 className="text-xl font-bold text-white mb-6">
        Trade {agentName ? `${agentName} ` : ""}Shares
      </h2>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTradeType("buy")}
          className={`flex-1 py-2.5 rounded-lg font-medium transition-colors !cursor-pointer ${
            tradeType === "buy"
              ? "bg-green-600 text-white"
              : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700"
          }`}
        >
          Buy
        </button>
        <button
          onClick={() => setTradeType("sell")}
          className={`flex-1 py-2.5 rounded-lg font-medium transition-colors !cursor-pointer ${
            tradeType === "sell"
              ? "bg-red-600 text-white"
              : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700"
          }`}
        >
          Sell
        </button>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-neutral-300 mb-2">
          Amount (USDC)
        </label>
        <input
          type="number"
          value={tradeAmount}
          onChange={(e) => setTradeAmount(e.target.value)}
          placeholder="0.00"
          step="0.01"
          className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-3 text-white placeholder-neutral-500 focus:outline-none focus:border-brand-500 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
      </div>

      <div className="bg-neutral-800/50 rounded-lg p-4 mb-6 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-neutral-400">Price per share</span>
          <span className="text-white font-medium">${price.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-neutral-400">Est. shares</span>
          <span className="text-white font-medium">
            {tradeAmount
              ? (parseFloat(tradeAmount) / price).toFixed(2)
              : "0.00"}
          </span>
        </div>
        <div className="flex justify-between text-sm pt-2 border-t border-neutral-700">
          <span className="text-neutral-400">Platform fee (2%)</span>
          <span className="text-white font-medium">
            {tradeAmount
              ? (parseFloat(tradeAmount) * 0.02).toFixed(4)
              : "0.00"}{" "}
            USDC
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={handleTrade}
        disabled={!hasHandler}
        title={!hasHandler ? "Pass onBuy/onSell to enable" : undefined}
        className={`w-full py-3.5 rounded-lg font-medium transition-all ${
          !hasHandler
            ? "bg-neutral-700 text-neutral-400 cursor-not-allowed"
            : tradeType === "buy"
              ? "bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg shadow-green-500/25"
              : "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg shadow-red-500/25"
        }`}
      >
        {tradeType === "buy" ? "Buy Shares" : "Sell Shares"}
      </button>

      <div className="mt-6 pt-6 border-t border-neutral-800">
        <div className="text-sm text-neutral-400 mb-2">Your Holdings</div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-neutral-300">Shares</span>
          <span className="font-bold text-white">{sharesDisplay}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-neutral-300">Value</span>
          <span className="font-bold text-brand-400">
            ${valueDisplay.toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between items-center mt-2 pt-2 border-t border-neutral-700">
          <span className="text-neutral-300">USDC Balance</span>
          <span className="font-bold text-green-400">
            {usdcBalance != null ? `$${usdcBalance.toFixed(2)}` : "—"}
          </span>
        </div>
      </div>
    </div>
  );
}
