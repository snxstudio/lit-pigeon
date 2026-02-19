import { produce } from 'immer';
import type { PigeonDocument } from '../types/document.js';
import type { Selection, EditorConfig, PigeonPlugin } from '../types/editor.js';
import { Transaction } from './transaction.js';
import { createDefaultDocument } from '../schema/defaults.js';

export class EditorState {
  readonly doc: PigeonDocument;
  readonly selection: Selection | null;
  readonly plugins: Map<string, unknown>;

  private readonly _pluginList: PigeonPlugin[];

  private constructor(
    doc: PigeonDocument,
    selection: Selection | null,
    plugins: Map<string, unknown>,
    pluginList: PigeonPlugin[],
  ) {
    this.doc = doc;
    this.selection = selection;
    this.plugins = plugins;
    this._pluginList = pluginList;
  }

  static create(config: EditorConfig = {}): EditorState {
    const doc = config.doc ?? createDefaultDocument();
    const pluginList = config.plugins ?? [];
    const pluginState = new Map<string, unknown>();

    const state = new EditorState(doc, null, pluginState, pluginList);

    for (const plugin of pluginList) {
      if (plugin.init) {
        pluginState.set(plugin.name, plugin.init(state));
      }
    }

    return state;
  }

  createTransaction(): Transaction {
    return new Transaction(this.doc);
  }

  apply(tr: Transaction): EditorState {
    let newDoc = tr.doc;
    const newSelection = tr.selectionSet ? tr.selection : this.selection;
    const newPluginState = new Map(this.plugins);

    for (const plugin of this._pluginList) {
      if (plugin.apply) {
        const currentState = newPluginState.get(plugin.name);
        newPluginState.set(plugin.name, plugin.apply(tr, currentState));
      }
    }

    // Update timestamp using produce since doc may be frozen by Immer
    if (tr.steps.length > 0 && !tr.getMeta('skipTimestamp')) {
      newDoc = produce(newDoc, (draft) => {
        draft.metadata.updatedAt = new Date().toISOString();
      });
    }

    const newState = new EditorState(newDoc, newSelection, newPluginState, this._pluginList);

    for (const plugin of this._pluginList) {
      if (plugin.onStateChange) {
        plugin.onStateChange(newState, this);
      }
    }

    return newState;
  }

  getPluginState<T>(pluginName: string): T | undefined {
    return this.plugins.get(pluginName) as T | undefined;
  }
}
