const { CHAIN_CONFIG } = require('../config');
const { COMMON_CONFIG } = require('../constants');
const { calculateAuraMintAmount } = require('../calculations/aura-mint');
const { calculateBaseApr } = require('../calculations/base-apr');
const { calculateRewardApr, isRewardActive, processExtraRewards } = require('../calculations/reward-apr');
const { fetchTokenPrices } = require('../utils/token-prices');

/**
 * Calculate APRs for Aura pools
 */
async function calculateAprs(poolsData, chainName, auraGlobals) {
  const aprData = {};

  // Collect all token addresses needed for pricing
  const tokenAddresses = collectTokenAddresses(poolsData, chainName);

  // Fetch all token prices at once
  const tokenPrices = await fetchTokenPrices(tokenAddresses, chainName);

  // Calculate APR for each pool
  for (const [poolIndex, poolData] of Object.entries(poolsData)) {
    aprData[poolIndex] = calculatePoolApr(
      poolData,
      tokenPrices,
      chainName,
      auraGlobals
    );
  }

  return aprData;
}

/**
 * Collect all token addresses that need pricing
 */
function collectTokenAddresses(poolsData, chainName) {
  const tokenAddresses = new Set();

  // Add AURA and BAL for the chain
  tokenAddresses.add(CHAIN_CONFIG[chainName]?.tokens?.AURA);
  tokenAddresses.add(CHAIN_CONFIG[chainName]?.tokens?.BAL);

  Object.values(poolsData).forEach(pool => {
    // Add reward tokens
    const rewardData = pool.rewardData;
    if (rewardData) {
      if (rewardData.rewardToken) {
        tokenAddresses.add(rewardData.rewardToken);
      }
      rewardData.extraRewards?.forEach(extra => {
        if (extra.rewardToken) {
          tokenAddresses.add(extra.rewardToken);
        }
      });
    }

    // Add underlying tokens
    pool.underlyingTokens?.forEach(token => {
      if (token) tokenAddresses.add(token);
    });
  });

  return tokenAddresses;
}

/**
 * Calculate APR for a single pool
 */
function calculatePoolApr(poolData, tokenPrices, chainName, auraGlobals) {
  const poolRewards = poolData.rewardData;
  const tvl = poolData.tvlUsd || 0;

  if (!poolRewards || tvl === 0) {
    return {
      apyBase: 0,
      apyReward: 0,
      rewardTokens: [],
    };
  }

  // Calculate base APR from Balancer pool data
  const { baseApr, stakingRewards } = calculateBaseApr(poolData.balancerPoolData);

  // Calculate reward APRs
  let rewardApr = 0;
  const rewardTokens = [];

  // Process main reward (usually BAL)
  if (isRewardActive(poolRewards.periodFinish, poolRewards.queuedRewards)) {
    const mainReward = processMainReward(
      poolRewards,
      tokenPrices,
      tvl,
      chainName,
      auraGlobals
    );
    rewardApr += mainReward.apr;
    rewardTokens.push(...mainReward.tokens);
  }

  // Process extra rewards
  const extraRewardsResult = processExtraRewards(
    poolRewards.extraRewards,
    tokenPrices,
    tvl
  );
  rewardApr += extraRewardsResult.totalApr;
  rewardTokens.push(...extraRewardsResult.rewardTokens);

  // Add Balancer staking rewards
  stakingRewards.forEach(reward => {
    rewardApr += reward.apr;
    rewardTokens.push(reward.tokenAddress);
  });

  return {
    apyBase: baseApr,
    apyReward: rewardApr,
    rewardTokens: [...new Set(rewardTokens)], // Remove duplicates
  };
}

/**
 * Process the main reward (typically BAL)
 */
function processMainReward(poolRewards, tokenPrices, tvl, chainName, auraGlobals) {
  const rewardToken = poolRewards.rewardToken?.toLowerCase();
  const tokenPrice = tokenPrices[rewardToken] || 0;
  const tokens = [];
  let apr = 0;

  if (tokenPrice > 0) {
    const decimals = poolRewards.rewardTokenDecimals || 18;
    apr = calculateRewardApr(poolRewards.rewardRate, tokenPrice, tvl, decimals);

    if (apr > 0) {
      tokens.push(rewardToken);
    }

    // Check if this is BAL and calculate AURA minting
    const isBAL = rewardToken === CHAIN_CONFIG[chainName]?.tokens?.BAL?.toLowerCase();
    if (isBAL) {
      const auraApr = calculateAuraMintApr(
        poolRewards.rewardRate,
        tokenPrices,
        tvl,
        chainName,
        auraGlobals
      );
      apr += auraApr.apr;
      if (auraApr.token) {
        tokens.push(auraApr.token);
      }
    }
  }

  return { apr, tokens };
}

/**
 * Calculate APR from AURA minting
 */
function calculateAuraMintApr(balRewardRate, tokenPrices, tvl, chainName, auraGlobals) {
  const balPerYear = BigInt(balRewardRate) * BigInt(COMMON_CONFIG.SECONDS_PER_YEAR);
  const mintedAuraPerYear = calculateAuraMintAmount(balPerYear.toString(), auraGlobals);
  const auraToken = CHAIN_CONFIG[chainName]?.tokens?.AURA?.toLowerCase();
  const auraPrice = tokenPrices[auraToken] || 0;

  if (auraPrice > 0 && BigInt(mintedAuraPerYear) > 0n) {
    const apr = (Number(mintedAuraPerYear) / 1e18 * auraPrice / tvl) * 100;
    return {
      apr,
      token: apr > 0 ? auraToken : null
    };
  }

  return { apr: 0, token: null };
}

module.exports = {
  calculateAprs,
};