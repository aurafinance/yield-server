/**
 * Centralized exports for all subgraph interactions
 */

const { queryAuraGlobals } = require('./globals');
const { queryAuraPoolRewards } = require('./rewards');
const { mapSubgraphDataToPools } = require('./mapper');
const { fetchBalancerPoolsData } = require('./balancer-pools');

module.exports = {
  // Aura subgraph
  queryAuraGlobals,
  queryAuraPoolRewards,
  mapSubgraphDataToPools,

  // Balancer subgraph
  fetchBalancerPoolsData,
};