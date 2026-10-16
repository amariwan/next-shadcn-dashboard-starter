import { featureRegistry } from './registry';
import { notFound } from 'next/navigation';

/**
 * Server-side guard to guarantee that disabled features cannot be accessed.
 * Throws notFound() if the feature is disabled in the Feature Registry.
 */
export function requireFeature(featureId: string): void {
  const isEnabled = featureRegistry.isEnabled(featureId);
  if (!isEnabled) {
    notFound();
  }
}

/**
 * Assertion function throwing an Error if the feature is disabled.
 * Useful in API Route Handlers and Server Actions.
 */
export function assertFeatureEnabled(featureId: string): void {
  const isEnabled = featureRegistry.isEnabled(featureId);
  if (!isEnabled) {
    throw new Error(`Feature '${featureId}' is disabled`);
  }
}
