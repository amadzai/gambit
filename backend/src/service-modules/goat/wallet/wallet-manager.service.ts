import { Injectable, Logger } from '@nestjs/common';
import {
  createPublicClient,
  createWalletClient,
  http,
  type PublicClient,
  type WalletClient,
  type Hex,
} from 'viem';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import {
  EVMWalletClient,
  type EVMTransaction,
  type EVMReadRequest,
  type EVMReadResult,
  type EVMTypedData,
} from '@goat-sdk/wallet-evm';
import type { Signature, EvmChain } from '@goat-sdk/core';
import { baseSepolia, BASE_SEPOLIA_CHAIN_ID } from '../constants/contracts.js';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ENCRYPTION_ALGORITHM = 'aes-256-cbc';

class ViemEVMWalletClient extends EVMWalletClient {
  private wallet: WalletClient;
  private publicClient: PublicClient;

  constructor(wallet: WalletClient, publicClient: PublicClient) {
    super();
    this.wallet = wallet;
    this.publicClient = publicClient;
  }

  getAddress(): string {
    return this.wallet.account!.address;
  }

  getChain(): EvmChain {
    return {
      type: 'evm' as const,
      id: BASE_SEPOLIA_CHAIN_ID,
      nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    };
  }

  async sendTransaction(tx: EVMTransaction): Promise<{ hash: string }> {
    if (tx.abi && tx.functionName) {
      const { request } = await this.publicClient.simulateContract({
        account: this.wallet.account!,
        address: tx.to as `0x${string}`,
        abi: tx.abi as any,
        functionName: tx.functionName,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        args: tx.args as any,
        value: tx.value,
      });
      const hash = await this.wallet.writeContract(request);
      return { hash };
    }

    const hash = await this.wallet.sendTransaction({
      account: this.wallet.account!,
      to: tx.to as `0x${string}`,
      value: tx.value ?? 0n,
      data: tx.data,
      chain: baseSepolia,
    });
    return { hash };
  }

  async read(request: EVMReadRequest): Promise<EVMReadResult> {
    const value = await this.publicClient.readContract({
      address: request.address as `0x${string}`,
      abi: request.abi as any,
      functionName: request.functionName,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      args: request.args as any,
    });
    return { value };
  }

  async getNativeBalance(): Promise<bigint> {
    return this.publicClient.getBalance({
      address: this.wallet.account!.address,
    });
  }

  async signMessage(message: string): Promise<Signature> {
    const signature = await this.wallet.signMessage({
      account: this.wallet.account!,
      message,
    });
    return { signature };
  }

  async signTypedData(data: EVMTypedData): Promise<Signature> {
    const signature = await this.wallet.signTypedData({
      account: this.wallet.account!,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      domain: data.domain as any,
      types: data.types as any,
      primaryType: data.primaryType,
      message: data.message,
    });
    return { signature };
  }
}

@Injectable()
export class WalletManagerService {
  private readonly logger = new Logger(WalletManagerService.name);
  private readonly wallets = new Map<string, ViemEVMWalletClient>();

  private getEncryptionKey(): Buffer {
    const key = process.env.WALLET_ENCRYPTION_KEY;
    if (!key) {
      throw new Error('WALLET_ENCRYPTION_KEY is not set');
    }
    return Buffer.from(key, 'hex');
  }

  encryptPrivateKey(privateKey: string): string {
    const iv = randomBytes(16);
    const cipher = createCipheriv(
      ENCRYPTION_ALGORITHM,
      this.getEncryptionKey(),
      iv,
    );
    let encrypted = cipher.update(privateKey, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  }

  decryptPrivateKey(encryptedKey: string): string {
    const [ivHex, encrypted] = encryptedKey.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = createDecipheriv(
      ENCRYPTION_ALGORITHM,
      this.getEncryptionKey(),
      iv,
    );
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  /**
   * Generate a new random key pair for an agent wallet.
   * Caller should encrypt the private key and store it; the raw key is only returned once.
   */
  generateNewKeyPair(): { address: string; privateKey: Hex } {
    const privateKey = generatePrivateKey();
    const account = privateKeyToAccount(privateKey);
    return { address: account.address, privateKey };
  }

  getOrCreateWallet(agentId: string, privateKey: Hex): EVMWalletClient {
    const existing = this.wallets.get(agentId);
    if (existing) return existing;

    const account = privateKeyToAccount(privateKey);
    const transport = http(process.env.RPC_URL ?? 'https://sepolia.base.org');

    const walletClient = createWalletClient({
      account,
      chain: baseSepolia,
      transport,
    });

    const publicClient = createPublicClient({
      chain: baseSepolia,
      transport,
    });

    const evmWallet = new ViemEVMWalletClient(walletClient, publicClient);
    this.wallets.set(agentId, evmWallet);

    this.logger.log(`Wallet created for agent ${agentId}: ${account.address}`);
    return evmWallet;
  }

  getWallet(agentId: string): EVMWalletClient | undefined {
    return this.wallets.get(agentId);
  }

  removeWallet(agentId: string): void {
    this.wallets.delete(agentId);
  }

  getPublicClient(): PublicClient {
    const transport = http(process.env.RPC_URL ?? 'https://sepolia.base.org');
    return createPublicClient({
      chain: baseSepolia,
      transport,
    });
  }
}
