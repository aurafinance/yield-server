const utils = require('../../utils');
const { getTotalSupplies } = require('./rpc/erc20');

/**
 * Calculate TVL for Aura pools
 * @param {Array} pools - Array of pool information
 * @param {string} chainName - Name of the chain
 * @returns {Promise<Object>} - Map of pool index to TVL
 */
async function getPoolTvls(pools, chainName) {
  if (!pools || pools.length === 0) {
    return {};
  }

  try {
    // Get the amount of the LP token within the pool
    const tokenAddresses = pools.map(pool => pool.token);
    const totalSupplyResults = await getTotalSupplies(tokenAddresses, chainName);
    const totalSupplies = totalSupplyResults.map(({ output }) => output ?? 0);

    // Get LP token addresses for price fetching
    const lpTokenKeys = pools
      .map((pool) => `${chainName}:${pool.lptoken}`)
      .join(',')
      .toLowerCase();

    // Get the LP token prices
    const tokenPrices = (
      await utils.getData(
        `https://coins.llama.fi/prices/current/${lpTokenKeys}`
      )
    ).coins;

    // Calculate TVL for each pool
    const poolTvls = {};
    pools.forEach((pool, index) => {
      const priceKey = `${chainName}:${pool.lptoken.toLowerCase()}`;
      const price = tokenPrices[priceKey]?.price;
      const totalSupply = totalSupplies[index];

      if (price && totalSupply) {
        poolTvls[pool.poolIndex] = (totalSupply / 1e18) * price;
      } else {
        poolTvls[pool.poolIndex] = 0;
      }
    });

    return poolTvls;
  } catch (error) {
    return {};
  }
}

module.exports = {
  getPoolTvls,
};
