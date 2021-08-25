//const { expectRevert, increaseTime } = require('@openzeppelin/test-helpers');
const { expectEvent, expectRevert, time } = require('@openzeppelin/test-helpers');
const CrowdSale = artifacts.require('main/CrowdSale.sol');
const VMAINToken = artifacts.require('main/VMAINToken.sol');

contract('CrowdSale', (accounts) => {
  let crowdsale;
  let saleAddress;
  let token;
  let tokenAddr;
  let gasPrice;
  let NFAddr = [];
  let crowdsalesupply; 

  const totalSupply = web3.utils.toWei('300');
  const minpurchase = web3.utils.toWei('0.1');
  const maxPurchase = web3.utils.toWei('1.5');
  
  const duration = 20;
  const rate = 2; 
  
  const holder0 = accounts[0];
  const holder1 = accounts[1];
  const holder2 = accounts[2];
  const HOLDERS = 
    [holder0,holder1,holder2];
  console.log("Holders: " + HOLDERS);
  
  const owner = accounts[3]; 
  console.log("Owner: " + owner);
  
  const mainFrameAddress = accounts[4];
  const adminWallet = [accounts[5],accounts[7]];
  const vMainAdmin = accounts[6];
  
 /* NFAddr = [
    "0x93088De4Fe5E6e01Fce95F22BB34aC21CE4552a9",
    "0x91FEe2C6d80AC226ebAF145856044E7C51753c4b",
    "0x08adab63D3b2d84CDB354B92b940c29733Ad2EEd"
  ];
  */
  beforeEach (async () => {
//deploy VMAINToken
  token = await VMAINToken.new(totalSupply, vMainAdmin, {from: owner});
  tokenAddr = await token.address;
 
//deploy CrowdSale
  crowdsale = await CrowdSale.new(
      tokenAddr,
      mainFrameAddress,
     // adminWallet,
      {from: owner}); 
//console.log(tokenAddr + "  " + NFAddr + "   " + maxpricelist + "   "+ mainFrameAddress+ "   "+ adminWallet);
console.log(tokenAddr +  "  " + mainFrameAddress);
      saleAddress = await crowdsale.address;
//console.log("Crowdsale Address: " + saleAddress);
  });

  describe("set Admins", () => {
    it('should NOT start the CrowdSale because admins not set', async () => {
      const duration = 100;
      const rate = 2;
      let crowdsalesupply = web3.utils.toWei('200');
      await expectRevert(
        crowdsale.start(duration, rate, minpurchase, maxPurchase, crowdsalesupply, {from: owner}), 
        'Need to call setSaleAdmin on VMAINToken before start'
      );
    });  
    it('should setAdmins', async () => {   
      const tokenbalanceBefore = await crowdsale.balanceOf(vMainAdmin);
      const salebalanceBefore = await crowdsale.balanceOf(saleAddress);
      
      await token.setSaleAdmin(saleAddress, { from: vMainAdmin });
      
      const tokenbalanceAfter = await crowdsale.balanceOf(vMainAdmin);
      const salebalanceAfter = await crowdsale.balanceOf(saleAddress);
      
      assert(salebalanceAfter.eq(web3.utils.toBN(totalSupply)));
      assert(salebalanceAfter.eq(tokenbalanceBefore));
      assert(salebalanceBefore.eq(tokenbalanceAfter));      
    });  

    it('should set crowdSale btc wallet Admins', async () => {       
      await crowdsale.addAdmins(adminWallet, { from: owner });
      console.log(" wallet admin 0 : "+ await crowdsale.isAdmin(adminWallet[0]));
      console.log(" wallet admin 1 : "+ await crowdsale.isAdmin(adminWallet[1]));
    });  
  }); 

  describe("Fail Start", () => {
    it('should NOT start if crowdSaleSupply > totalSupply', async () => {
      await token.setSaleAdmin(saleAddress,{ from: vMainAdmin });
      
      crowdsalesupply = web3.utils.toWei('301');
      await expectRevert(
        crowdsale.start(duration, rate, minpurchase, maxPurchase, crowdsalesupply, {from: owner}), 
        'crowdSaleSupply should be <= totalSupply'
      );
    });
    it('should NOT start if not owner', async () => {
      await token.setSaleAdmin(saleAddress,{ from: vMainAdmin });
      crowdsalesupply = web3.utils.toWei('50');
      await expectRevert(
        crowdsale.start(duration, rate, minpurchase, maxPurchase, crowdsalesupply, {from: accounts[2]}),
        'Ownable: caller is not the owner'
      );
    });
    it('should NOT start if miPurchase == 0', async () => {
      await token.setSaleAdmin(saleAddress,{ from: vMainAdmin });
      let minpurchaseNA = 0;
      await expectRevert(
        crowdsale.start(duration, rate, minpurchaseNA, maxPurchase, crowdsalesupply, {from: owner}),
        '_minPurchase should be > 0'
      );
    });
    it('should NOT start the CrowdSale if miPurchase >= crowdSaleSupply', async () => {
      await token.setSaleAdmin(saleAddress,{ from: vMainAdmin });
      minpurchaseNA = web3.utils.toWei('51');
      await expectRevert(
        crowdsale.start(duration, rate, minpurchaseNA, maxPurchase, crowdsalesupply, {from: owner}),
        '_minPurchase should be < crowdSaleSupply'
      );
    });
    it('should Fail start after successful start', async () => {
      await token.setSaleAdmin(saleAddress, { from: vMainAdmin });
      await crowdsale.start(duration, rate, minpurchase, maxPurchase, crowdsalesupply, {from: owner });
      await expectRevert(
        crowdsale.start(duration, rate, minpurchase, maxPurchase, crowdsalesupply, {from: owner}),
        'Sale should not be active'
      );
    });
  });
  
  describe("success Start", () => {
    it('should start the CrowdSale', async () => {
      await token.setSaleAdmin(saleAddress,{ from: vMainAdmin });
      await crowdsale.addAdmins(adminWallet, { from: owner });
      crowdsalesupply = web3.utils.toWei('5');
      const start = parseInt((new Date()).getTime() / 1000);
      //  time.increaseTo(start +5);
      await crowdsale.start(duration, rate, minpurchase, maxPurchase, crowdsalesupply, {from: owner}); 
      const expectedEnd = start + duration ;
      const end = await crowdsale.end();
      
      console.log("expectedEnd:  " + expectedEnd);
      console.log("end:  " + end);

      const actualAvailableTokens = await crowdsale.availableTokens();
      const actualMinPurchase = await crowdsale.minPurchase();
      const actualRate = await crowdsale.rate();

      assert(actualAvailableTokens.eq(web3.utils.toBN(crowdsalesupply)));
      assert(actualMinPurchase.eq(web3.utils.toBN(minpurchase)));
      assert(actualRate.eq(web3.utils.toBN(rate)));
    });
  });
  
  describe("BUY before START", () => {
    it('should fail BUY before Sale has started', async () => {
      await token.setSaleAdmin(saleAddress,{ from: vMainAdmin });
      await crowdsale.addAdmins(adminWallet, { from: owner });

      await expectRevert(
        crowdsale.buy({from: accounts[2], value: web3.utils.toWei('0.2')}),
          'Sale must be active'
        );
    });
  });

  context('Sale started', () => {
    
    crowdsalesupply = web3.utils.toWei('5');
    beforeEach(async() => {
   //   start = parseInt((new Date()).getTime() / 1000);
   //   time.increaseTo(start);
      await token.setSaleAdmin(saleAddress,{ from: vMainAdmin }); 
      await crowdsale.addAdmins(adminWallet, { from: owner });

      await crowdsale.start(duration, rate, minpurchase, maxPurchase, crowdsalesupply, {from: owner});
    });
    describe("BUY", () => {
    
      // it('should NOT let non-investors buy', async () => {
      //   await expectRevert(
      //   crowdsale.buy({from: accounts[6], value: web3.utils.toWei('0.2')}),
      //     'The User does NOT hold NFT'
      //   );
      // });

      it('should NOT buy if amount < minpurchase', async () => {
        let value = await web3.utils.toBN(minpurchase).sub(await(web3.utils.toBN(1))); 
        await expectRevert(
        crowdsale.buy({from: accounts[2], value}),
          'must send more then global minPurchase'
        );
      });
      
      // it('should NOT buy if total deposits reached maxPurchase', async () => {
      //   const amount2 = web3.utils.toWei('0.5'); 
      //   await crowdsale.buy({from: holder2, value: amount2});
      //   await expectRevert(
      //     crowdsale.buy({from: holder2, value: amount2}),
      //     'Investor deposits have reached maxPurchase amount'
      //   );
      // });

      it('should buy and receive tokens  holder0', async () => {
        gasPrice = await web3.eth.getGasPrice();
        const amount0 = web3.utils.toBN(web3.utils.toWei('1'));
        
        const balance0Before = await web3.eth.getBalance(holder0);
        const token0balanceBefore = await token.balanceOf(holder0);

        let tx = await crowdsale.buy({ from: holder0, value: amount0 });
        const amount = '1000000000000000000';
        const tokenAmount = '2000000000000000000';
        expectEvent(tx, 'TokenPurchase', {
          purchaser: holder0,
          value: amount,
          amount: tokenAmount
        });

        const balance0After = await web3.eth.getBalance(holder0);
        const token0balanceAfter = await token.balanceOf(holder0);

        let gasUsed = await web3.utils.toBN(tx.receipt.gasUsed);
        let gasSpent = web3.utils.toBN(10* gasPrice * gasUsed);

        const amount0WithGas = amount0.add(gasSpent);
        const balance0 = token0balanceAfter.sub(token0balanceBefore);
        const delta = balance0Before - balance0After ;

        // Add small margin for mismatch in calculation
        assert((delta - amount0WithGas < 5000000) &&  (delta - amount0WithGas > (-5000000) ));
        assert(balance0.eq(amount0.mul(web3.utils.toBN(rate))));    
      });

      it('should buy and receive tokens  holder1', async () => {
        const amount1 = web3.utils.toBN(web3.utils.toWei('0.5'));
        
        const balance1Before = await web3.eth.getBalance(holder1);
        const token1balanceBefore = await token.balanceOf(holder1);
        
        const tFUELBalanceVaultBefore = await web3.eth.getBalance(mainFrameAddress);

        let tx = await crowdsale.buy({from: holder1, value: amount1});
        const amount = '500000000000000000';
        const tokenAmount = '1000000000000000000';
        expectEvent(tx, 'TokenPurchase', {
          purchaser: holder1,
          value: amount,
          amount: tokenAmount
        });
        
        const balance1After = await web3.eth.getBalance(holder1);
        const token1balanceAfter = await token.balanceOf(holder1);
        
        gasUsed = await web3.utils.toBN(tx.receipt.gasUsed);
        gasSpent = web3.utils.toBN(10* gasPrice * gasUsed);
        
        const amount1WithGas = amount1.add(gasSpent);
        const balance1 = token1balanceAfter.sub(token1balanceBefore);
        const delta = balance1Before - balance1After ;

        const tFUELBalanceVaultAfter = await web3.eth.getBalance(mainFrameAddress);
        console.log("Vault tFUEL balance before 0.5 tFUEL deposit "+  tFUELBalanceVaultBefore);
        console.log("Vault tFUEL balance After 0.5 tFUEL deposit "+  tFUELBalanceVaultAfter);

        // Add small margin for mismatch in calculation
        assert((delta - amount1WithGas < 5000000) &&  (delta - amount1WithGas > (-5000000) ));
        assert(balance1.eq(amount1.mul(web3.utils.toBN(rate))));
      });
   


      // it('should buy and imburse: Investor deposit more then maxPurchase', async () => {
      //   const amount1 = web3.utils.toBN(web3.utils.toWei('3'));
      //   const amountAllowed = web3.utils.toBN(web3.utils.toWei('1'));
        
      //   const balance1Before = await web3.eth.getBalance(holder1);
      //   const token1balanceBefore = await token.balanceOf(holder1);
        
      //   let tx = await crowdsale.buy({from: holder1, value: amount1});
      //   const amount = '1000000000000000000';
      //   const tokenAmount = '2000000000000000000';
        
      //   expectEvent(tx, 'TokenPurchase', {
      //     purchaser: holder1,
      //     value: amount,
      //     amount: tokenAmount
      //   });
        
      //   const amountR = '2000000000000000000';
      //   expectEvent(tx, 'Imburse', {
      //     imbursePurchaser: holder1,
      //     amount: amountR
      //   });

      //   const balance1After = await web3.eth.getBalance(holder1);
      //   const token1balanceAfter = await token.balanceOf(holder1);
        
      //   gasUsed = await web3.utils.toBN(tx.receipt.gasUsed);
      //   gasSpent = web3.utils.toBN(10* gasPrice * gasUsed);
        
      //   const amount1WithGas = amountAllowed.add(gasSpent);
      //   const balance1 = token1balanceAfter.sub(token1balanceBefore);
      //   const delta = balance1Before - balance1After ;

      //   // Add small margin for mismatch in calculation
      //   assert((delta - amount1WithGas < 5000000) &&  (delta - amount1WithGas > (-5000000) ));
      //   assert(balance1.eq(amountAllowed.mul(web3.utils.toBN(rate))));        
      // });  
      it('should buy and imburse (Sold all crowdsaleSupply)', async () => {
        const amount0 = web3.utils.toBN(web3.utils.toWei('2'));

        let tx = await crowdsale.buy({ from: holder0, value: amount0 });
        const amount = '2000000000000000000';
        const tokenAmount = '4000000000000000000';
        
        expectEvent(tx, 'TokenPurchase', {
          purchaser: holder0,
          value: amount,
          amount: tokenAmount
        });
        
        const amount1 = web3.utils.toBN(web3.utils.toWei('1'));
        const amountAllowed = web3.utils.toBN(web3.utils.toWei('0.5'));
        
        const balance1Before = await web3.eth.getBalance(holder1);
        const token1balanceBefore = await token.balanceOf(holder1);
        
        tx = await crowdsale.buy({from: holder1, value: amount1});
        const amountN = '500000000000000000';
        const tokenAmountN = '1000000000000000000';
        
        expectEvent(tx, 'TokenPurchase', {
          purchaser: holder1,
          value: amountN,
          amount: tokenAmountN
        });
        
        const amountR = '500000000000000000';
        expectEvent(tx, 'Imburse', {
          imbursePurchaser: holder1,
          amount: amountR
        });
        
        const balance1After = await web3.eth.getBalance(holder1);
        const token1balanceAfter = await token.balanceOf(holder1);
        
        gasUsed = await web3.utils.toBN(tx.receipt.gasUsed);
        gasSpent = web3.utils.toBN(10* gasPrice * gasUsed);
        
        const amount1WithGas = amountAllowed.add(gasSpent);
        const balance1 = token1balanceAfter.sub(token1balanceBefore);
        const delta = balance1Before - balance1After ;

        // Add small margin for mismatch in calculation
        assert((delta - amount1WithGas < 5000000) &&  (delta - amount1WithGas > (-5000000) ));
        assert(balance1.eq(amountAllowed.mul(web3.utils.toBN(rate))));
      });  
  
      it('should calculate weiRaised', async () => {
        const amount1 = web3.utils.toBN(web3.utils.toWei('0.2'));      
        await crowdsale.buy({from: holder1, value: amount1});
        
        let weiraised = await crowdsale.weiRaised();
        assert(weiraised.eq(amount1));
        
        await crowdsale.buy({from: holder1, value: amount1});
        weiraised = await crowdsale.weiRaised();
        
        const sumvalue = amount1.add(amount1); 
        assert(weiraised.eq(sumvalue));
      });
    });

    describe("assignTokens", () => {
      it('Should NOT assignTokens if not Admin', async () => {
        const amount1 = web3.utils.toBN(web3.utils.toWei('0.2'));
        await expectRevert(
          crowdsale.assignTokens(holder1, amount1, { from: owner }),
          'unauthorized'
        );
      });
      
      it('Should NOT assignTokens if sale not active', async () => {
        await crowdsale.stopSale(true, { from: adminWallet[0] });

        const amount1 = web3.utils.toBN(web3.utils.toWei('0.2'));
        await expectRevert(
          crowdsale.assignTokens(holder1, amount1, { from: adminWallet[0] }),
          'Sale must be active'
        );
      });

      // it('Should NOT assignTokens if amount > maxPurchase', async () => {
      //   const amount1 = web3.utils.toBN(web3.utils.toWei('2.1'));
      //   await expectRevert(
      //     crowdsale.assignTokens(holder1, amount1, { from: adminWallet[1] }),
      //     'investor already has too many tokens'
      //   );
      // });

      it('Should NOT assignTokens if not enough available', async () => {
        const amount1 = web3.utils.toBN(web3.utils.toWei('1'));
        crowdsale.assignTokens(holder1, amount1, { from: adminWallet[1] });

        const amount2 = web3.utils.toBN(web3.utils.toWei('0.5'));
        crowdsale.assignTokens(holder2, amount2, { from: adminWallet[1] });
       
        const amount0 = web3.utils.toBN(web3.utils.toWei('1.5'));
        await expectRevert(
          crowdsale.assignTokens(holder0, amount0, { from: adminWallet[1] }),
          'amount needs to be smaller than the number of available tokens'
        );
      });


      it('Should assignTokens admin0', async () => {
        const amount1 = web3.utils.toBN(web3.utils.toWei('0.2'));
        const token1balanceBefore = await token.balanceOf(holder1);
        
        let tx =await crowdsale.assignTokens(holder1, amount1, { from: [adminWallet[0]] });
        const amount = '200000000000000000';
        const tokenAmount = '400000000000000000';
        expectEvent(tx, 'TokenPurchase', {
          purchaser: holder1,
          value: amount,
          amount: tokenAmount
        });

        const token1balanceAfter = await token.balanceOf(holder1);
        const balance1 = token1balanceAfter.sub(token1balanceBefore);
        console.log("balance1: " + balance1);
        assert(balance1.eq(amount1.mul(web3.utils.toBN(rate))));
      });
     

    it('Should assignTokens admin1', async () => {
      const amount1 = web3.utils.toBN(web3.utils.toWei('0.2'));
      const token1balanceBefore = await token.balanceOf(holder1);
      
      let tx =await crowdsale.assignTokens(holder1, amount1, { from: [adminWallet[1]] });
      const amount = '200000000000000000';
      const tokenAmount = '400000000000000000';
      expectEvent(tx, 'TokenPurchase', {
        purchaser: holder1,
        value: amount,
        amount: tokenAmount
      });

      const token1balanceAfter = await token.balanceOf(holder1);
      const balance1 = token1balanceAfter.sub(token1balanceBefore);
      console.log("balance1: " + balance1);
      assert(balance1.eq(amount1.mul(web3.utils.toBN(rate))));
    });
  });

    describe("Stop the sale", () => {
      it('Should NOT stop the sale - only Admin', async () => {
        await expectRevert(
          crowdsale.stopSale(true, { from: owner }),
          'unauthorized'
        );
      });

      it('Should stop the sale', async () => {
        await crowdsale.stopSale(true, { from: adminWallet[1] });

        const amount1 = web3.utils.toBN(web3.utils.toWei('0.2'));
        await expectRevert(
           crowdsale.buy({ from: holder1, value: amount1 }),
          'Sale must be active'
        );
      });  
    }); 

    describe("Withdraw", () => {
      it('Should NOT Withdraw Tokens if not admin', async () => {
          const amount1 = web3.utils.toBN(web3.utils.toWei('0.2'));
          await crowdsale.buy({ from: holder1, value: amount1 });
          
          await expectRevert(
            crowdsale.withdrawTokens({ from: holder1 }),
            'Ownable: caller is not the owner'
          );
      });
        
      it('Should NOT Withdraw Funds if not admin', async () => {
          const amount1 = web3.utils.toBN(web3.utils.toWei('0.2'));
          await crowdsale.buy({ from: holder1, value: amount1 });
          
          await expectRevert(
            crowdsale.withdrawFunds({ from: holder1 }),
            'Ownable: caller is not the owner'
          );
      });
      
      it('Should NOT Withdraw Funds before sale is done', async () => {
        const amount1 = web3.utils.toBN(web3.utils.toWei('0.2'));
        await crowdsale.buy({ from: holder1, value: amount1 });
        
        await expectRevert(
          crowdsale.withdrawFunds({ from: owner }),
          'Sale has NOT ended'
        );
      });

      it('Should NOT Withdraw Tokens before sale is done', async () => {
        const amount1 = web3.utils.toBN(web3.utils.toWei('0.2'));
        await crowdsale.buy({ from: holder1, value: amount1 });
        
        await expectRevert(
          crowdsale.withdrawTokens({ from: owner }),
          'Sale has NOT ended'
        );
    });

    it('Should Withdraw All', async () => {
      const amount1 = web3.utils.toBN(web3.utils.toWei('1'));
      await crowdsale.buy({ from: holder1, value: amount1 });
      
      const end = await crowdsale.end();
      await time.increaseTo(end);  
      
      const TokenbalanceOutBefore = await token.balanceOf(mainFrameAddress);
      await crowdsale.withdrawTokens({ from: owner });
      const TokenbalanceOutAfter = await token.balanceOf(mainFrameAddress);
      
      console.log(" Tokens witdhrawn to mainFrameAddress: " + TokenbalanceOutAfter);
      const balance1 = TokenbalanceOutAfter -TokenbalanceOutBefore;
      const balExpected = totalSupply - (amount1 * rate);
      assert(balance1 == balExpected);

      const balanceweiOutBefore = await web3.eth.getBalance(mainFrameAddress);
      await crowdsale.withdrawFunds({ from: owner });
      const balanceweiOutAfter = await web3.eth.getBalance(mainFrameAddress);
      assert(balanceweiOutAfter-balanceweiOutBefore == amount1);
    });
  });
 }); 
});

