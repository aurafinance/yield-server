const sdk = require('@defillama/sdk');
const baseRewardPoolABI = require('../../abis/baseRewardPool.json');

/**
 * Get reward rates for multiple pools
 */
async function getRewardRates(rewardContracts, chain) {
  const result = await sdk.api.abi.multiCall({
    abi: baseRewardPoolABI.find(({ name }) => name === 'rewardRate'),
    calls: rewardContracts.map(contract => ({ target: contract })),
    chain,
    permitFailure: true,
  });
  return result.output;
}

/**
 * Get period finishes for multiple pools
 */
async function getPeriodFinishes(rewardContracts, chain) {
  const result = await sdk.api.abi.multiCall({
    abi: baseRewardPoolABI.find(({ name }) => name === 'periodFinish'),
    calls: rewardContracts.map(contract => ({ target: contract })),
    chain,
    permitFailure: true,
  });
  return result.output;
}

/**
 * Get queued rewards for multiple pools
 */
async function getQueuedRewards(rewardContracts, chain) {
  const result = await sdk.api.abi.multiCall({
    abi: baseRewardPoolABI.find(({ name }) => name === 'queuedRewards'),
    calls: rewardContracts.map(contract => ({ target: contract })),
    chain,
    permitFailure: true,
  });
  return result.output;
}

/**
 * Get reward tokens for multiple pools
 */
async function getRewardTokens(rewardContracts, chain) {
  const result = await sdk.api.abi.multiCall({
    abi: baseRewardPoolABI.find(({ name }) => name === 'rewardToken'),
    calls: rewardContracts.map(contract => ({ target: contract })),
    chain,
    permitFailure: true,
  });
  return result.output;
}

/**
 * Get extra rewards length for multiple pools
 */
async function getExtraRewardsLength(rewardContracts, chain) {
  const result = await sdk.api.abi.multiCall({
    abi: baseRewardPoolABI.find(({ name }) => name === 'extraRewardsLength'),
    calls: rewardContracts.map(contract => ({ target: contract })),
    chain,
    permitFailure: true,
  });
  return result.output;
}

/**
 * Get extra reward contracts at specific indices
 */
async function getExtraRewardContracts(calls, chain) {
  const result = await sdk.api.abi.multiCall({
    abi: baseRewardPoolABI.find(({ name }) => name === 'extraRewards'),
    calls,
    chain,
    permitFailure: true,
  });
  return result.output;
}

/**
 * Fetch all reward data for pools in parallel
 */
async function fetchAllRewardData(rewardContracts, chain) {
  const [rates, finishes, queued, tokens] = await Promise.all([
    getRewardRates(rewardContracts, chain),
    getPeriodFinishes(rewardContracts, chain),
    getQueuedRewards(rewardContracts, chain),
    getRewardTokens(rewardContracts, chain),
  ]);

  return {
    rates,
    finishes,
    queued,
    tokens,
  };
}

module.exports = {
  getRewardRates,
  getPeriodFinishes,
  getQueuedRewards,
  getRewardTokens,
  getExtraRewardsLength,
  getExtraRewardContracts,
  fetchAllRewardData,
};