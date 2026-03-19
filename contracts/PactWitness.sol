// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title PactWitness
 * @notice Cross-chain verification attestation for Covenant Protocol
 */
contract PactWitness is Ownable {
    
    // ============ State Variables ============
    
    /**
     * @dev Attestation represents proof of verification on this chain
     * This is NOT the seal itself - just proof that a seal exists on Ethereum
     */
    struct Attestation {
        uint8 tier;                 // Verification tier (1-5)
        uint256 expiresAt;          // When it expires
        bytes32 credentialHash;     // Links to Ethereum seal for revocation
    }
    
    // Wallet address => their attestation
    mapping(address => Attestation) public attestations;
    
    // Credential hash => is it revoked?
    mapping(bytes32 => bool) public revokedCredentials;
    
    // ============ Constructor ============
    
    /**
     * @dev Sets the deployer as the owner (authority who can create attestations)
     */
    constructor() Ownable(msg.sender) {
        // msg.sender becomes the owner automatically
    }
    
    // ============ Main Functions ============
    
    /**
     * @notice Create an attestation for a verified wallet
     * @param wallet Address being verified
     * @param tier Verification tier (1-5)
     * @param credentialHash Hash linking to Ethereum seal
     * @param signature Proof from Covenant authority
     */
    function attestSeal(
        address wallet,
        uint8 tier,
        bytes32 credentialHash,
        bytes memory signature
    ) external onlyOwner {
        // Validate inputs
        require(tier >= 1 && tier <= 5, "Invalid tier");
        require(wallet != address(0), "Invalid wallet");
        require(attestations[wallet].tier == 0, "Wallet already has attestation");
        
        // Verify signature matches Pact format: keccak256(wallet, tier, chainId)
        bytes32 messageHash = keccak256(abi.encodePacked(wallet, tier, block.chainid));
        require(recoverSigner(messageHash, signature) == owner(), "Invalid signature");
        
        // Create the attestation with 1-year expiry
        attestations[wallet] = Attestation({
            tier: tier,
            expiresAt: block.timestamp + 365 days,
            credentialHash: credentialHash
        });
    }
    
    /**
     * @notice Revoke a credential across all chains
     * @param credentialHash Hash of credential to revoke
     */
    function revokeCredential(bytes32 credentialHash) external onlyOwner {
        revokedCredentials[credentialHash] = true;
    }
    
    // ============ View Functions ============
    
    /**
     * @notice Check if wallet is verified at minimum tier
     * @param wallet Address to check
     * @param minTier Minimum tier required (1-5)
     * @return bool True if verified and not expired/revoked
     */
    function isVerified(address wallet, uint8 minTier) public view returns (bool) {
        Attestation memory attestation = attestations[wallet];
        
        // Check tier requirement
        if (attestation.tier < minTier) return false;
        
        // Check expiry
        if (block.timestamp > attestation.expiresAt) return false;
        
        // Check revocation
        if (revokedCredentials[attestation.credentialHash]) return false;
        
        return true;
    }
    
    /**
     * @notice Get full verification status for a wallet
     * @param wallet Address to check
     * @return tier Verification tier (0 if none)
     * @return expiresAt Expiration timestamp
     * @return isRevoked Is credential revoked
     */
    function getVerificationStatus(address wallet) 
        external 
        view 
        returns (
            uint8 tier,
            uint256 expiresAt,
            bool isRevoked
        )
    {
        Attestation memory attestation = attestations[wallet];
        
        return (
            attestation.tier,
            attestation.expiresAt,
            revokedCredentials[attestation.credentialHash]
        );
    }
    
    // ============ Internal Helper Functions ============
    
    /**
     * @dev Recover signer address from message and signature
     * @dev This matches Pact's signature verification exactly
     */
    function recoverSigner(bytes32 message, bytes memory signature) 
        internal 
        pure 
        returns (address) 
    {
        require(signature.length == 65, "Invalid signature length");
        
        bytes32 r;
        bytes32 s;
        uint8 v;
        
        // Extract signature components
        assembly {
            r := mload(add(signature, 32))
            s := mload(add(signature, 64))
            v := byte(0, mload(add(signature, 96)))
        }
        
        // Add Ethereum prefix (matches ethers.js signMessage behavior)
        bytes32 ethSignedHash = keccak256(
            abi.encodePacked("\x19Ethereum Signed Message:\n32", message)
        );
        
        return ecrecover(ethSignedHash, v, r, s);
    }
    
}
