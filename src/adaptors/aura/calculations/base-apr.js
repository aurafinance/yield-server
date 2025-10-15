/**
 * Calculate base APR from Balancer pool data
 * Includes swap fees and token yields, excludes VEBAL emissions
 */
function calculateBaseApr(balancerPool) {
  let baseApr = 0;
  const stakingRewards = [];

  if (!balancerPool?.dynamicData?.aprItems) {
    return { baseApr, stakingRewards };
  }

  balancerPool.dynamicData.aprItems.forEach(item => {
    const aprValue = (item.apr * 100) || 0;

    switch (item.type) {
      case 'SWAP_FEE':
      case 'SWAP_FEE_24H':
        baseApr += aprValue;
        break;

      case 'IB_YIELD':
        // Token yields like rETH, rsETH
        baseApr += aprValue;
        break;

      case 'VEBAL_EMISSIONS':
        // Skip - Aura captures this through BAL rewards
        break;

      case 'STAKING':
      case 'STAKING_BOOST':
        // Balancer's own staking incentives
        if (item.rewardTokenAddress && item.rewardTokenSymbol) {
          stakingRewards.push({
            apr: aprValue,
            tokenAddress: item.rewardTokenAddress.toLowerCase(),
            tokenSymbol: item.rewardTokenSymbol
          });
        }
        break;
    }
  });

  return { baseApr, stakingRewards };
}

module.exports = {
  calculateBaseApr,
};