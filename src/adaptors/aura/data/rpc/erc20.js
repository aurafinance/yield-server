const sdk = require('@defillama/sdk');

/**
 * Get symbols for multiple ERC20 tokens
 */
async function getSymbols(tokenAddresses, chain) {
  const result = await sdk.api.abi.multiCall({
    abi: 'erc20:symbol',
    calls: tokenAddresses.map(address => ({ target: address })),
    chain,
    permitFailure: true,
  });
  return result.output;
}

/**
 * Get total supplies for multiple ERC20 tokens
 */
async function getTotalSupplies(tokenAddresses, chain) {
  const result = await sdk.api.abi.multiCall({
    abi: 'erc20:totalSupply',
    calls: tokenAddresses.map(address => ({ target: address })),
    chain,
    permitFailure: true,
  });
  return result.output;
}

/**
 * Get balances for multiple ERC20 tokens at specific addresses
 */
async function getBalances(tokenAddresses, holderAddresses, chain) {
  const result = await sdk.api.abi.multiCall({
    abi: 'erc20:balanceOf',
    calls: tokenAddresses.map((token, i) => ({
      target: token,
      params: [holderAddresses[i] || holderAddresses[0]], // Support single holder or array
    })),
    chain,
    permitFailure: true,
  });
  return result.output;
}

module.exports = {
  getSymbols,
  getTotalSupplies,
  getBalances,
};