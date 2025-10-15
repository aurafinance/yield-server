const axios = require('axios');
const { CHAIN_CONFIG } = require('../../config');

let globalsCache = null;

/**
 * Query Aura mainnet subgraph for globals
 */
async function queryAuraGlobals() {
  if (globalsCache) {
    return globalsCache;
  }

  const url = CHAIN_CONFIG.ethereum.subgraph;

  const query = `
    query {
      global(id: "global") {
        id
        aura
        auraTotalSupply
        auraMaxSupply
        auraReductionPerCliff
        auraTotalCliffs
      }
    }
  `;

  try {
    const response = await axios.post(url, { query });

    if (response.data.errors) {
      console.error('Globals query errors:', response.data.errors);
      return null;
    }

    globalsCache = response.data.data.global;
    return globalsCache;
  } catch (error) {
    console.error('Error fetching Aura globals:', error.message);
    return null;
  }
}

module.exports = {
  queryAuraGlobals,
};