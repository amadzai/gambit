import { Tool } from '@goat-sdk/core';
import { EVMWalletClient } from '@goat-sdk/wallet-evm';
import { parseAbi, parseUnits } from 'viem';
import {
  GetMyTokenBalanceParams,
  SendUsdcParams,
  TransferTokenParams,
  EmptyParams,
} from './parameters.js';

/** Minimal ERC-20 ABI used for balance / transfer calls. */
const erc20Abi = parseAbi([
  'function balanceOf(address account) external view returns (uint256)',
  'function decimals() external view returns (uint8)',
  'function symbol() external view returns (string)',
  'function transfer(address to, uint256 amount) external returns (bool)',
]);

/** USDC always uses 6 decimals. */
const USDC_DECIMALS = 6;

export class Erc20WalletService {
  /** USDC contract address on the current chain. */
  private usdcAddress: `0x${string}`;

  constructor(usdcAddress: `0x${string}`) {
    this.usdcAddress = usdcAddress;
  }

  // ─── Balance helpers (wallet address auto-injected) ─────────────────

  @Tool({
    description:
      'Get the USDC balance of the agent wallet on Base Sepolia. No parameters needed — the wallet address and USDC contract are resolved automatically.',
  })
  async getMyUsdcBalance(
    walletClient: EVMWalletClient,
    _parameters: EmptyParams,
  ): Promise<string> {
    void _parameters;
    const wallet = walletClient.getAddress();

    const rawBalance = await walletClient.read({
      address: this.usdcAddress,
      abi: erc20Abi,
      functionName: 'balanceOf',
      args: [wallet],
    });

    const formatted = Number(rawBalance.value) / 10 ** USDC_DECIMALS;

    return `USDC balance for ${wallet}: ${formatted} USDC (${String(rawBalance.value)} base units, ${USDC_DECIMALS} decimals)`;
  }

  @Tool({
    description:
      'Get the balance of any ERC20 token for the agent wallet. Only requires the token contract address — the wallet address is resolved automatically.',
  })
  async getMyTokenBalance(
    walletClient: EVMWalletClient,
    parameters: GetMyTokenBalanceParams,
  ): Promise<string> {
    const wallet = walletClient.getAddress();
    const tokenAddr = parameters.tokenAddress as `0x${string}`;

    const [rawBalance, rawDecimals, rawSymbol] = await Promise.all([
      walletClient.read({
        address: tokenAddr,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [wallet],
      }),
      walletClient.read({
        address: tokenAddr,
        abi: erc20Abi,
        functionName: 'decimals',
      }),
      walletClient.read({
        address: tokenAddr,
        abi: erc20Abi,
        functionName: 'symbol',
      }),
    ]);

    const decimals = Number(rawDecimals.value);
    const symbol = String(rawSymbol.value);
    const formatted = Number(rawBalance.value) / 10 ** decimals;

    return `${symbol} balance for ${wallet}: ${formatted} ${symbol} (${String(rawBalance.value)} base units, ${decimals} decimals)`;
  }

  @Tool({
    description:
      'Send USDC from the agent wallet to another address. Only requires the recipient address and the amount in normal USDC units (e.g. "50" means 50 USDC). The USDC contract address and decimal conversion are handled automatically.',
  })
  async sendUsdc(
    walletClient: EVMWalletClient,
    parameters: SendUsdcParams,
  ): Promise<string> {
    const amount = String(parameters.amount);
    const to = String(parameters.to);
    const baseUnits = parseUnits(amount, USDC_DECIMALS);

    const { hash } = await walletClient.sendTransaction({
      to: this.usdcAddress,
      abi: erc20Abi,
      functionName: 'transfer',
      args: [to, baseUnits],
    });

    return `Sent ${amount} USDC to ${to}. Transaction hash: ${hash}`;
  }

  @Tool({
    description:
      'Transfer any ERC20 token from the agent wallet to another address. Provide the token contract address, recipient, and amount in human-readable units (e.g. "100" for 100 tokens). Decimal conversion is handled automatically by reading the token contract.',
  })
  async transferToken(
    walletClient: EVMWalletClient,
    parameters: TransferTokenParams,
  ): Promise<string> {
    const tokenAddr = String(parameters.tokenAddress) as `0x${string}`;
    const amount = String(parameters.amount);
    const to = String(parameters.to);

    const rawDecimals = await walletClient.read({
      address: tokenAddr,
      abi: erc20Abi,
      functionName: 'decimals',
    });
    const decimals = Number(rawDecimals.value);
    const baseUnits = parseUnits(amount, decimals);

    const { hash } = await walletClient.sendTransaction({
      to: tokenAddr,
      abi: erc20Abi,
      functionName: 'transfer',
      args: [to, baseUnits],
    });

    return `Sent ${amount} tokens to ${to}. Transaction hash: ${hash}`;
  }
}
