const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("IdentitySBT", function () {
  let identitySBT;
  let owner;
  let user1;
  let user2;
  
  const sampleHash = ethers.keccak256(ethers.toUtf8Bytes("sample-identity-data"));
  
  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    
    const IdentitySBT = await ethers.getContractFactory("IdentitySBT");
    identitySBT = await IdentitySBT.deploy();
  });
  
  describe("Minting", function () {
    it("Should mint SBT with correct tier", async function () {
      await identitySBT.mint(user1.address, 2, sampleHash); // SILVER
      
      const [isVerified, tier, isRevoked] = await identitySBT.getVerificationStatus(user1.address);
      
      expect(isVerified).to.equal(true);
      expect(tier).to.equal(2);
      expect(isRevoked).to.equal(false);
    });
    
    it("Should prevent duplicate SBTs to same address", async function () {
      await identitySBT.mint(user1.address, 1, sampleHash);
      
      await expect(
        identitySBT.mint(user1.address, 2, sampleHash)
      ).to.be.revertedWith("Address already has SBT");
    });
    
    it("Should only allow owner to mint", async function () {
      await expect(
        identitySBT.connect(user1).mint(user2.address, 1, sampleHash)
      ).to.be.reverted;
    });
  });
  
  describe("Soulbound Mechanics", function () {
    beforeEach(async function () {
      await identitySBT.mint(user1.address, 2, sampleHash);
    });
    
    it("Should prevent transfers", async function () {
      const tokenId = await identitySBT.addressToTokenId(user1.address);
      
      await expect(
        identitySBT.connect(user1).transferFrom(user1.address, user2.address, tokenId)
      ).to.be.revertedWith("Soulbound: Transfer not allowed");
    });
    
    it("Should allow user to burn their own SBT", async function () {
      const tokenId = await identitySBT.addressToTokenId(user1.address);
      
      await identitySBT.connect(user1).burn(tokenId);
      
      const [isVerified] = await identitySBT.getVerificationStatus(user1.address);
      expect(isVerified).to.equal(false);
    });
  });
  
  describe("Revocation", function () {
    beforeEach(async function () {
      await identitySBT.mint(user1.address, 3, sampleHash);
    });
    
    it("Should allow owner to revoke SBT", async function () {
      const tokenId = await identitySBT.addressToTokenId(user1.address);
      
      await identitySBT.revoke(tokenId, "Fraud detected");
      
      const [, , isRevoked] = await identitySBT.getVerificationStatus(user1.address);
      expect(isRevoked).to.equal(true);
    });
    
    it("Should emit revocation event", async function () {
      const tokenId = await identitySBT.addressToTokenId(user1.address);
      
      await expect(identitySBT.revoke(tokenId, "Test"))
        .to.emit(identitySBT, "SBTRevoked")
        .withArgs(tokenId, user1.address, "Test");
    });
  });
  
  describe("Tier Upgrades", function () {
    beforeEach(async function () {
      await identitySBT.mint(user1.address, 1, sampleHash); // BRONZE
    });
    
    it("Should allow tier upgrades", async function () {
      const tokenId = await identitySBT.addressToTokenId(user1.address);
      const newHash = ethers.keccak256(ethers.toUtf8Bytes("upgraded-data"));
      
      await identitySBT.upgradeTier(tokenId, 3, newHash); // GOLD
      
      const [, tier] = await identitySBT.getVerificationStatus(user1.address);
      expect(tier).to.equal(3);
    });
    
    it("Should prevent tier downgrades", async function () {
      const tokenId = await identitySBT.addressToTokenId(user1.address);
      const newHash = ethers.keccak256(ethers.toUtf8Bytes("new-data"));
      
      await identitySBT.upgradeTier(tokenId, 2, newHash); // Upgrade to SILVER
      
      await expect(
        identitySBT.upgradeTier(tokenId, 1, newHash) // Try downgrade
      ).to.be.revertedWith("Can only upgrade tier");
    });
  });
});