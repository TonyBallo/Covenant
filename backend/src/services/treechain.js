import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

const TREE_ABI = [
  // State mapping getters
  "function effectiveTier(address) view returns (uint8)",
  "function treeRoot(address) view returns (address)",
  "function treeParent(address) view returns (address)",
  "function addressToSealId(address) view returns (uint256)",
  "function crossChainBoundary(address) view returns (uint32 partnerChainId, address partnerAddress, bool verified)",
  // Trust tree functions
  "function getTreeChildren(address node) view returns (address[])",
  "function setCrossChainBoundary(address node, uint32 partnerChainId, address partnerAddress)",
  // Events
  "event WalletLinked(address indexed root, address indexed parent, address indexed child, uint8 childTier)",
  "event WalletUnlinked(address indexed root, address indexed child)",
];

const provider = new ethers.JsonRpcProvider(process.env.ARBITRUM_SEPOLIA_RPC_URL);
const wallet = new ethers.Wallet(process.env.OWNER_PRIVATE_KEY, provider);

// Signing instance for owner-only calls
const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, TREE_ABI, wallet);
// Read-only instance for view calls
const readContract = new ethers.Contract(process.env.CONTRACT_ADDRESS, TREE_ABI, provider);

const iface = new ethers.Interface(TREE_ABI);

/**
 * Get the trust tree position of an address.
 * Returns null fields for addresses not in any tree and with no seal.
 */
export async function getTreeStatus(address) {
  try {
    const [root, parent, tier, sealId] = await Promise.all([
      readContract.treeRoot(address),
      readContract.treeParent(address),
      readContract.effectiveTier(address),
      readContract.addressToSealId(address),
    ]);

    const isLinked = root !== ethers.ZeroAddress;
    const hasSeal = Number(sealId) > 0;

    return {
      address,
      isLinked,
      hasSeal,
      effectiveTier: isLinked ? Number(tier) : null,
      root:   isLinked ? root   : null,
      parent: isLinked ? parent : null,
    };
  } catch (error) {
    console.error('Failed to get tree status:', error);
    throw new Error(`Failed to get tree status: ${error.message}`);
  }
}

/**
 * Get the direct children of a node in the trust tree.
 */
export async function getTreeChildrenOf(address) {
  try {
    return await readContract.getTreeChildren(address);
  } catch (error) {
    console.error('Failed to get tree children:', error);
    throw new Error(`Failed to get tree children: ${error.message}`);
  }
}

/**
 * Parse a WalletLinked event from a confirmed tx receipt.
 * Validates that the tx targets the Pact contract and emitted the expected event.
 * Returns { root, parent, child, childTier, blockNumber }.
 */
export async function verifyLinkTx(txHash) {
  try {
    const receipt = await provider.getTransactionReceipt(txHash);
    if (!receipt) throw new Error('Transaction not found or not yet confirmed');
    if (receipt.status !== 1) throw new Error('Transaction reverted');

    if (receipt.to?.toLowerCase() !== process.env.CONTRACT_ADDRESS.toLowerCase()) {
      throw new Error('Transaction is not to the Pact contract');
    }

    for (const log of receipt.logs) {
      try {
        const parsed = iface.parseLog(log);
        if (parsed?.name === 'WalletLinked') {
          return {
            root:       parsed.args.root,
            parent:     parsed.args.parent,
            child:      parsed.args.child,
            childTier:  Number(parsed.args.childTier),
            blockNumber: receipt.blockNumber,
          };
        }
      } catch {
        // Not a log we care about — skip
      }
    }

    throw new Error('WalletLinked event not found in transaction');
  } catch (error) {
    throw new Error(`Failed to verify link tx: ${error.message}`);
  }
}

/**
 * Parse a WalletUnlinked event from a confirmed tx receipt.
 * Returns { root, child, blockNumber }.
 */
export async function verifyUnlinkTx(txHash) {
  try {
    const receipt = await provider.getTransactionReceipt(txHash);
    if (!receipt) throw new Error('Transaction not found or not yet confirmed');
    if (receipt.status !== 1) throw new Error('Transaction reverted');

    if (receipt.to?.toLowerCase() !== process.env.CONTRACT_ADDRESS.toLowerCase()) {
      throw new Error('Transaction is not to the Pact contract');
    }

    for (const log of receipt.logs) {
      try {
        const parsed = iface.parseLog(log);
        if (parsed?.name === 'WalletUnlinked') {
          return {
            root:        parsed.args.root,
            child:       parsed.args.child,
            blockNumber: receipt.blockNumber,
          };
        }
      } catch {
        // Skip
      }
    }

    throw new Error('WalletUnlinked event not found in transaction');
  } catch (error) {
    throw new Error(`Failed to verify unlink tx: ${error.message}`);
  }
}

/**
 * Convert a block number to an ISO timestamp string.
 * Falls back to now() if the block is not found.
 */
export async function getBlockTimestamp(blockNumber) {
  try {
    const block = await provider.getBlock(blockNumber);
    return block
      ? new Date(Number(block.timestamp) * 1000).toISOString()
      : new Date().toISOString();
  } catch {
    return new Date().toISOString();
  }
}

/**
 * Set the cross-chain boundary for a Gold (III) or Platinum (IV) node on-chain.
 * Only callable by Covenant (uses OWNER_PRIVATE_KEY).
 * Returns { transactionHash, blockNumber }.
 */
export async function setCrossChainBoundaryOnChain(node, partnerChainId, partnerAddress) {
  try {
    console.log(`⛓️  Setting cross-chain boundary: ${node} → chain ${partnerChainId} / ${partnerAddress}`);

    const tx = await contract.setCrossChainBoundary(node, partnerChainId, partnerAddress, {
      gasLimit: 100000,
    });
    const receipt = await tx.wait();

    console.log(`✅ CrossChainBoundary set. Tx: ${receipt.hash}`);
    return { transactionHash: receipt.hash, blockNumber: receipt.blockNumber };
  } catch (error) {
    console.error('setCrossChainBoundary failed:', error);
    throw new Error(`Failed to set cross-chain boundary: ${error.message}`);
  }
}
