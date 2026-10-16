import { describe, expect, it } from 'bun:test';
import { widgetRegistry } from './registry';

describe('Widget Registry & Modular Dashboard Widgets', () => {
  it('registers all standard dashboard widgets', () => {
    const all = widgetRegistry.getAll();
    expect(all.length).toBeGreaterThanOrEqual(10);

    const ids = all.map((w) => w.id);
    expect(ids).toContain('kpi-revenue');
    expect(ids).toContain('kpi-customers');
    expect(ids).toContain('kpi-accounts');
    expect(ids).toContain('kpi-growth');
    expect(ids).toContain('chart-bar');
    expect(ids).toContain('chart-area');
    expect(ids).toContain('chart-line');
    expect(ids).toContain('chart-pie');
    expect(ids).toContain('feed-activity');
    expect(ids).toContain('summary-resources');
  });

  it('provides a default dashboard layout with valid widgets', () => {
    const defaultLayout = widgetRegistry.getDefaultLayout();
    expect(defaultLayout.items).toBeArray();
    expect(defaultLayout.items.length).toBeGreaterThanOrEqual(8);

    for (const item of defaultLayout.items) {
      const def = widgetRegistry.get(item.id);
      expect(def).toBeDefined();
      expect(def?.supportedSizes).toContain(item.size);
    }
  });

  it('allows registering a custom widget definition', () => {
    widgetRegistry.register({
      id: 'custom-widget-metric',
      title: 'Custom Latency Metric',
      description: 'API p99 latency gauge',
      category: 'custom',
      defaultSize: 'small',
      supportedSizes: ['small', 'medium'],
      component: () => null
    });

    const custom = widgetRegistry.get('custom-widget-metric');
    expect(custom).toBeDefined();
    expect(custom?.title).toBe('Custom Latency Metric');
    expect(custom?.category).toBe('custom');
  });
});
