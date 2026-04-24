// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title Pact
 * @dev Soulbound seals for verified identities with tiered trust levels and delegated trust trees
 * @author Project Covenant - Web3 Certificate Authority
 */
contract Pact is ERC721, Ownable, ReentrancyGuard {

    enum Tier {
        NONE,   // 0 - Not verified
        I,      // 1 - Bronze  (Arbitrum)
        II,     // 2 - Silver  (Arbitrum)
        III,    // 3 - Gold    (Arbitrum) — cross-chain boundary node
        IV,     // 4 - Platinum (Ethereum) — cross-chain boundary node
        V       // 5 - Diamond  (Ethereum)
    }

    struct SealData {
        Tier tier;
        bytes covenantSignature;
        uint256 mintedAt;
        uint256 expiresAt;
        bool revoked;
        string revocationReason;
        uint8 jurisdictionCode;
    }

    struct BurnRequest {
        uint256 requestedAt;
        bool pending;
    }

    // Packed into one 32-byte storage slot: uint32 (4) + address (20) + bool (1) = 25 bytes
    struct CrossChainBoundary {
        uint32  partnerChainId;
        address partnerAddress;
        bool    verified;
    }

    // --- Seal state ---
    uint256 private _nextSealId = 1;
    mapping(uint256 => SealData) public sealData;
    mapping(address => uint256) public addressToSealId;
    mapping(uint256 => BurnRequest) public burnRequests;
    mapping(Tier => bool) public tierActive;
    mapping(uint8 => string) public tierMetadataURI;
    uint256 public constant BURN_DELAY = 90 days;

    // --- Trust tree state ---
    mapping(address => uint8)    public effectiveTier;       // linked wallet → assigned tier
    mapping(address => address)  public treeRoot;            // any linked wallet → its root seal holder
    mapping(address => address)  public treeParent;          // child → direct parent
    mapping(address => address[]) public treeChildren;       // parent → direct children

    // Cross-chain boundary: Gold (III) and Platinum (IV) nodes only
    mapping(address => CrossChainBoundary) public crossChainBoundary;

    // --- Events ---
    event SealMinted(address indexed to, uint256 indexed sealId, Tier tier);
    event SealRevoked(uint256 indexed sealId, address indexed owner, string reason);
    event SealUpgraded(uint256 indexed sealId, Tier oldTier, Tier newTier);
    event SealBurned(uint256 indexed sealId, address indexed owner);
    event BurnRequested(uint256 indexed sealId, address indexed owner, uint256 executableAt);
    event BurnCancelled(uint256 indexed sealId, address indexed owner);
    event WalletLinked(address indexed root, address indexed parent, address indexed child, uint8 childTier);
    event WalletUnlinked(address indexed root, address indexed child);
    event CrossChainBoundarySet(address indexed node, uint32 partnerChainId, address partnerAddress);

    constructor() ERC721("Covenant Pact", "PACT") Ownable(msg.sender) {
        tierActive[Tier.I] = true;
        tierActive[Tier.II] = true;
    }

    // -------------------------------------------------------------------------
    // Admin: tier and metadata configuration
    // -------------------------------------------------------------------------

    function setTierActive(Tier tier, bool active) external onlyOwner {
        tierActive[tier] = active;
    }

    function setTierMetadataURI(uint8 tier, string calldata uri) external onlyOwner {
        tierMetadataURI[tier] = uri;
    }

    // -------------------------------------------------------------------------
    // ERC721 metadata
    // -------------------------------------------------------------------------

    function tokenURI(uint256 sealId) public view override returns (string memory) {
        require(_ownerOf(sealId) != address(0), "Seal does not exist");
        return tierMetadataURI[uint8(sealData[sealId].tier)];
    }

    // -------------------------------------------------------------------------
    // Signature recovery
    // -------------------------------------------------------------------------

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

    // -------------------------------------------------------------------------
    // Seal lifecycle: mint, revoke, upgrade, burn
    // -------------------------------------------------------------------------

    function mint(address to, Tier tier, uint8 jurisdictionCode, bytes calldata covenantSignature, uint256 expiresAt)
        external
        onlyOwner
        nonReentrant
    {
        require(addressToSealId[to] == 0, "Address already has seal");
        require(treeRoot[to] == address(0), "Address is already a linked wallet");
        require(tier != Tier.NONE, "Invalid tier");
        require(tierActive[tier], "Tier not yet active");

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

    function revoke(uint256 sealId, string calldata reason) external onlyOwner {
        require(_ownerOf(sealId) != address(0), "Seal does not exist");
        require(!sealData[sealId].revoked, "Already revoked");

        sealData[sealId].revoked = true;
        sealData[sealId].revocationReason = reason;

        emit SealRevoked(sealId, _ownerOf(sealId), reason);
    }

    function upgradeTier(uint256 sealId, Tier newTier, uint8 jurisdictionCode, bytes calldata newSignature)
        external
        onlyOwner
        nonReentrant
    {
        require(_ownerOf(sealId) != address(0), "Seal does not exist");
        require(!sealData[sealId].revoked, "Seal is revoked");
        require(newTier > sealData[sealId].tier, "Can only upgrade tier");

        address sealOwner = _ownerOf(sealId);
        bytes32 message = keccak256(abi.encodePacked(sealOwner, uint8(newTier), jurisdictionCode, block.chainid));
        require(recoverSigner(message, newSignature) == owner(), "Invalid Covenant signature");

        Tier oldTier = sealData[sealId].tier;
        sealData[sealId].tier = newTier;
        sealData[sealId].covenantSignature = newSignature;
        sealData[sealId].jurisdictionCode = jurisdictionCode;

        emit SealUpgraded(sealId, oldTier, newTier);
    }

    function adminBurn(uint256 sealId) external onlyOwner nonReentrant {
        address sealOwner = _ownerOf(sealId);
        require(sealOwner != address(0), "Seal does not exist");

        delete addressToSealId[sealOwner];
        delete sealData[sealId];
        delete burnRequests[sealId];
        _burn(sealId);

        emit SealBurned(sealId, sealOwner);
    }

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

    function cancelBurnRequest(uint256 sealId) external nonReentrant {
        require(_ownerOf(sealId) == msg.sender, "Not seal owner");
        require(burnRequests[sealId].pending, "No pending burn request");

        delete burnRequests[sealId];

        emit BurnCancelled(sealId, msg.sender);
    }

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

    // -------------------------------------------------------------------------
    // Soulbound: block transfers
    // -------------------------------------------------------------------------

    function transferFrom(address, address, uint256) public pure override {
        revert("Soulbound: Transfer not allowed");
    }

    function safeTransferFrom(address, address, uint256, bytes memory) public pure override {
        revert("Soulbound: Transfer not allowed");
    }

    // -------------------------------------------------------------------------
    // Trust tree: link and unlink
    // -------------------------------------------------------------------------

    /**
     * @dev Link a child wallet into the trust tree beneath msg.sender.
     *      The root of the tree must co-sign every link, regardless of depth.
     *
     *      Signature: keccak256(parent + child + childTier + root + chainId)
     *      signed by the root wallet's private key.
     *
     *      Branching limits: a node at tier T may have at most (T - 1) children.
     *      Each child's tier must be exactly (parent tier - 1).
     */
    function linkWallet(
        address child,
        uint8 childTier,
        bytes calldata rootSignature
    ) external nonReentrant {
        address parent = msg.sender;

        uint8 parentTier = _getEffectiveTier(parent);
        require(parentTier > 0, "Caller has no seal or link");
        require(childTier == parentTier - 1, "Child tier must be parent tier minus one");
        require(childTier > 0, "Cannot link at Bronze or below");
        require(addressToSealId[child] == 0, "Child already has a seal");
        require(treeRoot[child] == address(0), "Child already linked");
        require(
            treeChildren[parent].length < parentTier - 1,
            "No available slots"
        );

        // Root is the parent if parent is a seal holder; otherwise follow the chain
        address root = treeRoot[parent];
        if (root == address(0)) root = parent;

        bytes32 message = keccak256(
            abi.encodePacked(parent, child, childTier, root, block.chainid)
        );
        require(recoverSigner(message, rootSignature) == root, "Invalid root signature");

        treeRoot[child]   = root;
        treeParent[child] = parent;
        effectiveTier[child] = childTier;
        treeChildren[parent].push(child);

        emit WalletLinked(root, parent, child, childTier);
    }

    /**
     * @dev Remove a linked wallet and its entire subtree. Only the root may call this.
     *      Freed slots become available for new links immediately.
     */
    function unlinkWallet(address child) external nonReentrant {
        require(treeRoot[child] != address(0), "Address is not a linked wallet");
        require(msg.sender == treeRoot[child], "Only root can unlink");

        address parent = treeParent[child];
        _removeChild(parent, child);
        _cleanupSubtree(child);

        emit WalletUnlinked(msg.sender, child);
    }

    // -------------------------------------------------------------------------
    // Trust tree: cross-chain boundary (Gold III / Platinum IV nodes only)
    // -------------------------------------------------------------------------

    /**
     * @dev Record the cross-chain partner for a Gold or Platinum boundary node.
     *      Signature is verified off-chain by Covenant before calling; only the
     *      compact struct is stored (signature discarded to save gas).
     *      Only owner (Covenant) may set this.
     */
    function setCrossChainBoundary(
        address node,
        uint32 partnerChainId,
        address partnerAddress
    ) external onlyOwner {
        uint8 nodeTier = _getEffectiveTier(node);
        require(
            nodeTier == uint8(Tier.III) || nodeTier == uint8(Tier.IV),
            "Only Gold and Platinum nodes can have a cross-chain boundary"
        );
        require(partnerAddress != address(0), "Invalid partner address");

        crossChainBoundary[node] = CrossChainBoundary({
            partnerChainId: partnerChainId,
            partnerAddress: partnerAddress,
            verified: true
        });

        emit CrossChainBoundarySet(node, partnerChainId, partnerAddress);
    }

    // -------------------------------------------------------------------------
    // View functions
    // -------------------------------------------------------------------------

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

    function isExpired(address user) external view returns (bool) {
        uint256 sealId = addressToSealId[user];
        if (sealId == 0) return false;
        uint256 expiry = sealData[sealId].expiresAt;
        if (expiry == 0) return false;
        return block.timestamp >= expiry;
    }

    /**
     * @dev Returns true if the address has valid, active verification at or above minTier.
     *      Works for both root seal holders and linked trust tree wallets.
     *      External protocols only call this — the tree structure is never exposed.
     */
    function isValid(address user, Tier minTier) external view returns (bool) {
        // --- Root seal holder path ---
        uint256 sealId = addressToSealId[user];
        if (sealId != 0) {
            SealData memory data = sealData[sealId];
            if (data.revoked) return false;
            if (data.tier < minTier) return false;
            if (data.expiresAt != 0 && block.timestamp > data.expiresAt) return false;
            return true;
        }

        // --- Linked wallet path ---
        address root = treeRoot[user];
        if (root == address(0)) return false;
        if (effectiveTier[user] < uint8(minTier)) return false;

        // Validity is determined entirely by the root seal — O(1), no traversal
        uint256 rootSealId = addressToSealId[root];
        if (rootSealId == 0) return false;
        SealData memory rootData = sealData[rootSealId];
        if (rootData.revoked) return false;
        if (rootData.expiresAt != 0 && block.timestamp > rootData.expiresAt) return false;

        return true;
    }

    function verifyOwnership(address user, uint256 sealId)
        external
        view
        returns (bool)
    {
        return _ownerOf(sealId) == user && addressToSealId[user] == sealId;
    }

    /**
     * @dev Returns the direct children of a node. Available to anyone — tree
     *      visibility is unrestricted for wallet nodes and Covenant.
     */
    function getTreeChildren(address node) external view returns (address[] memory) {
        return treeChildren[node];
    }

    // -------------------------------------------------------------------------
    // Internal helpers
    // -------------------------------------------------------------------------

    function _getEffectiveTier(address addr) internal view returns (uint8) {
        uint256 sealId = addressToSealId[addr];
        if (sealId != 0) {
            return uint8(sealData[sealId].tier);
        }
        return effectiveTier[addr];
    }

    function _removeChild(address parent, address child) internal {
        address[] storage children = treeChildren[parent];
        uint256 len = children.length;
        for (uint256 i = 0; i < len; i++) {
            if (children[i] == child) {
                children[i] = children[len - 1];
                children.pop();
                break;
            }
        }
    }

    // Recursively clears all state for a subtree node and its descendants.
    // Max depth is 4 (Platinum → Bronze), max subtree size is 16 nodes — gas safe.
    function _cleanupSubtree(address node) internal {
        address[] memory children = treeChildren[node];
        for (uint256 i = 0; i < children.length; i++) {
            _cleanupSubtree(children[i]);
        }
        delete effectiveTier[node];
        delete treeRoot[node];
        delete treeParent[node];
        delete treeChildren[node];
        delete crossChainBoundary[node];
    }
}
