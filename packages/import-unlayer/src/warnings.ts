/**
 * A single piece of fidelity loss encountered during import.
 *
 * The importer never throws on unsupported content — it converts what it can
 * and reports the rest, so a migration UI can show the user exactly what needs
 * a second look rather than failing the whole template.
 */
export interface ImportWarning {
  code: ImportWarningCode;
  message: string;
  /** The Unlayer content type responsible, when the warning is block-scoped. */
  contentType?: string;
}

export type ImportWarningCode =
  | 'not-a-design'
  | 'no-rows'
  | 'unsupported-block'
  | 'plugin-block'
  | 'custom-tool'
  | 'display-condition-dropped'
  | 'heading-level-clamped'
  | 'empty-row';
