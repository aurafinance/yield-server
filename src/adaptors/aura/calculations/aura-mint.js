const { COMMON_CONFIG } = require('../constants');

/**
 * Calculate the AURA mint amount for a given BAL amount
 * SDK-compatible implementation based on processAuraMintAmount
 */
function calculateAuraMintAmount(balEarned, globals, applyAip42 = COMMON_CONFIG.AIP_42_ENABLED) {
  if (!globals || !globals.auraTotalSupply) {
    console.error('AURA globals not provided - cannot calculate mint amount');
    return '0';
  }

  const balEarnedBN = BigInt(balEarned);

  const auraTotalSupply = BigInt(globals.auraTotalSupply);
  const auraMaxSupply = BigInt(globals.auraMaxSupply);
  const auraReductionPerCliff = BigInt(globals.auraReductionPerCliff);
  const auraTotalCliffs = BigInt(globals.auraTotalCliffs);

  // Filter out very small amounts that would produce invalid results
  if (balEarnedBN < 500000000000000n) {
    return '0';
  }

  const emissionsMinted = auraTotalSupply - auraMaxSupply;
  const cliff = emissionsMinted / auraReductionPerCliff;

  if (cliff < auraTotalCliffs) {
    // Calculate reduction factor (out of 1000)
    const reduction = ((auraTotalCliffs - cliff) * 25n) / 10n + 700n;

    let amount = (balEarnedBN * reduction) / auraTotalCliffs;

    // Check max supply limit
    const amtTillMax = auraMaxSupply - emissionsMinted;
    if (amount > amtTillMax) {
      amount = amtTillMax;
    }

    // Apply AIP-42 reduction (40% of original)
    if (applyAip42) {
      amount = (amount * 4n) / 10n;
    }

    return amount.toString();
  }

  return '0';
}

module.exports = {
  calculateAuraMintAmount,
};