const randomstring = require('randomstring');

function createHashCode(length, prefix){

  let hash = randomstring.generate(length - prefix.length);

  hash = prefix + hash;

  console.log('hash -> ' + hash);

  return hash;
};

module.exports = {

  createWalletAddressHash: () => {

    let walletAddress = createHashCode(64, '0x')

    return walletAddress;
  },
  createTransactionAddressHash: () => {

    let transactionAddress = createHashCode(256, 'tx')

    return transactionAddress;
  },
  createImageUrlHash: () => {

    let hash = '_' + createHashCode(10, 'im')

    return hash;
  },
  shopIdHash: () => {

    let hash = '_' + createHashCode(45, 'sp')

    return hash;
  }
};
