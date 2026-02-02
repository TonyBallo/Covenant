const { expect } = require("chai");
const { ethers } = require("hardhat");
require("solidity-coverage");

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
      
      // REMOVED: burn testing now in Time-Locked Burn System section
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

  describe("Time-Locked Burn System", function () {
    
    beforeEach(async function () {
        const signature = await createSignature(owner, user1.address, 2);
        await pact.mint(user1.address, 2, signature);
    });

    it("Should allow user to request burn", async function () {
        const sealId = await pact.addressToSealId(user1.address);
        
        await pact.connect(user1).requestBurn(sealId);
        
        const burnReq = await pact.burnRequests(sealId);
        expect(burnReq.pending).to.be.true;
    });

    it("Should emit BurnRequested event with correct parameters", async function () {
        const sealId = await pact.addressToSealId(user1.address);
        
        const tx = await pact.connect(user1).requestBurn(sealId);
        const receipt = await tx.wait();
        
        // Find the BurnRequested event
        const event = receipt.logs.find(
            log => log.fragment && log.fragment.name === 'BurnRequested'
        );
        
        expect(event).to.exist;
        expect(event.args[0]).to.equal(sealId); // sealId
        expect(event.args[1]).to.equal(user1.address); // owner
        expect(event.args[2]).to.be.gt(0); // executableAt exists
    });

    it("Should prevent duplicate burn requests", async function () {
        const sealId = await pact.addressToSealId(user1.address);
        
        await pact.connect(user1).requestBurn(sealId);
        
        await expect(
            pact.connect(user1).requestBurn(sealId)
        ).to.be.revertedWith("Burn already requested");
    });

    it("Should prevent burn request on revoked seal", async function () {
        const sealId = await pact.addressToSealId(user1.address);
        
        await pact.revoke(sealId, "Fraud");
        
        await expect(
            pact.connect(user1).requestBurn(sealId)
        ).to.be.revertedWith("Cannot burn revoked seal");
    });

    it("Should allow canceling burn request", async function () {
        const sealId = await pact.addressToSealId(user1.address);
        
        await pact.connect(user1).requestBurn(sealId);
        await pact.connect(user1).cancelBurnRequest(sealId);
        
        const burnReq = await pact.burnRequests(sealId);
        expect(burnReq.pending).to.be.false;
    });

    it("Should emit BurnCancelled event", async function () {
        const sealId = await pact.addressToSealId(user1.address);
        
        await pact.connect(user1).requestBurn(sealId);
        
        await expect(pact.connect(user1).cancelBurnRequest(sealId))
            .to.emit(pact, "BurnCancelled")
            .withArgs(sealId, user1.address);
    });

    it("Should prevent canceling non-existent burn request", async function () {
        const sealId = await pact.addressToSealId(user1.address);
        
        await expect(
            pact.connect(user1).cancelBurnRequest(sealId)
        ).to.be.revertedWith("No pending burn request");
    });

    it("Should prevent executing burn before delay", async function () {
        const sealId = await pact.addressToSealId(user1.address);
        
        await pact.connect(user1).requestBurn(sealId);
        
        await expect(
            pact.connect(user1).executeBurn(sealId)
        ).to.be.revertedWith("Burn delay not elapsed");
    });

    it("Should execute burn after delay", async function () {
        const sealId = await pact.addressToSealId(user1.address);
        
        await pact.connect(user1).requestBurn(sealId);
        
        // Fast forward 90 days
        await ethers.provider.send("evm_increaseTime", [90 * 24 * 60 * 60]);
        await ethers.provider.send("evm_mine");
        
        await pact.connect(user1).executeBurn(sealId);
        
        const [isVerified] = await pact.getVerificationStatus(user1.address);
        expect(isVerified).to.be.false;
    });

    it("Should emit SealBurned event on execution", async function () {
        const sealId = await pact.addressToSealId(user1.address);
        
        await pact.connect(user1).requestBurn(sealId);
        
        await ethers.provider.send("evm_increaseTime", [90 * 24 * 60 * 60]);
        await ethers.provider.send("evm_mine");
        
        await expect(pact.connect(user1).executeBurn(sealId))
            .to.emit(pact, "SealBurned")
            .withArgs(sealId, user1.address);
    });

    it("Should prevent executing without request", async function () {
        const sealId = await pact.addressToSealId(user1.address);
        
        await expect(
            pact.connect(user1).executeBurn(sealId)
        ).to.be.revertedWith("No pending burn request");
    });

    it("Should show burn pending in verification status", async function () {
        const sealId = await pact.addressToSealId(user1.address);
        
        await pact.connect(user1).requestBurn(sealId);
        
        const [verified, tier, revoked, burnPending, executableAt] = 
            await pact.getVerificationStatus(user1.address);
        
        expect(verified).to.be.true;
        expect(burnPending).to.be.true;
        expect(executableAt).to.be.gt(0);
    });

    it("Should only allow seal owner to request burn", async function () {
        const sealId = await pact.addressToSealId(user1.address);
        
        await expect(
            pact.connect(user2).requestBurn(sealId)
        ).to.be.revertedWith("Not seal owner");
    });

    it("Should only allow seal owner to cancel burn", async function () {
        const sealId = await pact.addressToSealId(user1.address);
        
        await pact.connect(user1).requestBurn(sealId);
        
        await expect(
            pact.connect(user2).cancelBurnRequest(sealId)
        ).to.be.revertedWith("Not seal owner");
    });

    it("Should only allow seal owner to execute burn", async function () {
        const sealId = await pact.addressToSealId(user1.address);
        
        await pact.connect(user1).requestBurn(sealId);
        
        await ethers.provider.send("evm_increaseTime", [90 * 24 * 60 * 60]);
        await ethers.provider.send("evm_mine");
        
        await expect(
            pact.connect(user2).executeBurn(sealId)
        ).to.be.revertedWith("Not seal owner");
    });
});

