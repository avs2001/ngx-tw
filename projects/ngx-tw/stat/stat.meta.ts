import type { ComponentMeta } from '../meta.types';

export const meta = {
  summary:
    'KPI tile presenting a single dominant numeric value with a short label, optional description, and an optional trend delta against a comparison period.',
  whenToUse: [
    'Analytics dashboards, admin overviews, and reporting surfaces where four to twelve metrics share a grid',
    'Showing a metric alongside its movement ("+12.5% vs prior period") with direction conveyed by icon, color, and an announced label',
    '"Lower is better" metrics — bounce rate, latency, error rate, churn — where the success/error colors need inverting without flipping the literal direction',
    'A metric block that must show placeholders while its number is still loading',
    'Pairing the number with a sparkline, status badge, or auxiliary metadata in a footer slot',
  ],
  whenNotToUse: [
    {
      instead: 'progress-bar',
      because: 'the KPI reads as progress toward a target rather than a change versus a previous period',
    },
    {
      instead: 'badge',
      because: 'the number annotates some other content (a count on a tab or row) instead of being the block itself',
    },
    {
      instead: 'card',
      because: 'you need the frame around a whole dashboard section — stat is the tile, not the section container',
    },
  ],
  related: ['card', 'badge', 'skeleton', 'progress-bar', 'icon'],
  aliases: [
    'kpi',
    'metric',
    'metrics',
    'statistic',
    'stat card',
    'metric card',
    'number tile',
    'trend',
    'delta',
    'scorecard',
    'dashboard tile',
  ],
} satisfies ComponentMeta;
