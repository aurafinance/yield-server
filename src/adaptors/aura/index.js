const { CHAIN_CONFIG } = require('./config');
const { queryAuraGlobals } = require('./data/subgraph/globals');
const { processChain } = require('./core/chain-processor');

async function poolsFunction() {
  const allPools = [];

  // Fetch globals once from mainnet
  const auraGlobals = await queryAuraGlobals();
  if (!auraGlobals) {
    console.error('Failed to fetch Aura globals');
  }

  // Process each chain
  for (const [chainName, chainConfig] of Object.entries(CHAIN_CONFIG)) {
    if (!chainConfig.booster) continue; // Skip chains without booster

    const chainPools = await processChain(chainName, chainConfig, auraGlobals);
    allPools.push(...chainPools);
  }

  return allPools;
}

module.exports = {
  timetravel: false,
  apy: poolsFunction,
  url: 'https://app.aura.finance/',
};