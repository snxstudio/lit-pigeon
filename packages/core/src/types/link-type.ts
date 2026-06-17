/** A selectable "special link" surfaced in the link editor and button panel. */
export interface LinkType {
  /** Stable id (also the picker option value). */
  id: string;
  /** Label shown in the picker. */
  label: string;
  /** Href inserted on select (e.g. "{{unsubscribe_url}}"). Omitted for guided types. */
  href?: string;
  /** When set, the picker prompts for a value and builds `mailto:`/`tel:`. */
  prompt?: 'email' | 'tel';
}
