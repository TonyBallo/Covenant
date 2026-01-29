// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title IdentitySBT
 * @dev Soulbound token for verified identities with tiered trust levels
 * @author Built by [Your Name] - Web3 Certificate Authority
 */
contract IdentitySBT is ERC721, Ownable {
    
    // Tier levels for verification
    enum Tier {
        NONE,      // 0 - Not verified
        BRONZE,    // 1 - Email + Phone
        SILVER,    // 2 - + Full Name + Location
        GOLD,      // 3 - + Government ID
        PLATINUM   // 4 - + Full KYC + Biometrics
    }
    
    // Token data structure
    struct TokenData {
        Tier tier;
        bytes32 dataHash;      // Hash of off-chain identity data
        uint256 mintedAt;
        bool revoked;
        string revocationReason;
    }
    
    // State variables
    uint256 private _nextTokenId = 1;
    mapping(uint256 => TokenData) public tokenData;
    mapping(address => uint256) public addressToTokenId;
    
    // Events
    event SBTMinted(address indexed to, uint256 indexed tokenId, Tier tier, bytes32 dataHash);
    event SBTRevoked(uint256 indexed tokenId, address indexed owner, string reason);
    event TierUpgraded(uint256 indexed tokenId, Tier oldTier, Tier newTier);
    event SBTBurned(uint256 indexed tokenId, address indexed owner);
    
    constructor() ERC721("Identity SBT", "IDSBT") Ownable(msg.sender) {}
    
    /**
     * @dev Mint a new SBT to an address
     */
    function mint(address to, Tier tier, bytes32 dataHash) external onlyOwner {
        require(addressToTokenId[to] == 0, "Address already has SBT");
        require(tier != Tier.NONE, "Invalid tier");
        require(dataHash != bytes32(0), "Invalid data hash");
        
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        
        tokenData[tokenId] = TokenData({
            tier: tier,
            dataHash: dataHash,
            mintedAt: block.timestamp,
            revoked: false,
            revocationReason: ""
        });
        
        addressToTokenId[to] = tokenId;
        
        emit SBTMinted(to, tokenId, tier, dataHash);
    }
    
    /**
     * @dev Revoke an SBT
     */
    function revoke(uint256 tokenId, string calldata reason) external onlyOwner {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        require(!tokenData[tokenId].revoked, "Already revoked");
        
        tokenData[tokenId].revoked = true;
        tokenData[tokenId].revocationReason = reason;
        
        emit SBTRevoked(tokenId, _ownerOf(tokenId), reason);
    }
    
    /**
     * @dev Upgrade tier of existing SBT
     */
    function upgradeTier(uint256 tokenId, Tier newTier, bytes32 newDataHash) external onlyOwner {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        require(!tokenData[tokenId].revoked, "Token is revoked");
        require(newTier > tokenData[tokenId].tier, "Can only upgrade tier");
        
        Tier oldTier = tokenData[tokenId].tier;
        tokenData[tokenId].tier = newTier;
        tokenData[tokenId].dataHash = newDataHash;
        
        emit TierUpgraded(tokenId, oldTier, newTier);
    }
    
    /**
     * @dev Check if an address is verified and get their tier
     * This is the function other protocols will call
     */
    function getVerificationStatus(address user) 
        external 
        view 
        returns (bool isVerified, Tier tier, bool isRevoked) 
    {
        uint256 tokenId = addressToTokenId[user];
        
        if (tokenId == 0 && _ownerOf(tokenId) != user) {
            return (false, Tier.NONE, false);
        }
        
        TokenData memory data = tokenData[tokenId];
        return (true, data.tier, data.revoked);
    }
    
    /**
     * @dev Override transfer functions to make tokens soulbound
     */
    function transferFrom(address, address, uint256) public pure override {
        revert("Soulbound: Transfer not allowed");
    }
    
    function safeTransferFrom(address, address, uint256, bytes memory) public pure override {
        revert("Soulbound: Transfer not allowed");
    }
    
    /**
     * @dev Allow users to burn their own SBT (opt-out)
     */
    function burn(uint256 tokenId) external {
        require(_ownerOf(tokenId) == msg.sender, "Not token owner");
        
        address owner = msg.sender;
        delete tokenData[tokenId];
        delete addressToTokenId[msg.sender];
        _burn(tokenId);
        
        emit SBTBurned(tokenId, owner);
    }
}