const { COMMON_CONFIG } = require('../constants');

/**
 * Calculate APR from reward rate
 */
function calculateRewardApr(rewardRate, tokenPrice, tvl, decimals = 18) {
  if (!rewardRate || !tokenPrice || !tvl || tvl === 0) {
    return 0;
  }

  const rewardPerYear = BigInt(rewardRate) * BigInt(COMMON_CONFIG.SECONDS_PER_YEAR);
  const divisor = BigInt(10) ** BigInt(decimals);
  const rewardPerYearFloat = Number(rewardPerYear) / Number(divisor);
  const rewardValuePerYear = rewardPerYearFloat * tokenPrice;

  return (rewardValuePerYear / tvl) * 100;
}

/**
 * Check if rewards are currently active
 */
function isRewardActive(periodFinish, queuedRewards) {
  const now = Math.floor(Date.now() / 1000);
  let finish = parseInt(periodFinish || '0');

  // Queued rewards extend the period by 7 days
  if (queuedRewards && BigInt(queuedRewards) > 0n) {
    finish = finish + COMMON_CONFIG.QUEUED_REWARDS_EXTENSION;
  }

  return finish > now;
}

/**
 * Process extra rewards from a pool
 */
function processExtraRewards(extraRewards, tokenPrices, tvl) {
  let totalApr = 0;
  const rewardTokens = [];

  if (!extraRewards || extraRewards.length === 0) {
    return { totalApr, rewardTokens };
  }

  for (const extra of extraRewards) {
    if (!isRewardActive(extra.periodFinish, extra.queuedRewards)) {
      continue;
    }

    const tokenAddress = extra.rewardToken?.toLowerCase();
    const tokenPrice = tokenPrices[tokenAddress] || 0;

    if (tokenPrice > 0) {
      const decimals = extra.decimals || 18;
      const apr = calculateRewardApr(extra.rewardRate, tokenPrice, tvl, decimals);

      if (apr > 0) {
        totalApr += apr;
        rewardTokens.push(tokenAddress);
      }
    }
  }

  return { totalApr, rewardTokens };
}

module.exports = {
  calculateRewardApr,
  isRewardActive,
  processExtraRewards,
};