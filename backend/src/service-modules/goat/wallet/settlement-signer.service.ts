import { Injectable, Logger } from '@nestjs/common';
import {
  type Hex,
  encodePacked,
  keccak256,
  createWalletClient,
  http,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { baseSepolia, getContractAddresses } from '../constants/contracts.js';
import { BASE_SEPOLIA_CHAIN_ID } from '../constants/contracts.js';

/**
 * Service that uses a dedicated backend signer wallet to produce ECDSA signatures
 * for match settlement and cancellation on the MatchEngine contract.
 */
@Injectable()
export class SettlementSignerService {
  private readonly logger = new Logger(SettlementSignerService.name);

  private getSignerAccount() {
    const privateKey = process.env.RESULT_SIGNER_PRIVATE_KEY;
    if (!privateKey) {
      throw new Error('RESULT_SIGNER_PRIVATE_KEY is not set');
    }
    return privateKeyToAccount(privateKey as Hex);
  }

  private getMatchEngineAddress(): `0x${string}` {
    return getContractAddresses().MATCH_ENGINE;
  }

  /**
   * Sign a settlement message for the MatchEngine contract.
   * The contract verifies: keccak256(matchId, winnerToken, chainId, contractAddress)
   * signed via EIP-191 (toEthSignedMessageHash).
   */
  async signSettlement(
    matchId: string,
    winnerToken: string,
  ): Promise<Hex> {
    const account = this.getSignerAccount();
    const matchEngineAddress = this.getMatchEngineAddress();

    const messageHash = keccak256(
      encodePacked(
        ['bytes32', 'address', 'uint256', 'address'],
        [
          matchId as Hex,
          winnerToken as `0x${string}`,
          BigInt(BASE_SEPOLIA_CHAIN_ID),
          matchEngineAddress,
        ],
      ),
    );

    // Sign the raw hash — viem's signMessage with { raw } produces an EIP-191
    // personal_sign signature (prefixed), which is what the contract's
    // toEthSignedMessageHash + recover expects.
    const walletClient = createWalletClient({
      account,
      chain: baseSepolia,
      transport: http(process.env.RPC_URL ?? 'https://sepolia.base.org'),
    });

    const signature = await walletClient.signMessage({
      message: { raw: messageHash },
    });

    this.logger.log(
      `Settlement signed matchId=${matchId} winnerToken=${winnerToken} signer=${account.address}`,
    );

    return signature;
  }

  /**
   * Sign a cancellation message for the MatchEngine contract.
   * The contract verifies: keccak256(matchId, "cancel", chainId, contractAddress)
   * signed via EIP-191.
   */
  async signCancellation(matchId: string): Promise<Hex> {
    const account = this.getSignerAccount();
    const matchEngineAddress = this.getMatchEngineAddress();

    const messageHash = keccak256(
      encodePacked(
        ['bytes32', 'string', 'uint256', 'address'],
        [
          matchId as Hex,
          'cancel',
          BigInt(BASE_SEPOLIA_CHAIN_ID),
          matchEngineAddress,
        ],
      ),
    );

    const walletClient = createWalletClient({
      account,
      chain: baseSepolia,
      transport: http(process.env.RPC_URL ?? 'https://sepolia.base.org'),
    });

    const signature = await walletClient.signMessage({
      message: { raw: messageHash },
    });

    this.logger.log(
      `Cancellation signed matchId=${matchId} signer=${account.address}`,
    );

    return signature;
  }

  getSignerAddress(): string {
    return this.getSignerAccount().address;
  }
}
