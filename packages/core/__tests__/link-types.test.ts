import { describe, it, expect } from 'vitest';
import { SYSTEM_LINK_TYPES } from '../src/index.js';
import type { LinkType, EditorConfig } from '../src/index.js';

describe('SYSTEM_LINK_TYPES', () => {
  it('includes unsubscribe and view-in-browser with fixed {{…}} templates', () => {
    const byId = Object.fromEntries(SYSTEM_LINK_TYPES.map((t) => [t.id, t]));
    expect(byId['unsubscribe'].href).toBe('{{unsubscribe_url}}');
    expect(byId['view-in-browser'].href).toBe('{{view_in_browser_url}}');
  });

  it('includes guided email and phone types', () => {
    const byId = Object.fromEntries(SYSTEM_LINK_TYPES.map((t) => [t.id, t]));
    expect(byId['email'].prompt).toBe('email');
    expect(byId['phone'].prompt).toBe('tel');
  });

  it('LinkType + EditorConfig.linkTypes are usable', () => {
    const custom: LinkType = { id: 'survey', label: 'Survey', href: '{{survey_url}}' };
    const cfg: EditorConfig = { linkTypes: [custom] };
    expect(cfg.linkTypes?.[0].id).toBe('survey');
  });
});
