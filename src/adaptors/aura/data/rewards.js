const {
  fetchAllRewardData,
  getExtraRewardsLength,
  getExtraRewardContracts
} = require('./rpc/base-reward-pool');

/**
 * Get reward data for Aura pools
 */
async function getRewardData(pools, chainName) {
  if (!pools || pools.length === 0) {
    return {};
  }

  const rewardContracts = pools.map(pool => pool.crvRewards);

  // Fetch main reward data in parallel
  const { rates, finishes, queued, tokens } = await fetchAllRewardData(rewardContracts, chainName);

  // Build reward data object
  const rewardData = {};
  pools.forEach((pool, index) => {
    rewardData[pool.poolIndex] = {
      rewardRate: rates[index]?.output || '0',
      periodFinish: finishes[index]?.output || '0',
      queuedRewards: queued[index]?.output || '0',
      rewardToken: tokens[index]?.output || null,
      rewardTokenDecimals: 18, // Default, should be fetched if needed
      extraRewardsLength: 0,
      extraRewards: [],
    };
  });

  // Fetch extra rewards
  await enrichWithExtraRewards(pools, rewardData, chainName);

  return rewardData;
}

async function enrichWithExtraRewards(pools, rewardData, chainName) {
  // Get extra rewards length for all pools
  const rewardContracts = pools.map(pool => pool.crvRewards);
  const extraLengthResults = await getExtraRewardsLength(rewardContracts, chainName);

  // Build calls for fetching extra reward contracts
  const extraRewardCalls = [];
  pools.forEach((pool, poolIdx) => {
    const extraLength = parseInt(extraLengthResults[poolIdx]?.output || 0);
    rewardData[pool.poolIndex].extraRewardsLength = extraLength;

    for (let i = 0; i < extraLength; i++) {
      extraRewardCalls.push({
        target: pool.crvRewards,
        params: [i],
        poolIndex: pool.poolIndex,
        extraIndex: i,
      });
    }
  });

  if (extraRewardCalls.length === 0) return;

  // Fetch all extra reward contract addresses
  const extraContracts = await getExtraRewardContracts(
    extraRewardCalls.map(({ target, params }) => ({ target, params })),
    chainName
  );

  // Group extra contracts by pool
  const extraContractsByPool = {};
  extraRewardCalls.forEach((call, idx) => {
    const contract = extraContracts[idx]?.output;
    if (contract) {
      if (!extraContractsByPool[call.poolIndex]) {
        extraContractsByPool[call.poolIndex] = [];
      }
      extraContractsByPool[call.poolIndex].push(contract);
    }
  });

  // Fetch data for all extra reward contracts
  const allExtraContracts = Object.values(extraContractsByPool).flat();
  if (allExtraContracts.length > 0) {
    const extraData = await fetchAllRewardData(allExtraContracts, chainName);

    // Map extra reward data back to pools
    let contractIndex = 0;
    Object.entries(extraContractsByPool).forEach(([poolIndex, contracts]) => {
      const extraRewards = [];
      contracts.forEach(() => {
        extraRewards.push({
          rewardRate: extraData.rates[contractIndex]?.output || '0',
          periodFinish: extraData.finishes[contractIndex]?.output || '0',
          queuedRewards: extraData.queued[contractIndex]?.output || '0',
          rewardToken: extraData.tokens[contractIndex]?.output || null,
          decimals: 18, // Default, should be fetched if needed
        });
        contractIndex++;
      });
      rewardData[poolIndex].extraRewards = extraRewards;
    });
  }
}

module.exports = {
  getRewardData,
};