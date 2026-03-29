// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title Pact
 * @dev Soulbound seals for verified identities with tiered trust levels
 * @author Project Covenant - Web3 Certificate Authority
 */
contract Pact is ERC721, Ownable, ReentrancyGuard {

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
        bytes covenantSignature;
        uint256 mintedAt;
        uint256 expiresAt;
        bool revoked;
        string revocationReason;
        uint8 jurisdictionCode;
    }

    // Burn request structure
    struct BurnRequest {
        uint256 requestedAt;
        bool pending;
    }

    // State variables
    uint256 private _nextSealId = 1;                         // Auto-incrementing seal ID; starts at 1 so 0 means "no seal"
    mapping(uint256 => SealData) public sealData;            // sealId => seal metadata
    mapping(address => uint256) public addressToSealId;      // wallet => sealId (0 if no seal)
    mapping(uint256 => BurnRequest) public burnRequests;     // sealId => pending burn request
    mapping(Tier => bool) public tierActive;                 // gates which tiers can be minted; set by owner
    mapping(uint8 => string) public tierMetadataURI;         // tier number => IPFS metadata URI
    uint256 public constant BURN_DELAY = 90 days;            // Time-lock before a requested burn can be executed

    // Events
    event SealMinted(address indexed to, uint256 indexed sealId, Tier tier);
    event SealRevoked(uint256 indexed sealId, address indexed owner, string reason);
    event SealUpgraded(uint256 indexed sealId, Tier oldTier, Tier newTier);
    event SealBurned(uint256 indexed sealId, address indexed owner);
    event BurnRequested(uint256 indexed sealId, address indexed owner, uint256 executableAt);
    event BurnCancelled(uint256 indexed sealId, address indexed owner);

    constructor() ERC721("Covenant Pact", "PACT") Ownable(msg.sender) {
        tierActive[Tier.I] = true;
        tierActive[Tier.II] = true;
    }

    /**
     * @dev Enable or disable a tier for minting
     */
    function setTierActive(Tier tier, bool active) external onlyOwner {
        tierActive[tier] = active;
    }

    /**
     * @dev Set the IPFS metadata URI for a given tier (1–5)
     */
    function setTierMetadataURI(uint8 tier, string calldata uri) external onlyOwner {
        tierMetadataURI[tier] = uri;
    }

    /**
     * @dev Returns the metadata URI for the seal's tier.
     * Returns an empty string if no URI has been set for that tier.
     */
    function tokenURI(uint256 sealId) public view override returns (string memory) {
        require(_ownerOf(sealId) != address(0), "Seal does not exist");
        return tierMetadataURI[uint8(sealData[sealId].tier)];
    }

    /**
     * @dev Recover the signer address from a raw message hash and ECDSA signature.
     * Applies the Ethereum signed message prefix (\x19Ethereum Signed Message:\n32)
     * to match the output of ethers.js wallet.signMessage(), which prefixes automatically.
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
    function mint(address to, Tier tier, uint8 jurisdictionCode, bytes calldata covenantSignature, uint256 expiresAt)
    external
    onlyOwner
    nonReentrant
{
    require(addressToSealId[to] == 0, "Address already has seal");
    require(tier != Tier.NONE, "Invalid tier");
    require(tierActive[tier], "Tier not yet active");

    // Verify Covenant signature (includes jurisdictionCode and chain ID to prevent replay attacks)
    bytes32 message = keccak256(abi.encodePacked(to, uint8(tier), jurisdictionCode, block.chainid));
    require(recoverSigner(message, covenantSignature) == owner(), "Invalid Covenant signature");

    uint256 sealId = _nextSealId++;
    _safeMint(to, sealId);

    sealData[sealId] = SealData({
        tier: tier,
        covenantSignature: covenantSignature,
        mintedAt: block.timestamp,
        expiresAt: expiresAt,
        revoked: false,
        revocationReason: "",
        jurisdictionCode: jurisdictionCode
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
    function upgradeTier(uint256 sealId, Tier newTier, uint8 jurisdictionCode, bytes calldata newSignature)
    external
    onlyOwner
    nonReentrant
{
    require(_ownerOf(sealId) != address(0), "Seal does not exist");
    require(!sealData[sealId].revoked, "Seal is revoked");
    require(newTier > sealData[sealId].tier, "Can only upgrade tier");

    // Verify new signature (includes jurisdictionCode and chain ID to prevent replay attacks)
    address sealOwner = _ownerOf(sealId);
    bytes32 message = keccak256(abi.encodePacked(sealOwner, uint8(newTier), jurisdictionCode, block.chainid));
    require(recoverSigner(message, newSignature) == owner(), "Invalid Covenant signature");

    Tier oldTier = sealData[sealId].tier;
    sealData[sealId].tier = newTier;
    sealData[sealId].covenantSignature = newSignature;
    sealData[sealId].jurisdictionCode = jurisdictionCode;

    emit SealUpgraded(sealId, oldTier, newTier);
}

    /**
     * @dev Return the key seal fields for a wallet address.
     * Returns all zero values if the wallet has no seal.
     */
    function getSeal(address wallet) public view returns (
        uint8 tier,
        uint256 issuedAt,
        uint256 expiresAt,
        uint8 jurisdictionCode,
        bool revoked
    ) {
        uint256 sealId = addressToSealId[wallet];
        if (sealId == 0) {
            return (0, 0, 0, 0, false);
        }
        SealData memory data = sealData[sealId];
        return (
            uint8(data.tier),
            data.mintedAt,
            data.expiresAt,
            data.jurisdictionCode,
            data.revoked
        );
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

        if (sealId == 0) {
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
     * @dev Check if a user's seal has expired
     * Returns false if expiresAt is 0 (no expiry set)
     */
    function isExpired(address user) external view returns (bool) {
        uint256 sealId = addressToSealId[user];
        if (sealId == 0) return false;
        uint256 expiry = sealData[sealId].expiresAt;
        if (expiry == 0) return false;
        return block.timestamp >= expiry;
    }

    /**
     * @dev Returns true only if the user has an active, unexpired seal at or above minTier
     */
    function isValid(address user, Tier minTier) external view returns (bool) {
        uint256 sealId = addressToSealId[user];
        if (sealId == 0) return false;
        SealData memory data = sealData[sealId];
        if (data.revoked) return false;
        if (data.tier < minTier) return false;
        if (data.expiresAt != 0 && block.timestamp > data.expiresAt) return false;
        return true;
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
     * @dev Owner-callable burn — removes a seal immediately without the 90-day delay.
     * Intended for contract migrations so stale seals aren't left in wallets.
     */
    function adminBurn(uint256 sealId) external onlyOwner nonReentrant {
        address sealOwner = _ownerOf(sealId);
        require(sealOwner != address(0), "Seal does not exist");

        delete addressToSealId[sealOwner];
        delete sealData[sealId];
        delete burnRequests[sealId];
        _burn(sealId);

        emit SealBurned(sealId, sealOwner);
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

        address sealOwner = msg.sender;
        delete sealData[sealId];
        delete addressToSealId[msg.sender];
        delete burnRequests[sealId];
        _burn(sealId);

        emit SealBurned(sealId, sealOwner);
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
