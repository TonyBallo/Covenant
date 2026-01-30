// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title IdentityPact
 * @dev Soulbound seals for verified identities with tiered trust levels
 * @author Project Covenant - Web3 Certificate Authority
 */
contract IdentityPact is ERC721, Ownable, ReentrancyGuard {
    
    // Tier levels for verification seals
    enum Tier {
        NONE,   // 0 - Not verified
        I,      // 1 - Email
        II,     // 2 - Email + Phone OR Social Account OR Wallet History > 6 months 
        III,    // 3 - Government ID
        IV,     // 4 - Full KYC + Address Verification
        V       // 5 - Biometrics + Background Check
    }
    
    // Seal data structure
    struct SealData {
        Tier tier;
        bytes covenantSignature;  // CHANGED: signature instead of hash
        uint256 mintedAt;
        bool revoked;
        string revocationReason;
    }
    
    // State variables
    uint256 private _nextSealId = 1;
    mapping(uint256 => SealData) public sealData;
    mapping(address => uint256) public addressToSealId;
    
    // Events
    event SealMinted(address indexed to, uint256 indexed sealId, Tier tier);
    event SealRevoked(uint256 indexed sealId, address indexed owner, string reason);
    event SealUpgraded(uint256 indexed sealId, Tier oldTier, Tier newTier);
    event SealBurned(uint256 indexed sealId, address indexed owner);
    
    constructor() ERC721("Covenant Pact", "PACT") Ownable(msg.sender) {}
    
    /**
     * @dev Recover signer address from message and signature
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
        
        assembly {
            r := mload(add(signature, 32))
            s := mload(add(signature, 64))
            v := byte(0, mload(add(signature, 96)))
        }
        
        bytes32 ethSignedHash = keccak256(
            abi.encodePacked("\x19Ethereum Signed Message:\n32", message)
        );
        
        return ecrecover(ethSignedHash, v, r, s);
    }
    
    /**
     * @dev Mint a new seal to an address
     */
    function mint(address to, Tier tier, bytes calldata covenantSignature) 
    external 
    onlyOwner 
    nonReentrant 
{
    require(addressToSealId[to] == 0, "Address already has seal");
    require(tier != Tier.NONE, "Invalid tier");
    
    // Verify Covenant signature (NO timestamp)
    bytes32 message = keccak256(abi.encodePacked(to, uint8(tier)));
    require(recoverSigner(message, covenantSignature) == owner(), "Invalid Covenant signature");
    
    uint256 sealId = _nextSealId++;
    _safeMint(to, sealId);
    
    sealData[sealId] = SealData({
        tier: tier,
        covenantSignature: covenantSignature,
        mintedAt: block.timestamp,  // Still track when minted
        revoked: false,
        revocationReason: ""
    });
    
    addressToSealId[to] = sealId;
    
    emit SealMinted(to, sealId, tier);
}
    
    /**
     * @dev Revoke a seal
     */
    function revoke(uint256 sealId, string calldata reason) external onlyOwner {
        require(_ownerOf(sealId) != address(0), "Seal does not exist");
        require(!sealData[sealId].revoked, "Already revoked");
        
        sealData[sealId].revoked = true;
        sealData[sealId].revocationReason = reason;
        
        emit SealRevoked(sealId, _ownerOf(sealId), reason);
    }
    
    /**
     * @dev Upgrade tier of existing seal
     */
    function upgradeTier(uint256 sealId, Tier newTier, bytes calldata newSignature) 
    external 
    onlyOwner 
    nonReentrant 
{
    require(_ownerOf(sealId) != address(0), "Seal does not exist");
    require(!sealData[sealId].revoked, "Seal is revoked");
    require(newTier > sealData[sealId].tier, "Can only upgrade tier");
    
    // Verify new signature (NO timestamp)
    address sealOwner = _ownerOf(sealId);
    bytes32 message = keccak256(abi.encodePacked(sealOwner, uint8(newTier)));
    require(recoverSigner(message, newSignature) == owner(), "Invalid Covenant signature");
    
    Tier oldTier = sealData[sealId].tier;
    sealData[sealId].tier = newTier;
    sealData[sealId].covenantSignature = newSignature;
    
    emit SealUpgraded(sealId, oldTier, newTier);
}
    
    /**
     * @dev Check if an address is verified and get their seal tier
     */
    function getVerificationStatus(address user) 
        external 
        view 
        returns (bool isVerified, Tier tier, bool isRevoked) 
    {
        uint256 sealId = addressToSealId[user];
        
        if (sealId == 0 && _ownerOf(sealId) != user) {
            return (false, Tier.NONE, false);
        }
        
        SealData memory data = sealData[sealId];
        return (true, data.tier, data.revoked);
    }
    
    /**
     * @dev Override transfer functions to make seals soulbound
     */
    function transferFrom(address, address, uint256) public pure override {
        revert("Soulbound: Transfer not allowed");
    }
    
    function safeTransferFrom(address, address, uint256, bytes memory) public pure override {
        revert("Soulbound: Transfer not allowed");
    }
    
    /**
     * @dev Allow users to burn their own seal (opt-out)
     */
    function burn(uint256 sealId) external {
        require(_ownerOf(sealId) == msg.sender, "Not seal owner");
        
        address owner = msg.sender;
        delete sealData[sealId];
        delete addressToSealId[msg.sender];
        _burn(sealId);
        
        emit SealBurned(sealId, owner);
    }
}