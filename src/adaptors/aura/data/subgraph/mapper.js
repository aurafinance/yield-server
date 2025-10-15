/**
 * Map subgraph pool data to Aura pool indices
 */
function mapSubgraphDataToPools(subgraphData, poolsData) {
  if (!subgraphData || !subgraphData.pools) {
    return {};
  }

  const mappedData = {};

  // Create lpToken to pool index mapping
  const lpTokenToIndex = {};
  Object.entries(poolsData).forEach(([index, pool]) => {
    if (pool.lptoken) {
      lpTokenToIndex[pool.lptoken.toLowerCase()] = index;
    }
  });

  subgraphData.pools.forEach(subgraphPool => {
    const poolId = subgraphPool.id;
    const lpToken = subgraphPool.lpToken?.id?.toLowerCase();

    // Find matching Aura pool
    let auraPoolIndex = null;
    if (poolsData[poolId]) {
      auraPoolIndex = poolId;
    } else if (lpToken && lpTokenToIndex[lpToken] && !mappedData[lpTokenToIndex[lpToken]]) {
      auraPoolIndex = lpTokenToIndex[lpToken];
    }

    if (auraPoolIndex && poolsData[auraPoolIndex]) {
      mappedData[auraPoolIndex] = {
        balancerPoolId: subgraphPool.factoryPoolData?.balancerPoolId,
        totalStaked: subgraphPool.totalStaked,
        rewardData: mapRewardData(subgraphPool.rewardData),
        extraRewards: mapExtraRewards(subgraphPool.extraRewards),
      };
    }
  });

  return mappedData;
}

function mapRewardData(rewardData) {
  if (!rewardData || rewardData.length === 0) {
    return [];
  }

  return rewardData.map(reward => ({
    token: reward.token?.id,
    decimals: reward.token?.decimals || 18,
    symbol: reward.token?.symbol,
    rewardRate: reward.rewardRate,
    periodFinish: reward.periodFinish,
    queuedRewards: reward.queuedRewards,
    lastUpdateTime: reward.lastUpdateTime,
  }));
}

function mapExtraRewards(extraRewards) {
  if (!extraRewards || extraRewards.length === 0) {
    return [];
  }

  return extraRewards.map(extra => ({
    token: extra.token?.id,
    decimals: extra.token?.decimals || 18,
    symbol: extra.token?.symbol,
    funded: extra.funded || [],
  }));
}

module.exports = {
  mapSubgraphDataToPools,
};