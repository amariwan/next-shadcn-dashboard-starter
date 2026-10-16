/**
 * Feature flag for the optional self-hosted Orgs/Teams feature.
 * Set NEXT_PUBLIC_ORGS_ENABLED=false to hide it, or strip it entirely with:
 *   node scripts/cleanup.js orgs
 */
export const orgsEnabled = process.env.NEXT_PUBLIC_ORGS_ENABLED !== 'false';
