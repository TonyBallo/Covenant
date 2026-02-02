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
    // Burn request structure
    struct BurnRequest {
        uint256 requestedAt;
        bool pending;
    }


    // State variables
    uint256 private _nextSealId = 1;
    mapping(uint256 => SealData) public sealData;
    mapping(address => uint256) public addressToSealId;

    mapping(uint256 => BurnRequest) public burnRequests;
    uint256 public constant BURN_DELAY = 90 days;
    
    // Events
    event SealMinted(address indexed to, uint256 indexed sealId, Tier tier);
    event SealRevoked(uint256 indexed sealId, address indexed owner, string reason);
    event SealUpgraded(uint256 indexed sealId, Tier oldTier, Tier newTier);
    event SealBurned(uint256 indexed sealId, address indexed owner);
    event BurnRequested(uint256 indexed sealId, address indexed owner, uint256 executableAt);
    event BurnCancelled(uint256 indexed sealId, address indexed owner);
    
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
        returns (
            bool isVerified, 
            Tier tier, 
            bool isRevoked,
            bool burnPending,
            uint256 burnExecutableAt
        ) 
    {
        uint256 sealId = addressToSealId[user];
        
        if (sealId == 0 && _ownerOf(sealId) != user) {
            return (false, Tier.NONE, false, false, 0);
        }
        
        SealData memory data = sealData[sealId];
        BurnRequest memory burnReq = burnRequests[sealId];
        
        return (
            true, 
            data.tier, 
            data.revoked,
            burnReq.pending,
            burnReq.pending ? burnReq.requestedAt + BURN_DELAY : 0
        );
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
    * @dev Request to burn seal (starts 90-day countdown)
    */
    function requestBurn(uint256 sealId) external nonReentrant {
        require(_ownerOf(sealId) == msg.sender, "Not seal owner");
        require(!sealData[sealId].revoked, "Cannot burn revoked seal");
        require(!burnRequests[sealId].pending, "Burn already requested");
        
        burnRequests[sealId] = BurnRequest({
            requestedAt: block.timestamp,
            pending: true
        });
        
        emit BurnRequested(sealId, msg.sender, block.timestamp + BURN_DELAY);
    }

    /**
    * @dev Cancel pending burn request
    */
    function cancelBurnRequest(uint256 sealId) external nonReentrant {
        require(_ownerOf(sealId) == msg.sender, "Not seal owner");
        require(burnRequests[sealId].pending, "No pending burn request");
        
        delete burnRequests[sealId];
        
        emit BurnCancelled(sealId, msg.sender);
    }

    /**
    * @dev Execute burn after delay period
    */
    function executeBurn(uint256 sealId) external nonReentrant {
        require(_ownerOf(sealId) == msg.sender, "Not seal owner");
        require(burnRequests[sealId].pending, "No pending burn request");
        require(
            block.timestamp >= burnRequests[sealId].requestedAt + BURN_DELAY,
            "Burn delay not elapsed"
        );
        
        address owner = msg.sender;
        delete sealData[sealId];
        delete addressToSealId[msg.sender];
        delete burnRequests[sealId];
        _burn(sealId);
        
        emit SealBurned(sealId, owner);
    }

    /**
    * @dev Verify that an address owns a specific seal
    * Prevents spoofing attacks where users claim someone else's seal
    */
    function verifyOwnership(address user, uint256 sealId) 
        external 
        view 
        returns (bool) 
    {
        return _ownerOf(sealId) == user && addressToSealId[user] == sealId;
    }
}