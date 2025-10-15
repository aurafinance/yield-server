// Chain-specific configuration
const CHAIN_CONFIG = {
  ethereum: {
    booster: '0xA57b8d98dAE62B26Ec3bcC4a365338157060B234',
    chainId: 1,
    tokens: {
      AURA: '0xc0c293ce456ff0ed870add98a0828dd4d2903dbf',
      BAL: '0xba100000625a3754423978a60c9317c58a424e3d',
    },
    subgraph: 'https://subgraph.satsuma-prod.com/65b10f149401/1xhub-ltd/aura-finance-mainnet/api',
    rpcEndpoint: 'https://eth-mainnet.g.alchemy.com/v2/PhnArv1GYVTCO5nncatDbF8iNih6Kynx',
  },
  arbitrum: {
    booster: '0x98Ef32edd24e2c92525E59afc4475C1242a30184',
    chainId: 42161,
    tokens: {
      AURA: '0x1509706a6c66ca549ff0cb464de88231ddbe213b',
      BAL: '0x040d1edc9569d4bab2d15287dc5a4f10f56a56b8',
    },
    subgraph: 'https://subgraph.satsuma-prod.com/65b10f149401/1xhub-ltd/aura-finance-arbitrum/api',
    rpcEndpoint: 'https://arb-mainnet.g.alchemy.com/v2/PhnArv1GYVTCO5nncatDbF8iNih6Kynx',
  },
  base: {
    booster: '0x98Ef32edd24e2c92525E59afc4475C1242a30184',
    chainId: 8453,
    tokens: {
      AURA: '0x1509706a6c66ca549ff0cb464de88231ddbe213b', // Bridged AURA on Base
      BAL: '0x4158734d47fc9692176b5085e0f52ee0da5d47f1',
    },
    subgraph: 'https://subgraph.satsuma-prod.com/65b10f149401/1xhub-ltd/aura-finance-base/api',
    rpcEndpoint: 'https://base-mainnet.g.alchemy.com/v2/PhnArv1GYVTCO5nncatDbF8iNih6Kynx',
  },
  avalanche: {
    tokens: {
      AURA: '0x1509706a6c66ca549ff0cb464de88231ddbe213b',
      BAL: '0xe15bcb9e0ea69e6ab9fa080c4c4a5632896298c3',
    },
    subgraph: 'https://subgraph.satsuma-prod.com/65b10f149401/1xhub-ltd/aura-finance-avalanche/api',
  },
  gnosis: {
    tokens: {
      AURA: '0x1509706a6c66ca549ff0cb464de88231ddbe213b',
      BAL: '0x7ef541e2a22058048904fe5744f9c7e4c57af717',
    },
    subgraph: 'https://subgraph.satsuma-prod.com/65b10f149401/1xhub-ltd/aura-finance-gnosis/api',
  },
  optimism: {
    tokens: {
      AURA: '0x1509706a6c66ca549ff0cb464de88231ddbe213b',
      BAL: '0xfe8b128ba8c78aabc59d4c64cee7ff28e9379921',
    },
    subgraph: 'https://subgraph.satsuma-prod.com/65b10f149401/1xhub-ltd/aura-finance-optimism/api',
  },
  polygon: {
    tokens: {
      AURA: '0x1509706a6c66ca549ff0cb464de88231ddbe213b',
      BAL: '0x9a71012b13ca4d3d0cdc72a177df3ef03b0e76a3',
    },
    subgraph: 'https://subgraph.satsuma-prod.com/65b10f149401/1xhub-ltd/aura-finance-polygon/api',
  },
};

module.exports = {
  CHAIN_CONFIG,
};