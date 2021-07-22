const VMainToken = artifacts.require("VMainToken");
const CrowdSale = artifacts.require("CrowdSale");

//Mainnet
const MainFrameAddr = '0xC7A1637b37190a456b017897207bceb2A29f19b9';
const VMainAdmin = '0x04cb2eF013F866E9915016E44FE36218361C1F5a'; 

const Admins = [
    '0x8Eda3d549239D239c99d0daE672231A0B7e29458',
    '0x4193cF8c80a0A30218024670A1948A4558252940',
    '0x88E586b784B74f833E9bd605023474A39220fFd7',
    '0x5205501b988dd9b0b13b3Fa32Fa8c7dFf133A936',
    '0xcDf902Ba1919d275fD084D84CaaC276e890Fb2C6'];
    
//Testnet
/*const MainFrameAddr = '0xE8276A1680CB970c2334B3201044Ddf7c492F52A';
const VMainAdmin = '0x0E9fb5B82bD46320d811104542EEE4209536978a'; 

const NFTs = [
    '0x78c0D49d003bf0A88EA6dF729B7a2AD133B9Ae25',
    '0x420fECFda0975c49Fd0026f076B302064ED9C6Ff',
    '0xC5452Dbb2E3956C1161cB9C2d6DB53C2b60E7805'];
const Admins = [
    '0xE8276A1680CB970c2334B3201044Ddf7c492F52A',
    '0x764330A5A9e4018FcDb4A99266EdCDb274fc26d4',
    '0x1A548749f49eA840Dc4fb8986E9930e396567a44',
    '0xe1110C9595444f0Bc6cB2f8Ef214ECc97E5e15FE',
    '0x125253925D7Ed9fC6AF5936265D9aE6f10568500',
    '0x63276e0E82BF1C5a7642EF6144e00cD285023d2b'];
*/

module.exports = async function (deployer) {
      VMainTokenInstance = await deployToken(deployer);
      crowdsale = await deployCrowdsale(deployer, VMainTokenInstance.address);
    //  mainnet
    // VMainAddress = '0x0106F2fFBF6A4f5DEcE323d20E16E2037E732790';
    crowdsale = await deployCrowdsale(deployer, VMainAddress);
    
    await crowdsale.addAdmins(Admins);
    console.log("CrowdSale TFUEL Wallets admins set")
    
    await crowdsale.transferOwnership(VMainAdmin);
    console.log("crowdSale owner has changed to " + VMainAdmin);
    
   // await VMainTokenInstance.setSaleAdmin(crowdsale.address);
   // console.log(
   //     "Token Balance of crowdsale smart contract: " +
   //      await VMainTokenInstance.balanceOf(crowdsale.address));
   // crowdsale.start(86400*3, 50000, web3.utils.toWei('0.001', 'ether'), web3.utils.toWei('2000000', 'ether'));
}


async function deployToken(deployer){
    const totaltoken = web3.utils.toWei('5000000');
    await deployer.deploy(VMainToken, totaltoken, VMainAdmin);
    let VMainTokenInstance = await VMainToken.deployed();
    VMainAddress = await VMainTokenInstance.address;
    console.log("VMainAddress address: " + VMainAddress);
    return VMainTokenInstance;
}

async function deployCrowdsale(deployer, VMainAddress){
    console.log(VMainAddress + "   " + MainFrameAddr)
    await deployer.deploy(CrowdSale,VMainAddress,MainFrameAddr);
    let crowdsale = await CrowdSale.deployed();
    let crowdAddr = await crowdsale.address;
    console.log("CrowdSale address: " + crowdAddr);
    return crowdsale;
}