import { Tool } from '@goat-sdk/core';
import { EVMWalletClient } from '@goat-sdk/wallet-evm';
import { parseAbi, parseUnits } from 'viem';
import {
  ApproveUsdcParams,
  ApproveTokenParams,
  GetMyTokenBalanceParams,
  SendUsdcParams,
  TransferTokenParams,
  EmptyParams,
} from './parameters.js';

/** Minimal ERC-20 ABI used for balance / transfer / approve calls. */
const erc20Abi = parseAbi([
  'function balanceOf(address account) external view returns (uint256)',
  'function decimals() external view returns (uint8)',
  'function symbol() external view returns (string)',
  'function transfer(address to, uint256 amount) external returns (bool)',
  'function approve(address spender, uint256 amount) external returns (bool)',
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
    console.log(
      `[ERC20Wallet] getMyUsdcBalance called — wallet=${wallet}, usdc=${this.usdcAddress}`,
    );

    try {
      const rawBalance = await walletClient.read({
        address: this.usdcAddress,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [wallet],
      });

      const formatted = Number(rawBalance.value) / 10 ** USDC_DECIMALS;
      const output = `USDC balance for ${wallet}: ${formatted} USDC (${String(rawBalance.value)} base units, ${USDC_DECIMALS} decimals)`;
      console.log(`[ERC20Wallet] getMyUsdcBalance result: ${output}`);
      return output;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error(`[ERC20Wallet] getMyUsdcBalance failed: ${msg}`);
      return `Get USDC balance failed: ${msg}`;
    }
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
    const tokenAddr = (parameters.tokenAddress ?? (parameters as any).token_address) as `0x${string}`;
    console.log(
      `[ERC20Wallet] getMyTokenBalance called — wallet=${wallet}, token=${tokenAddr}`,
    );

    try {
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
      const output = `${symbol} balance for ${wallet}: ${formatted} ${symbol} (${String(rawBalance.value)} base units, ${decimals} decimals)`;
      console.log(`[ERC20Wallet] getMyTokenBalance result: ${output}`);
      return output;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error(`[ERC20Wallet] getMyTokenBalance failed: ${msg}`);
      return `Get token balance failed: ${msg}`;
    }
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
    console.log(
      `[ERC20Wallet] sendUsdc called — to=${to}, amount=${amount} USDC (${baseUnits} base units), usdc=${this.usdcAddress}`,
    );

    try {
      const { hash } = await walletClient.sendTransaction({
        to: this.usdcAddress,
        abi: erc20Abi,
        functionName: 'transfer',
        args: [to, baseUnits],
      });
      console.log(`[ERC20Wallet] sendUsdc tx sent — hash=${hash}`);
      return `Sent ${amount} USDC to ${to}. Transaction hash: ${hash}`;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error(`[ERC20Wallet] sendUsdc failed: ${msg}`);
      return `Send USDC failed: ${msg}`;
    }
  }

  @Tool({
    description:
      'Transfer any ERC20 token from the agent wallet to another address. Provide the token contract address, recipient, and amount in human-readable units (e.g. "100" for 100 tokens). Decimal conversion is handled automatically by reading the token contract.',
  })
  async transferToken(
    walletClient: EVMWalletClient,
    parameters: TransferTokenParams,
  ): Promise<string> {
    const tokenAddr = String(parameters.tokenAddress ?? (parameters as any).token_address) as `0x${string}`;
    const amount = String(parameters.amount);
    const to = String(parameters.to);
    console.log(
      `[ERC20Wallet] transferToken called — token=${tokenAddr}, to=${to}, amount=${amount}`,
    );

    try {
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
      console.log(`[ERC20Wallet] transferToken tx sent — hash=${hash}`);
      return `Sent ${amount} tokens to ${to}. Transaction hash: ${hash}`;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error(`[ERC20Wallet] transferToken failed: ${msg}`);
      return `Transfer token failed: ${msg}`;
    }
  }

  @Tool({
    description:
      'Approve a spender to spend USDC from the agent wallet. Provide the spender address and amount in human-readable USDC (e.g. "10" for 10 USDC).',
  })
  async approveUsdc(
    walletClient: EVMWalletClient,
    parameters: ApproveUsdcParams,
  ): Promise<string> {
    const amount = String(parameters.amount);
    const spender = String(parameters.spender);
    const baseUnits = parseUnits(amount, USDC_DECIMALS);
    console.log(
      `[ERC20Wallet] approveUsdc called — spender=${spender}, amount=${amount} USDC (${baseUnits} base units), usdc=${this.usdcAddress}`,
    );

    try {
      const { hash } = await walletClient.sendTransaction({
        to: this.usdcAddress,
        abi: erc20Abi,
        functionName: 'approve',
        args: [spender, baseUnits],
      });
      console.log(`[ERC20Wallet] approveUsdc tx sent — hash=${hash}`);
      return `Approved ${amount} USDC for ${spender}. Transaction hash: ${hash}`;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error(`[ERC20Wallet] approveUsdc failed: ${msg}`);
      return `Approve USDC failed: ${msg}`;
    }
  }

  @Tool({
    description:
      'Approve a spender to spend any ERC20 token from the agent wallet. Provide the token address, spender address, and amount in human-readable units (e.g. "100" for 100 tokens). Decimal conversion is handled automatically.',
  })
  async approveToken(
    walletClient: EVMWalletClient,
    parameters: ApproveTokenParams,
  ): Promise<string> {
    const tokenAddr = String(parameters.tokenAddress ?? (parameters as any).token_address) as `0x${string}`;
    const amount = String(parameters.amount);
    const spender = String(parameters.spender);
    console.log(
      `[ERC20Wallet] approveToken called — token=${tokenAddr}, spender=${spender}, amount=${amount}`,
    );

    try {
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
        functionName: 'approve',
        args: [spender, baseUnits],
      });
      console.log(`[ERC20Wallet] approveToken tx sent — hash=${hash}`);
      return `Approved ${amount} tokens (${tokenAddr}) for ${spender}. Transaction hash: ${hash}`;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error(`[ERC20Wallet] approveToken failed: ${msg}`);
      return `Approve token failed: ${msg}`;
    }
  }
}
