const utils = require('../../utils');

/**
 * Build pool data structure from various data sources
 */
function buildPoolData(index, auraData, balancerData) {
  return {
    auraPoolIndex: index,
    lptoken: auraData.lptoken,
    gauge: auraData.gauge,
    crvRewards: auraData.crvRewards,
    stash: auraData.stash,
    shutdown: auraData.shutdown,
    balancerPoolId: null,
    balancerPoolData: balancerData || null,
    symbol: null,
    tvlUsd: 0,
    underlyingTokens: [],
    rewardData: null,
    aprData: null
  };
}

/**
 * Transform subgraph reward data to match expected format
 */
function transformSubgraphRewards(rewardData) {
  if (!rewardData || rewardData.length === 0) {
    return null;
  }

  // Find BAL as the main reward
  const balReward = rewardData.find(r =>
    r.symbol === 'BAL' ||
    r.token?.toLowerCase() === '0xba100000625a3754423978a60c9317c58a424e3d'
  );

  const extraRewards = rewardData.filter(r => r !== balReward);

  return {
    rewardRate: balReward?.rewardRate || '0',
    periodFinish: balReward?.periodFinish || '0',
    queuedRewards: balReward?.queuedRewards || '0',
    rewardToken: balReward?.token || null,
    rewardTokenDecimals: balReward?.decimals || 18,
    extraRewardsLength: extraRewards.length,
    extraRewards: extraRewards.map(r => ({
      rewardRate: r.rewardRate || '0',
      periodFinish: r.periodFinish || '0',
      queuedRewards: r.queuedRewards || '0',
      rewardToken: r.token || null,
      decimals: r.decimals || 18,
    })),
  };
}

/**
 * Extract underlying tokens from Balancer pool data
 */
function extractUnderlyingTokens(balancerPoolData) {
  if (!balancerPoolData?.poolTokens) {
    return [];
  }

  const tokens = [];
  balancerPoolData.poolTokens.forEach(poolToken => {
    tokens.push(poolToken.address);

    if (poolToken.underlyingToken && poolToken.useUnderlyingForAddRemove) {
      tokens.push(poolToken.underlyingToken.address);
    }
  });

  return tokens;
}

/**
 * Format pool for final output
 */
function formatPoolOutput(poolData, chainName, chainId) {
  return {
    pool: `${chainName}-${poolData.auraPoolIndex}`,
    chain: utils.formatChain(chainName),
    project: 'aura',
    symbol: utils.formatSymbol(poolData.symbol),
    tvlUsd: poolData.tvlUsd ?? 0,
    apyBase: poolData.aprData?.apyBase ?? null,
    apyReward: poolData.aprData?.apyReward ?? null,
    rewardTokens: poolData.aprData?.rewardTokens ?? [],
    underlyingTokens: poolData.underlyingTokens || [],
    poolMeta: null,
    url: `https://app.aura.finance/#/${chainId}/pool/${poolData.auraPoolIndex}`,
  };
}

module.exports = {
  buildPoolData,
  transformSubgraphRewards,
  extractUnderlyingTokens,
  formatPoolOutput,
};