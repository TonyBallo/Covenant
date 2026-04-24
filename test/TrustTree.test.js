const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Trust Tree", function () {
  let pact;
  let owner;
  let root, platinum, gold, silver, bronze;
  let stranger;

  // Create a Covenant mint signature
  async function mintSig(userAddress, tier, jurisdictionCode = 0) {
    const { chainId } = await ethers.provider.getNetwork();
    const message = ethers.solidityPackedKeccak256(
      ["address", "uint8", "uint8", "uint256"],
      [userAddress, tier, jurisdictionCode, chainId]
    );
    return await owner.signMessage(ethers.getBytes(message));
  }

  // Create a root-signed link authorization
  async function linkSig(rootSigner, parentAddress, childAddress, childTier, rootAddress) {
    const { chainId } = await ethers.provider.getNetwork();
    const message = ethers.solidityPackedKeccak256(
      ["address", "address", "uint8", "address", "uint256"],
      [parentAddress, childAddress, childTier, rootAddress, chainId]
    );
    return await rootSigner.signMessage(ethers.getBytes(message));
  }

  beforeEach(async function () {
    [owner, root, platinum, gold, silver, bronze, stranger] = await ethers.getSigners();

    const PactFactory = await ethers.getContractFactory("Pact");
    pact = await PactFactory.deploy();

    // Activate all tiers
    await pact.setTierActive(3, true);
    await pact.setTierActive(4, true);
    await pact.setTierActive(5, true);

    // Mint a Diamond (5) root seal to `root`
    const sig = await mintSig(root.address, 5);
    await pact.mint(root.address, 5, 0, sig, 0);
  });

  // ---------------------------------------------------------------------------
  // linkWallet
  // ---------------------------------------------------------------------------

  describe("linkWallet", function () {
    it("Should allow root to link a direct Platinum child", async function () {
      const sig = await linkSig(root, root.address, platinum.address, 4, root.address);
      await pact.connect(root).linkWallet(platinum.address, 4, sig);

      expect(await pact.effectiveTier(platinum.address)).to.equal(4);
      expect(await pact.treeRoot(platinum.address)).to.equal(root.address);
      expect(await pact.treeParent(platinum.address)).to.equal(root.address);
    });

    it("Should allow intermediate node to link a child with root co-signature", async function () {
      // Root links Platinum
      const sig1 = await linkSig(root, root.address, platinum.address, 4, root.address);
      await pact.connect(root).linkWallet(platinum.address, 4, sig1);

      // Platinum links Gold — root co-signs
      const sig2 = await linkSig(root, platinum.address, gold.address, 3, root.address);
      await pact.connect(platinum).linkWallet(gold.address, 3, sig2);

      expect(await pact.effectiveTier(gold.address)).to.equal(3);
      expect(await pact.treeRoot(gold.address)).to.equal(root.address);
      expect(await pact.treeParent(gold.address)).to.equal(platinum.address);
    });

    it("Should correctly populate treeChildren", async function () {
      const sig = await linkSig(root, root.address, platinum.address, 4, root.address);
      await pact.connect(root).linkWallet(platinum.address, 4, sig);

      const children = await pact.getTreeChildren(root.address);
      expect(children).to.deep.equal([platinum.address]);
    });

    it("Should emit WalletLinked event", async function () {
      const sig = await linkSig(root, root.address, platinum.address, 4, root.address);
      await expect(pact.connect(root).linkWallet(platinum.address, 4, sig))
        .to.emit(pact, "WalletLinked")
        .withArgs(root.address, root.address, platinum.address, 4);
    });

    it("Should enforce branching limit — Diamond allows 4 Platinum children", async function () {
      const signers = await ethers.getSigners();
      const children = signers.slice(7, 11); // 4 fresh addresses

      for (const child of children) {
        const sig = await linkSig(root, root.address, child.address, 4, root.address);
        await pact.connect(root).linkWallet(child.address, 4, sig);
      }

      // 5th child should be rejected
      const extra = signers[11];
      const sig = await linkSig(root, root.address, extra.address, 4, root.address);
      await expect(
        pact.connect(root).linkWallet(extra.address, 4, sig)
      ).to.be.revertedWith("No available slots");
    });

    it("Should reject if child tier is not exactly parent tier minus one", async function () {
      // Attempt to link at Gold (3) directly under Diamond (5) — skipping Platinum
      const sig = await linkSig(root, root.address, gold.address, 3, root.address);
      await expect(
        pact.connect(root).linkWallet(gold.address, 3, sig)
      ).to.be.revertedWith("Child tier must be parent tier minus one");
    });

    it("Should reject if child already has a seal", async function () {
      const childSig = await mintSig(platinum.address, 4);
      await pact.mint(platinum.address, 4, 0, childSig, 0);

      const sig = await linkSig(root, root.address, platinum.address, 4, root.address);
      await expect(
        pact.connect(root).linkWallet(platinum.address, 4, sig)
      ).to.be.revertedWith("Child already has a seal");
    });

    it("Should reject if child is already linked", async function () {
      const sig1 = await linkSig(root, root.address, platinum.address, 4, root.address);
      await pact.connect(root).linkWallet(platinum.address, 4, sig1);

      const sig2 = await linkSig(root, root.address, platinum.address, 4, root.address);
      await expect(
        pact.connect(root).linkWallet(platinum.address, 4, sig2)
      ).to.be.revertedWith("Child already linked");
    });

    it("Should reject if caller has no seal or link", async function () {
      const sig = await linkSig(root, stranger.address, platinum.address, 4, root.address);
      await expect(
        pact.connect(stranger).linkWallet(platinum.address, 4, sig)
      ).to.be.revertedWith("Caller has no seal or link");
    });

    it("Should reject invalid root signature", async function () {
      // stranger signs instead of root
      const { chainId } = await ethers.provider.getNetwork();
      const message = ethers.solidityPackedKeccak256(
        ["address", "address", "uint8", "address", "uint256"],
        [root.address, platinum.address, 4, root.address, chainId]
      );
      const badSig = await stranger.signMessage(ethers.getBytes(message));

      await expect(
        pact.connect(root).linkWallet(platinum.address, 4, badSig)
      ).to.be.revertedWith("Invalid root signature");
    });

    it("Should prevent linking at Bronze tier or below (Bronze cannot link children)", async function () {
      // Build path: root→platinum→gold→silver→bronze
      const sig1 = await linkSig(root, root.address, platinum.address, 4, root.address);
      await pact.connect(root).linkWallet(platinum.address, 4, sig1);
      const sig2 = await linkSig(root, platinum.address, gold.address, 3, root.address);
      await pact.connect(platinum).linkWallet(gold.address, 3, sig2);
      const sig3 = await linkSig(root, gold.address, silver.address, 2, root.address);
      await pact.connect(gold).linkWallet(silver.address, 2, sig3);
      const sig4 = await linkSig(root, silver.address, bronze.address, 1, root.address);
      await pact.connect(silver).linkWallet(bronze.address, 1, sig4);

      // Bronze (tier 1) tries to link stranger at tier 0 — rejected
      const badSig = await linkSig(root, bronze.address, stranger.address, 0, root.address);
      await expect(
        pact.connect(bronze).linkWallet(stranger.address, 0, badSig)
      ).to.be.revertedWith("Cannot link at Bronze or below");
    });

    it("Should prevent minting a seal to an already-linked wallet", async function () {
      const sig = await linkSig(root, root.address, platinum.address, 4, root.address);
      await pact.connect(root).linkWallet(platinum.address, 4, sig);

      const mintSignature = await mintSig(platinum.address, 4);
      await expect(
        pact.mint(platinum.address, 4, 0, mintSignature, 0)
      ).to.be.revertedWith("Address is already a linked wallet");
    });
  });

  // ---------------------------------------------------------------------------
  // unlinkWallet
  // ---------------------------------------------------------------------------

  describe("unlinkWallet", function () {
    beforeEach(async function () {
      // Build: root (Diamond5) → platinum (4) → gold (3)
      const sig1 = await linkSig(root, root.address, platinum.address, 4, root.address);
      await pact.connect(root).linkWallet(platinum.address, 4, sig1);
      const sig2 = await linkSig(root, platinum.address, gold.address, 3, root.address);
      await pact.connect(platinum).linkWallet(gold.address, 3, sig2);
    });

    it("Should allow root to unlink a direct child", async function () {
      await pact.connect(root).unlinkWallet(platinum.address);

      expect(await pact.treeRoot(platinum.address)).to.equal(ethers.ZeroAddress);
      expect(await pact.effectiveTier(platinum.address)).to.equal(0);
    });

    it("Should cascade — unlinking a node removes its entire subtree", async function () {
      await pact.connect(root).unlinkWallet(platinum.address);

      // Gold was a child of Platinum and should also be cleared
      expect(await pact.treeRoot(gold.address)).to.equal(ethers.ZeroAddress);
      expect(await pact.effectiveTier(gold.address)).to.equal(0);
    });

    it("Should free the slot in the parent's children list", async function () {
      await pact.connect(root).unlinkWallet(platinum.address);
      const children = await pact.getTreeChildren(root.address);
      expect(children.length).to.equal(0);
    });

    it("Should emit WalletUnlinked event", async function () {
      await expect(pact.connect(root).unlinkWallet(platinum.address))
        .to.emit(pact, "WalletUnlinked")
        .withArgs(root.address, platinum.address);
    });

    it("Should allow relinking after unlink (slot freed)", async function () {
      await pact.connect(root).unlinkWallet(platinum.address);

      const sig = await linkSig(root, root.address, platinum.address, 4, root.address);
      await expect(
        pact.connect(root).linkWallet(platinum.address, 4, sig)
      ).to.not.be.reverted;
    });

    it("Should reject unlink by non-root caller", async function () {
      await expect(
        pact.connect(platinum).unlinkWallet(gold.address)
      ).to.be.revertedWith("Only root can unlink");
    });

    it("Should reject unlink of non-linked address", async function () {
      await expect(
        pact.connect(root).unlinkWallet(stranger.address)
      ).to.be.revertedWith("Address is not a linked wallet");
    });

    it("Should allow root to surgically unlink a mid-tree node, leaving siblings intact", async function () {
      // Add a second Platinum child
      const sig = await linkSig(root, root.address, silver.address, 4, root.address);
      await pact.connect(root).linkWallet(silver.address, 4, sig);

      // Unlink first Platinum — second should remain
      await pact.connect(root).unlinkWallet(platinum.address);

      expect(await pact.treeRoot(silver.address)).to.equal(root.address);
      expect(await pact.effectiveTier(silver.address)).to.equal(4);
    });
  });

  // ---------------------------------------------------------------------------
  // isValid with linked wallets
  // ---------------------------------------------------------------------------

  describe("isValid — linked wallets", function () {
    beforeEach(async function () {
      // root (Diamond 5) → platinum (4) → gold (3)
      const sig1 = await linkSig(root, root.address, platinum.address, 4, root.address);
      await pact.connect(root).linkWallet(platinum.address, 4, sig1);
      const sig2 = await linkSig(root, platinum.address, gold.address, 3, root.address);
      await pact.connect(platinum).linkWallet(gold.address, 3, sig2);
    });

    it("Should return true for a linked wallet at or above minTier", async function () {
      expect(await pact.isValid(platinum.address, 4)).to.be.true;
      expect(await pact.isValid(platinum.address, 3)).to.be.true;
      expect(await pact.isValid(platinum.address, 1)).to.be.true;
    });

    it("Should return false for a linked wallet below minTier", async function () {
      expect(await pact.isValid(gold.address, 4)).to.be.false;
    });

    it("Should return false for an unlinked address", async function () {
      expect(await pact.isValid(stranger.address, 1)).to.be.false;
    });

    it("Should return false for linked wallet when root seal is revoked (nuclear cascade)", async function () {
      const rootSealId = await pact.addressToSealId(root.address);
      await pact.revoke(rootSealId, "Fraud");

      expect(await pact.isValid(platinum.address, 4)).to.be.false;
      expect(await pact.isValid(gold.address, 3)).to.be.false;
    });

    it("Should return false for linked wallet when root seal expires", async function () {
      // Mint a new root with expiry
      const signers = await ethers.getSigners();
      const expiringRoot = signers[12];
      const block = await ethers.provider.getBlock("latest");
      const expiry = block.timestamp + 100;
      const mintSignature = await mintSig(expiringRoot.address, 5);
      await pact.mint(expiringRoot.address, 5, 0, mintSignature, expiry);

      // Link a child under the expiring root
      const child = signers[13];
      const sig = await linkSig(expiringRoot, expiringRoot.address, child.address, 4, expiringRoot.address);
      await pact.connect(expiringRoot).linkWallet(child.address, 4, sig);

      // Fast forward past expiry
      await ethers.provider.send("evm_increaseTime", [200]);
      await ethers.provider.send("evm_mine");

      expect(await pact.isValid(child.address, 4)).to.be.false;
    });

    it("Should return true for root seal holder via original isValid path", async function () {
      expect(await pact.isValid(root.address, 5)).to.be.true;
    });
  });

  // ---------------------------------------------------------------------------
  // Full tree — 5-level depth from Diamond root
  // ---------------------------------------------------------------------------

  describe("Full tree depth", function () {
    it("Should support a complete 5-level tree and pass isValid at each level", async function () {
      // root(5) → platinum(4) → gold(3) → silver(2) → bronze(1)
      const sig1 = await linkSig(root, root.address, platinum.address, 4, root.address);
      await pact.connect(root).linkWallet(platinum.address, 4, sig1);

      const sig2 = await linkSig(root, platinum.address, gold.address, 3, root.address);
      await pact.connect(platinum).linkWallet(gold.address, 3, sig2);

      const sig3 = await linkSig(root, gold.address, silver.address, 2, root.address);
      await pact.connect(gold).linkWallet(silver.address, 2, sig3);

      const sig4 = await linkSig(root, silver.address, bronze.address, 1, root.address);
      await pact.connect(silver).linkWallet(bronze.address, 1, sig4);

      expect(await pact.isValid(root.address,     5)).to.be.true;
      expect(await pact.isValid(platinum.address, 4)).to.be.true;
      expect(await pact.isValid(gold.address,     3)).to.be.true;
      expect(await pact.isValid(silver.address,   2)).to.be.true;
      expect(await pact.isValid(bronze.address,   1)).to.be.true;

      // Each level's treeRoot points to root
      expect(await pact.treeRoot(platinum.address)).to.equal(root.address);
      expect(await pact.treeRoot(gold.address)).to.equal(root.address);
      expect(await pact.treeRoot(silver.address)).to.equal(root.address);
      expect(await pact.treeRoot(bronze.address)).to.equal(root.address);
    });

    it("Should cascade revocation through all 5 levels instantly", async function () {
      const sig1 = await linkSig(root, root.address, platinum.address, 4, root.address);
      await pact.connect(root).linkWallet(platinum.address, 4, sig1);
      const sig2 = await linkSig(root, platinum.address, gold.address, 3, root.address);
      await pact.connect(platinum).linkWallet(gold.address, 3, sig2);
      const sig3 = await linkSig(root, gold.address, silver.address, 2, root.address);
      await pact.connect(gold).linkWallet(silver.address, 2, sig3);
      const sig4 = await linkSig(root, silver.address, bronze.address, 1, root.address);
      await pact.connect(silver).linkWallet(bronze.address, 1, sig4);

      const rootSealId = await pact.addressToSealId(root.address);
      await pact.revoke(rootSealId, "Revoked");

      expect(await pact.isValid(platinum.address, 4)).to.be.false;
      expect(await pact.isValid(gold.address,     3)).to.be.false;
      expect(await pact.isValid(silver.address,   2)).to.be.false;
      expect(await pact.isValid(bronze.address,   1)).to.be.false;
    });
  });

  // ---------------------------------------------------------------------------
  // Cross-chain boundary
  // ---------------------------------------------------------------------------

  describe("setCrossChainBoundary", function () {
    it("Should allow owner to set boundary on a Gold (tier 3) node", async function () {
      // Mint a Gold root directly for this test
      const signers = await ethers.getSigners();
      const goldRoot = signers[12];
      const goldSig = await mintSig(goldRoot.address, 3);
      await pact.mint(goldRoot.address, 3, 0, goldSig, 0);

      await pact.setCrossChainBoundary(goldRoot.address, 1, stranger.address);

      const boundary = await pact.crossChainBoundary(goldRoot.address);
      expect(boundary.partnerChainId).to.equal(1);
      expect(boundary.partnerAddress).to.equal(stranger.address);
      expect(boundary.verified).to.be.true;
    });

    it("Should allow owner to set boundary on a Platinum (tier 4) linked node", async function () {
      const sig = await linkSig(root, root.address, platinum.address, 4, root.address);
      await pact.connect(root).linkWallet(platinum.address, 4, sig);

      await pact.setCrossChainBoundary(platinum.address, 42161, stranger.address);

      const boundary = await pact.crossChainBoundary(platinum.address);
      expect(boundary.partnerChainId).to.equal(42161);
      expect(boundary.partnerAddress).to.equal(stranger.address);
      expect(boundary.verified).to.be.true;
    });

    it("Should emit CrossChainBoundarySet event", async function () {
      const sig = await linkSig(root, root.address, platinum.address, 4, root.address);
      await pact.connect(root).linkWallet(platinum.address, 4, sig);

      await expect(pact.setCrossChainBoundary(platinum.address, 42161, stranger.address))
        .to.emit(pact, "CrossChainBoundarySet")
        .withArgs(platinum.address, 42161, stranger.address);
    });

    it("Should reject boundary on non-boundary tiers (Diamond, Silver, Bronze)", async function () {
      // Diamond (5) root — not a boundary node
      await expect(
        pact.setCrossChainBoundary(root.address, 1, stranger.address)
      ).to.be.revertedWith("Only Gold and Platinum nodes can have a cross-chain boundary");

      // Silver linked node
      const sig1 = await linkSig(root, root.address, platinum.address, 4, root.address);
      await pact.connect(root).linkWallet(platinum.address, 4, sig1);
      const sig2 = await linkSig(root, platinum.address, gold.address, 3, root.address);
      await pact.connect(platinum).linkWallet(gold.address, 3, sig2);
      const sig3 = await linkSig(root, gold.address, silver.address, 2, root.address);
      await pact.connect(gold).linkWallet(silver.address, 2, sig3);

      await expect(
        pact.setCrossChainBoundary(silver.address, 1, stranger.address)
      ).to.be.revertedWith("Only Gold and Platinum nodes can have a cross-chain boundary");
    });

    it("Should reject boundary with zero partner address", async function () {
      const sig = await linkSig(root, root.address, platinum.address, 4, root.address);
      await pact.connect(root).linkWallet(platinum.address, 4, sig);

      await expect(
        pact.setCrossChainBoundary(platinum.address, 1, ethers.ZeroAddress)
      ).to.be.revertedWith("Invalid partner address");
    });

    it("Should reject boundary set by non-owner", async function () {
      const sig = await linkSig(root, root.address, platinum.address, 4, root.address);
      await pact.connect(root).linkWallet(platinum.address, 4, sig);

      await expect(
        pact.connect(stranger).setCrossChainBoundary(platinum.address, 1, gold.address)
      ).to.be.reverted;
    });
  });
});
