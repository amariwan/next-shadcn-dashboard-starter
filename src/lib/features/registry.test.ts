import { describe, expect, it, beforeEach } from 'bun:test';
import { featureRegistry } from './registry';
import { assertFeatureEnabled } from './guard';
import { z } from 'zod';

describe('Feature Registry & Modular Feature System', () => {
  beforeEach(() => {
    featureRegistry.resetToDefaults();
  });

  describe('Feature Registration & Discovery', () => {
    it('initializes with default platform features', () => {
      const all = featureRegistry.getAll();
      const ids = all.map((f) => f.id);

      expect(ids).toContain('overview');
      expect(ids).toContain('workspaces');
      expect(ids).toContain('audit-log');
      expect(ids).toContain('kanban');
      expect(ids).toContain('users');
      expect(ids).toContain('products');
    });

    it('allows registering a new modular feature with config schema', () => {
      featureRegistry.register({
        id: 'custom-ai-insights',
        name: 'AI Insights',
        description: 'Automated trend predictions',
        category: 'analytics',
        enabled: true,
        configSchema: z.object({
          model: z.string().default('gemini-flash')
        })
      });

      const feature = featureRegistry.get('custom-ai-insights');
      expect(feature).toBeDefined();
      expect(feature?.name).toBe('AI Insights');
      expect(featureRegistry.isEnabled('custom-ai-insights')).toBe(true);
    });
  });

  describe('Independent Activation & Deactivation', () => {
    it('disables a feature dynamically and reflects in isEnabled', () => {
      expect(featureRegistry.isEnabled('kanban')).toBe(true);

      const success = featureRegistry.setEnabled('kanban', false);
      expect(success).toBe(true);
      expect(featureRegistry.isEnabled('kanban')).toBe(false);

      // Re-enable
      featureRegistry.setEnabled('kanban', true);
      expect(featureRegistry.isEnabled('kanban')).toBe(true);
    });

    it('returns false when checking non-existent feature', () => {
      expect(featureRegistry.isEnabled('non-existent-feature')).toBe(false);
      expect(featureRegistry.setEnabled('non-existent-feature', true)).toBe(false);
    });
  });

  describe('Dependencies & Cascading Activation', () => {
    it('evaluates dependent feature as disabled if its prerequisite is disabled', () => {
      // audit-log depends on workspaces
      expect(featureRegistry.isEnabled('audit-log')).toBe(true);

      // Disable prerequisite workspaces
      featureRegistry.setEnabled('workspaces', false);

      // audit-log must now be disabled because its dependency is disabled
      expect(featureRegistry.isEnabled('audit-log')).toBe(false);
    });
  });

  describe('Permission & Role Context Evaluation', () => {
    it('enforces required permissions from FeatureContext', () => {
      // audit-log requires 'audit.read'
      const contextWithoutAudit: Parameters<typeof featureRegistry.isEnabled>[1] = {
        permissions: ['organization.read', 'members.read'],
        activeRole: 'member',
        systemRole: 'user'
      };

      const contextWithAudit: Parameters<typeof featureRegistry.isEnabled>[1] = {
        permissions: ['organization.read', 'audit.read'],
        activeRole: 'admin',
        systemRole: 'user'
      };

      expect(featureRegistry.isEnabled('audit-log', contextWithoutAudit)).toBe(false);
      expect(featureRegistry.isEnabled('audit-log', contextWithAudit)).toBe(true);
    });

    it('grants access to system admins even without explicit org permission', () => {
      const systemAdminContext: Parameters<typeof featureRegistry.isEnabled>[1] = {
        permissions: [],
        activeRole: 'member',
        systemRole: 'admin'
      };

      expect(featureRegistry.isEnabled('audit-log', systemAdminContext)).toBe(true);
    });
  });

  describe('Server-Side Feature Guards', () => {
    it('assertFeatureEnabled succeeds when feature is active', () => {
      expect(() => assertFeatureEnabled('overview')).not.toThrow();
    });

    it('assertFeatureEnabled throws an Error when feature is disabled', () => {
      featureRegistry.setEnabled('chat', false);
      expect(() => assertFeatureEnabled('chat')).toThrow("Feature 'chat' is disabled");
    });
  });
});
