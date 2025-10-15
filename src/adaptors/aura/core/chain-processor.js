const sdk = require('@defillama/sdk');
const { ethers } = require('ethers');
const { getPoolCount, fetchPoolInfo } = require('../data/rpc/booster');
const { getSymbols } = require('../data/rpc/erc20');
const { getPoolIds } = require('../data/rpc/balancer-pool');
const { getPoolTvls } = require('../data/tvl');
const { getRewardData } = require('../data/rewards');
const { calculateAprs } = require('../data/apr');
const {
  queryAuraPoolRewards,
  mapSubgraphDataToPools,
  fetchBalancerPoolsData
} = require('../data/subgraph/index');
const {
  buildPoolData,
  transformSubgraphRewards,
  extractUnderlyingTokens,
  formatPoolOutput
} = require('./pool-builder');

/**
 * Process pools for a single chain
 */
async function processChain(chainName, chainConfig, auraGlobals) {
  const pools = [];

  try {
    setupRpcProvider(chainName, chainConfig);

    const activePools = await fetchActivePools(chainName, chainConfig);
    if (activePools.length === 0) return pools;

    const poolsData = initializePoolsData(activePools);

    await enrichPoolsWithSymbols(poolsData, activePools, chainName);
    await enrichPoolsWithTvl(poolsData, activePools, chainName);
    await enrichPoolsWithBalancerData(poolsData, activePools, chainName);

    extractPoolUnderlyingTokens(poolsData);

    await enrichPoolsWithRewards(poolsData, activePools, chainName);
    await enrichPoolsWithAprs(poolsData, chainName, auraGlobals);

    // Format pools for output
    Object.values(poolsData).forEach(poolData => {
      pools.push(formatPoolOutput(poolData, chainName, chainConfig.chainId));
    });

  } catch (error) {
    console.error(`Error processing ${chainName}:`, error);
  }

  return pools;
}

function setupRpcProvider(chainName, chainConfig) {
  if (chainConfig.rpcEndpoint) {
    sdk.api.config.setProvider(
      chainName,
      new ethers.providers.JsonRpcProvider(chainConfig.rpcEndpoint)
    );
  }
}

async function fetchActivePools(chainName, chainConfig) {
  const poolLength = await getPoolCount(chainConfig.booster, chainName);
  const allPoolsRaw = await fetchPoolInfo(chainConfig.booster, poolLength, chainName);

  const activePools = [];
  allPoolsRaw.forEach(({ output }, index) => {
    if (output && !output.shutdown) {
      output.poolIndex = index;
      activePools.push(output);
    }
  });

  return activePools;
}

function initializePoolsData(activePools) {
  const poolsData = {};
  activePools.forEach(pool => {
    poolsData[pool.poolIndex] = buildPoolData(pool.poolIndex, pool);
  });
  return poolsData;
}

async function enrichPoolsWithSymbols(poolsData, activePools, chainName) {
  const lpTokens = activePools.map(pool => pool.lptoken);
  const symbolResults = await getSymbols(lpTokens, chainName);

  symbolResults.forEach(({ output }, idx) => {
    const poolIndex = activePools[idx].poolIndex;
    poolsData[poolIndex].symbol = output ?? 'Unknown';
  });
}

async function enrichPoolsWithTvl(poolsData, activePools, chainName) {
  const poolTvls = await getPoolTvls(activePools, chainName);
  Object.entries(poolTvls).forEach(([poolIndex, tvl]) => {
    if (poolsData[poolIndex]) {
      poolsData[poolIndex].tvlUsd = tvl;
    }
  });
}

async function enrichPoolsWithBalancerData(poolsData, activePools, chainName) {
  const poolIdentifiers = await getPoolIdentifiers(activePools, chainName);
  const balancerPoolsData = await fetchBalancerPoolsData(
    poolIdentifiers.map(p => p.id),
    chainName
  );

  poolIdentifiers.forEach(({ index, id }) => {
    const balancerData = balancerPoolsData[id.toLowerCase()];
    if (balancerData && poolsData[index]) {
      poolsData[index].balancerPoolData = balancerData;
      poolsData[index].balancerPoolId = id;
    }
  });
}

async function getPoolIdentifiers(activePools, chainName) {
  const lpTokens = activePools.map(pool => pool.lptoken);
  const poolIdResults = await getPoolIds(lpTokens, chainName);

  return activePools.map((pool, i) => {
    const poolIdResult = poolIdResults[i];
    const id = (poolIdResult?.success && poolIdResult?.output)
      ? poolIdResult.output
      : pool.lptoken;
    return { index: pool.poolIndex, id };
  });
}

function extractPoolUnderlyingTokens(poolsData) {
  Object.values(poolsData).forEach(pool => {
    pool.underlyingTokens = extractUnderlyingTokens(pool.balancerPoolData);
  });
}

async function enrichPoolsWithRewards(poolsData, activePools, chainName) {
  const subgraphData = await queryAuraPoolRewards(chainName);

  if (subgraphData) {
    const mappedData = mapSubgraphDataToPools(subgraphData, poolsData);

    Object.entries(mappedData).forEach(([poolIndex, data]) => {
      if (poolsData[poolIndex]) {
        poolsData[poolIndex].rewardData = transformSubgraphRewards(data.rewardData);

        if (data.balancerPoolId && !poolsData[poolIndex].balancerPoolId) {
          poolsData[poolIndex].balancerPoolId = data.balancerPoolId;
        }
      }
    });
  } else {
    // Fallback to on-chain data
    const rewardData = await getRewardData(activePools, chainName);
    Object.entries(rewardData).forEach(([poolIndex, rewards]) => {
      if (poolsData[poolIndex]) {
        poolsData[poolIndex].rewardData = rewards;
      }
    });
  }
}

async function enrichPoolsWithAprs(poolsData, chainName, auraGlobals) {
  const aprData = await calculateAprs(poolsData, chainName, auraGlobals);
  Object.entries(aprData).forEach(([poolIndex, apr]) => {
    if (poolsData[poolIndex]) {
      poolsData[poolIndex].aprData = apr;
    }
  });
}

module.exports = {
  processChain,
};