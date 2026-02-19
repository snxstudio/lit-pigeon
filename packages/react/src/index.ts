import React from 'react';
import { createComponent, type EventName } from '@lit/react';
import { PigeonEditor as PigeonEditorWC } from '@lit-pigeon/editor';
import type { PigeonDocument, Selection } from '@lit-pigeon/core';

export const PigeonEditor = createComponent({
  tagName: 'pigeon-editor',
  elementClass: PigeonEditorWC,
  react: React,
  events: {
    onChange: 'pigeon:change' as EventName<CustomEvent<{ document: PigeonDocument }>>,
    onSelect: 'pigeon:select' as EventName<CustomEvent<{ selection: Selection | null }>>,
    onReady: 'pigeon:ready' as EventName<CustomEvent<void>>,
    onPreview: 'pigeon:preview' as EventName<CustomEvent<void>>,
    onExport: 'pigeon:export' as EventName<CustomEvent<void>>,
  },
});

export type PigeonEditorProps = React.ComponentProps<typeof PigeonEditor>;

// Re-export core types for convenience
export type {
  PigeonDocument,
  EditorConfig,
  Selection,
  ContentBlock,
  RowNode,
  ColumnNode,
  BlockType,
  Spacing,
} from '@lit-pigeon/core';
