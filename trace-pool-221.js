const sdk = require('@defillama/sdk');
const { ethers } = require('ethers');
const boosterABI = require('./src/adaptors/aura/abis/booster.json');
const balancerPoolABI = require('./src/adaptors/aura/abis/balancerPool.json');
const { CHAIN_CONFIG } = require('./src/adaptors/aura/config');
const { getBalancerPoolsData } = require('./src/adaptors/aura/data/balancerPools');

async function tracePool221() {
  const chainName = 'ethereum';
  const { booster } = CHAIN_CONFIG[chainName];

  // Get all active pools to see what we're querying
  const poolLength = 230; // Get up to pool 230

  const allPools = [];
  for (let i = 220; i <= 225; i++) {
    const poolInfo = await sdk.api.abi.call({
      abi: boosterABI.find(({ name }) => name === 'poolInfo'),
      target: booster,
      params: [i],
      chain: chainName,
      permitFailure: true,
    });

    if (poolInfo.output && !poolInfo.output.shutdown) {
      allPools.push({
        index: i,
        lptoken: poolInfo.output.lptoken
      });
    }
  }

  console.log('=== Active Pools 220-225 ===');
  allPools.forEach(p => {
    console.log(`Pool ${p.index}: ${p.lptoken}`);
  });

  // Check for pool IDs
  console.log('\n=== Checking for Pool IDs ===');
  const poolIds = [];
  for (const pool of allPools) {
    const poolIdResult = await sdk.api.abi.call({
      abi: balancerPoolABI.find(({ name }) => name === 'getPoolId'),
      target: pool.lptoken,
      chain: chainName,
      permitFailure: true,
    });

    if (poolIdResult.success && poolIdResult.output) {
      console.log(`Pool ${pool.index}: has poolId ${poolIdResult.output}`);
      poolIds.push(poolIdResult.output);
    } else {
      console.log(`Pool ${pool.index}: V3 pool (no poolId)`);
      poolIds.push(pool.lptoken);
    }
  }

  // Query Balancer for all these pools
  console.log('\n=== Querying Balancer API ===');
  const balancerData = await getBalancerPoolsData(poolIds, chainName);

  console.log(`\nFound ${Object.keys(balancerData).length} pools in Balancer`);

  Object.entries(balancerData).forEach(([key, pool]) => {
    console.log(`\nKey: ${key}`);
    console.log(`  Pool ID: ${pool.id}`);
    console.log(`  Address: ${pool.address}`);

    // Try to match this back to an Aura pool
    const matchingPool = allPools.find(p =>
      p.lptoken.toLowerCase() === pool.address?.toLowerCase() ||
      p.lptoken.toLowerCase() === key.toLowerCase()
    );

    if (matchingPool) {
      console.log(`  MATCHES Aura Pool ${matchingPool.index}`);
    }

    if (pool.dynamicData?.aprItems) {
      console.log('  APR Items:');
      pool.dynamicData.aprItems.forEach(item => {
        console.log(`    ${item.type}: ${(item.apr * 100).toFixed(4)}%`);
      });
    }
  });
}

tracePool221().catch(console.error);