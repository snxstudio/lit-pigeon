import { produce } from 'immer';
import type { PigeonDocument } from '../types/document.js';
import type { Selection, Step } from '../types/editor.js';

export class Transaction {
  private _steps: Step[] = [];
  private _selection: Selection | null = null;
  private _selectionSet = false;
  private _meta: Map<string, unknown> = new Map();
  private _doc: PigeonDocument;

  constructor(doc: PigeonDocument) {
    this._doc = doc;
  }

  get steps(): ReadonlyArray<Step> {
    return this._steps;
  }

  get selection(): Selection | null {
    return this._selection;
  }

  get selectionSet(): boolean {
    return this._selectionSet;
  }

  get meta(): ReadonlyMap<string, unknown> {
    return this._meta;
  }

  get doc(): PigeonDocument {
    return this._doc;
  }

  addStep(step: Step): this {
    this._doc = step.apply(this._doc);
    this._steps.push(step);
    return this;
  }

  setSelection(sel: Selection | null): this {
    this._selection = sel;
    this._selectionSet = true;
    return this;
  }

  setMeta(key: string, value: unknown): this {
    this._meta.set(key, value);
    return this;
  }

  getMeta(key: string): unknown {
    return this._meta.get(key);
  }
}

export function createDocStep(
  type: string,
  path: string,
  recipe: (doc: PigeonDocument) => void,
  invertRecipe: (doc: PigeonDocument) => void,
): Step {
  return {
    type,
    path,
    apply(doc: PigeonDocument): PigeonDocument {
      return produce(doc, recipe);
    },
    invert(_doc: PigeonDocument): Step {
      return createDocStep(`${type}:invert`, path, invertRecipe, recipe);
    },
  };
}
