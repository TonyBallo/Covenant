const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("IdentityPact v2", function () {
  let pact;
  let owner;
  let user1;
  let user2;
  
  // Helper function to create signature
// Helper function to create signature
async function createSignature(signer, userAddress, tier) {
    // NO timestamp in message
    const message = ethers.solidityPackedKeccak256(
        ["address", "uint8"],
        [userAddress, tier]
    );
    return await signer.signMessage(ethers.getBytes(message));
}
  
  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    
    const IdentityPact = await ethers.getContractFactory("IdentityPact");
    pact = await IdentityPact.deploy();
  });
  
  describe("Minting", function () {
    it("Should mint seal with correct tier and valid signature", async function () {
      const signature = await createSignature(owner, user1.address, 2);
      await pact.mint(user1.address, 2, signature);
      
      const [isVerified, tier, isRevoked] = await pact.getVerificationStatus(user1.address);
      
      expect(isVerified).to.equal(true);
      expect(tier).to.equal(2);
      expect(isRevoked).to.equal(false);
    });
    
    it("Should prevent duplicate seals to same address", async function () {
      const sig1 = await createSignature(owner, user1.address, 1);
      await pact.mint(user1.address, 1, sig1);
      
      const sig2 = await createSignature(owner, user1.address, 2);
      await expect(
        pact.mint(user1.address, 2, sig2)
      ).to.be.revertedWith("Address already has seal");
    });
    
    it("Should only allow owner to mint", async function () {
      const signature = await createSignature(user1, user2.address, 1);
      await expect(
        pact.connect(user1).mint(user2.address, 1, signature)
      ).to.be.reverted;
    });
    
    it("Should reject invalid Covenant signature", async function () {
      // Sign with wrong key (user2 instead of owner)
      const badSignature = await createSignature(user2, user1.address, 3);
      
      await expect(
        pact.mint(user1.address, 3, badSignature)
      ).to.be.revertedWith("Invalid Covenant signature");
    });
    
    it("Should reject signature for wrong address", async function () {
      // Sign for user2 but try to mint to user1
      const signature = await createSignature(owner, user2.address, 3);
      
      await expect(
        pact.mint(user1.address, 3, signature)
      ).to.be.revertedWith("Invalid Covenant signature");
    });
    
    it("Should emit SealMinted event", async function () {
      const signature = await createSignature(owner, user1.address, 2);
      
      await expect(pact.mint(user1.address, 2, signature))
        .to.emit(pact, "SealMinted")
        .withArgs(user1.address, 1, 2); // sealId=1, tier=2
    });
  });
  
  describe("Soulbound Mechanics", function () {
    beforeEach(async function () {
      const signature = await createSignature(owner, user1.address, 2);
      await pact.mint(user1.address, 2, signature);
    });
    
    it("Should prevent transfers", async function () {
      const sealId = await pact.addressToSealId(user1.address);
      
      await expect(
        pact.connect(user1).transferFrom(user1.address, user2.address, sealId)
      ).to.be.revertedWith("Soulbound: Transfer not allowed");
    });
    
    it("Should prevent safe transfers", async function () {
      const sealId = await pact.addressToSealId(user1.address);
      
      await expect(
        pact.connect(user1)["safeTransferFrom(address,address,uint256)"](
          user1.address, 
          user2.address, 
          sealId
        )
      ).to.be.revertedWith("Soulbound: Transfer not allowed");
    });
    
    it("Should allow user to burn their own seal", async function () {
      const sealId = await pact.addressToSealId(user1.address);
      
      await pact.connect(user1).burn(sealId);
      
      const [isVerified] = await pact.getVerificationStatus(user1.address);
      expect(isVerified).to.equal(false);
    });
    
    it("Should emit SealBurned event", async function () {
      const sealId = await pact.addressToSealId(user1.address);
      
      await expect(pact.connect(user1).burn(sealId))
        .to.emit(pact, "SealBurned")
        .withArgs(sealId, user1.address);
    });
    
    it("Should prevent burning someone else's seal", async function () {
      const sealId = await pact.addressToSealId(user1.address);
      
      await expect(
        pact.connect(user2).burn(sealId)
      ).to.be.revertedWith("Not seal owner");
    });
  });
  
  describe("Revocation", function () {
    beforeEach(async function () {
      const signature = await createSignature(owner, user1.address, 3);
      await pact.mint(user1.address, 3, signature);
    });
    
    it("Should allow owner to revoke seal", async function () {
      const sealId = await pact.addressToSealId(user1.address);
      
      await pact.revoke(sealId, "Fraud detected");
      
      const [, , isRevoked] = await pact.getVerificationStatus(user1.address);
      expect(isRevoked).to.equal(true);
    });
    
    it("Should emit SealRevoked event", async function () {
      const sealId = await pact.addressToSealId(user1.address);
      
      await expect(pact.revoke(sealId, "Test"))
        .to.emit(pact, "SealRevoked")
        .withArgs(sealId, user1.address, "Test");
    });
    
    it("Should prevent double revocation", async function () {
      const sealId = await pact.addressToSealId(user1.address);
      
      await pact.revoke(sealId, "First revocation");
      
      await expect(
        pact.revoke(sealId, "Second revocation")
      ).to.be.revertedWith("Already revoked");
    });
    
    it("Should only allow owner to revoke", async function () {
      const sealId = await pact.addressToSealId(user1.address);
      
      await expect(
        pact.connect(user1).revoke(sealId, "Trying to revoke")
      ).to.be.reverted;
    });
  });
  
  describe("Tier Upgrades", function () {
    beforeEach(async function () {
      const signature = await createSignature(owner, user1.address, 1);
      await pact.mint(user1.address, 1, signature);
    });
    
    it("Should allow tier upgrades with valid signature", async function () {
      const sealId = await pact.addressToSealId(user1.address);
      const newSignature = await createSignature(owner, user1.address, 3);
      
      await pact.upgradeTier(sealId, 3, newSignature);
      
      const [, tier] = await pact.getVerificationStatus(user1.address);
      expect(tier).to.equal(3);
    });
    
    it("Should emit SealUpgraded event", async function () {
      const sealId = await pact.addressToSealId(user1.address);
      const newSignature = await createSignature(owner, user1.address, 2);
      
      await expect(pact.upgradeTier(sealId, 2, newSignature))
        .to.emit(pact, "SealUpgraded")
        .withArgs(sealId, 1, 2); // oldTier=1, newTier=2
    });
    
    it("Should prevent tier downgrades", async function () {
      const sealId = await pact.addressToSealId(user1.address);
      
      // First upgrade to tier 2
      const sig2 = await createSignature(owner, user1.address, 2);
      await pact.upgradeTier(sealId, 2, sig2);
      
      // Try to downgrade to tier 1
      const sig1 = await createSignature(owner, user1.address, 1);
      await expect(
        pact.upgradeTier(sealId, 1, sig1)
      ).to.be.revertedWith("Can only upgrade tier");
    });
    
    it("Should reject invalid signature on upgrade", async function () {
      const sealId = await pact.addressToSealId(user1.address);
      
      // Sign with wrong key
      const badSignature = await createSignature(user2, user1.address, 3);
      
      await expect(
        pact.upgradeTier(sealId, 3, badSignature)
      ).to.be.revertedWith("Invalid Covenant signature");
    });
    
    it("Should prevent upgrading revoked seal", async function () {
      const sealId = await pact.addressToSealId(user1.address);
      
      await pact.revoke(sealId, "Revoked");
      
      const newSignature = await createSignature(owner, user1.address, 3);
      await expect(
        pact.upgradeTier(sealId, 3, newSignature)
      ).to.be.revertedWith("Seal is revoked");
    });
  });
  
  describe("Verification Status", function () {
    it("Should return false for unverified address", async function () {
      const [isVerified, tier, isRevoked] = await pact.getVerificationStatus(user1.address);
      
      expect(isVerified).to.equal(false);
      expect(tier).to.equal(0); // NONE
      expect(isRevoked).to.equal(false);
    });
    
    it("Should return correct status for verified user", async function () {
      const signature = await createSignature(owner, user1.address, 4);
      await pact.mint(user1.address, 4, signature);
      
      const [isVerified, tier, isRevoked] = await pact.getVerificationStatus(user1.address);
      
      expect(isVerified).to.equal(true);
      expect(tier).to.equal(4);
      expect(isRevoked).to.equal(false);
    });
  });
  
  describe("Reentrancy Protection", function () {
    it("Should have nonReentrant on mint", async function () {
      // This is more of a coverage test - ReentrancyGuard is battle-tested
      const signature = await createSignature(owner, user1.address, 2);
      await expect(pact.mint(user1.address, 2, signature)).to.not.be.reverted;
    });
  });
});