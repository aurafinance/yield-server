const axios = require('axios');
const { BALANCER_API } = require('../../constants');

/**
 * Fetch pool data from Balancer V3 API
 */
async function fetchBalancerPoolsData(poolIdentifiers, chainName) {
  try {
    const chain = BALANCER_API.chainMapping[chainName];
    if (!chain) {
      console.error(`No chain mapping for: ${chainName}`);
      return {};
    }

    const query = `
      query Pools($chains: [GqlChain!]!, $ids: [String!] ) {
        poolGetPools(
          where: { chainIn: $chains, idIn: $ids }
          first: 1000
        ) {
          id
          address
          poolTokens {
            address
            symbol
            decimals
            underlyingToken {
              address
              decimals
              name
              symbol
            }
            useUnderlyingForAddRemove
          }
          dynamicData {
            aprItems {
              id
              apr
              type
            }
            swapFee
            volume24h
            fees24h
          }
        }
      }
    `;

    const data = await axios
      .post(BALANCER_API.endpoint, {
        query,
        variables: {
          chains: [chain],
          ids: poolIdentifiers,
        },
      })
      .then((res) => res.data.data.poolGetPools);

    // Convert array to map for easier lookup
    const poolsMap = {};
    data.forEach(pool => {
      // Key by both id and address (lowercase) for V2/V3 compatibility
      if (pool.id) {
        poolsMap[pool.id.toLowerCase()] = pool;
      }
      if (pool.address) {
        poolsMap[pool.address.toLowerCase()] = pool;
      }
    });

    return poolsMap;
  } catch (error) {
    console.error(`Error fetching Balancer pool data:`, error.message);
    return {};
  }
}

module.exports = {
  fetchBalancerPoolsData,
};