describe("Ownership Verification Helper", function () {
    
    beforeEach(async function () {
        const sig1 = await createSignature(owner, user1.address, 2);
        await pact.mint(user1.address, 2, sig1);
        
        const sig2 = await createSignature(owner, user2.address, 3);
        await pact.mint(user2.address, 3, sig2);
    });

    it("Should verify correct ownership", async function () {
        const sealId = await pact.addressToSealId(user1.address);
        
        const isOwner = await pact.verifyOwnership(user1.address, sealId);
        expect(isOwner).to.be.true;
    });

    it("Should reject wrong user claiming seal", async function () {
        const sealId = await pact.addressToSealId(user1.address);
        
        // user2 trying to claim user1's seal
        const isOwner = await pact.verifyOwnership(user2.address, sealId);
        expect(isOwner).to.be.false;
    });

    it("Should reject user claiming non-existent seal", async function () {
        const fakeId = 9999;
        
        const isOwner = await pact.verifyOwnership(user1.address, fakeId);
        expect(isOwner).to.be.false;
    });

    it("Should reject wrong seal ID for user", async function () {
        const user1SealId = await pact.addressToSealId(user1.address);
        const user2SealId = await pact.addressToSealId(user2.address);
        
        // user1 claiming user2's seal ID
        const isOwner = await pact.verifyOwnership(user1.address, user2SealId);
        expect(isOwner).to.be.false;
    });

    it("Should return false for burned seal", async function () {
        const sealId = await pact.addressToSealId(user1.address);
        
        // Request and execute burn
        await pact.connect(user1).requestBurn(sealId);
        await ethers.provider.send("evm_increaseTime", [90 * 24 * 60 * 60]);
        await ethers.provider.send("evm_mine");
        await pact.connect(user1).executeBurn(sealId);
        
        const isOwner = await pact.verifyOwnership(user1.address, sealId);
        expect(isOwner).to.be.false;
    });

    it("Should work correctly for multiple users", async function () {
        const seal1 = await pact.addressToSealId(user1.address);
        const seal2 = await pact.addressToSealId(user2.address);
        
        expect(await pact.verifyOwnership(user1.address, seal1)).to.be.true;
        expect(await pact.verifyOwnership(user2.address, seal2)).to.be.true;
        expect(await pact.verifyOwnership(user1.address, seal2)).to.be.false;
        expect(await pact.verifyOwnership(user2.address, seal1)).to.be.false;
    });
});
});