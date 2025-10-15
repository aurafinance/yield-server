const axios = require('axios');
const { CHAIN_CONFIG } = require('../../config');

/**
 * Query Aura subgraph for pool rewards data
 */
async function queryAuraPoolRewards(chainName) {
  const chainConfig = CHAIN_CONFIG[chainName];
  if (!chainConfig || !chainConfig.subgraph) {
    console.error(`No subgraph URL for chain: ${chainName}`);
    return null;
  }

  const query = `
    query Dynamics {
      pools(first: 1000, skip: 0) {
        id
        extraRewards {
          funded {
            epoch
            amount
          }
          token {
            id
            decimals
            symbol
          }
        }
        factoryPoolData {
          balancerPoolId
        }
        lpToken {
          id
        }
        rewardData {
          token {
            id
            decimals
            symbol
          }
          lastUpdateTime
          periodFinish
          queuedRewards
          rewardPerTokenStored
          rewardRate
        }
        totalStaked
      }
    }
  `;

  try {
    const response = await axios.post(chainConfig.subgraph, { query });

    if (response.data.errors) {
      console.error('Subgraph query errors:', response.data.errors);
      return null;
    }

    return response.data.data;
  } catch (error) {
    console.error(`Error querying Aura subgraph for ${chainName}:`, error.message);
    return null;
  }
}

module.exports = {
  queryAuraPoolRewards,
};