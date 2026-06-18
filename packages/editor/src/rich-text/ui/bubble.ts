import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { Editor } from '@tiptap/core';
import { richTextController } from '../controller.js';
import '../../components/properties/controls/pigeon-link-type-picker.js';
import type { LinkType } from '@lit-pigeon/core';

/**
 * Floating formatting toolbar shown above the current text selection.
 *
 * Positioning is computed manually via `editor.view.coordsAtPos(...)`
 * rather than using `@tiptap/extension-bubble-menu`/tippy, which avoids
 * the shadow-DOM positioning pitfalls called out in the design spec.
 */
@customElement('pigeon-rich-text-bubble')
export class PigeonRichTextBubble extends LitElement {
  @property({ attribute: false })
  editor: Editor | null = null;

  @property({ attribute: false })
  linkTypes: LinkType[] = [];

  @state() private _visible = false;
  @state() private _top = 0;
  @state() private _left = 0;
  @state() private _activeBold = false;
  @state() private _activeItalic = false;
  @state() private _activeUnderline = false;
  @state() private _activeStrike = false;
  @state() private _activeCode = false;
  @state() private _activeLink = false;
  @state() private _linkPopoverOpen = false;
  @state() private _linkValue = '';

  private _onSelectionUpdate = () => this._sync();
  private _onBlur = () => {
    // Focus moved to one of this bar's own controls (e.g. the link field).
    // Keep the bar visible — it will be torn down on a genuine blur instead.
    if (richTextController.isHeld()) return;
    this._visible = false;
    this._linkPopoverOpen = false;
  };
  private _unsubscribe: (() => void) | null = null;

  /**
   * Prevent the editable from losing focus when a toolbar button is pressed.
   * Without this, `mousedown` blurs the editor — which tears down the inline
   * editing session before the button's `click` handler can run its command.
   */
  private _preventBlur = (e: Event) => e.preventDefault();

  static styles = css`
    :host {
      position: fixed;
      z-index: 10002;
      display: none;
      pointer-events: none;
    }

    :host([data-visible]) {
      display: block;
    }

    .bar {
      /* Fixed so the inline top/left (viewport coords from coordsAtPos) take
         effect; the translate below anchors the bar's bottom-centre to the
         selection. Without an explicit position the coords are ignored and the
         bar collapses to the host's top-left corner. */
      position: fixed;
      pointer-events: auto;
      display: inline-flex;
      align-items: center;
      background: var(--pigeon-bg, #ffffff);
      border: 1px solid var(--pigeon-border, #e2e8f0);
      border-radius: var(--pigeon-radius, 6px);
      box-shadow: var(--pigeon-shadow-md);
      padding: 4px;
      gap: 2px;
      font-family: var(--pigeon-font);
      transform: translate(-50%, calc(-100% - 8px));
    }

    button {
      background: transparent;
      border: none;
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      border-radius: var(--pigeon-radius-sm, 4px);
      color: var(--pigeon-text, #1e293b);
      font-size: 13px;
      font-weight: 600;
    }

    button:hover {
      background: var(--pigeon-surface-hover, #f1f5f9);
    }

    button[data-active] {
      background: var(--pigeon-primary, #3b82f6);
      color: var(--pigeon-primary-foreground, #ffffff);
    }

    .divider {
      width: 1px;
      height: 18px;
      background: var(--pigeon-border, #e2e8f0);
      margin: 0 2px;
    }

    .link-popover {
      pointer-events: auto;
      position: absolute;
      top: 100%;
      left: 50%;
      transform: translate(-50%, 8px);
      background: var(--pigeon-bg, #ffffff);
      border: 1px solid var(--pigeon-border, #e2e8f0);
      border-radius: var(--pigeon-radius, 6px);
      box-shadow: var(--pigeon-shadow-md);
      padding: 8px;
      display: flex;
      gap: 4px;
      align-items: center;
    }

    .link-popover input {
      width: 200px;
      height: 28px;
      border: 1px solid var(--pigeon-border, #e2e8f0);
      border-radius: var(--pigeon-radius-sm, 4px);
      padding: 0 8px;
      font-family: var(--pigeon-font);
      font-size: 13px;
      outline: none;
    }

    .link-popover input:focus {
      border-color: var(--pigeon-border-focus, #3b82f6);
    }

    .link-popover button.primary {
      width: auto;
      padding: 0 10px;
      background: var(--pigeon-primary, #3b82f6);
      color: var(--pigeon-primary-foreground, #ffffff);
    }
  `;

  connectedCallback() {
    super.connectedCallback();
    this._unsubscribe = richTextController.subscribe((editor) => {
      this._bindEditor(editor);
    });
    this._bindEditor(richTextController.getActive());
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._unsubscribe?.();
    this._unsubscribe = null;
    this._bindEditor(null);
  }

  private _bindEditor(next: Editor | null) {
    if (this.editor === next) return;
    if (this.editor) {
      this.editor.off('selectionUpdate', this._onSelectionUpdate);
      this.editor.off('blur', this._onBlur);
    }
    this.editor = next;
    if (next) {
      next.on('selectionUpdate', this._onSelectionUpdate);
      next.on('blur', this._onBlur);
    } else {
      this._visible = false;
      this._linkPopoverOpen = false;
    }
  }

  updated() {
    if (this._visible) this.setAttribute('data-visible', '');
    else this.removeAttribute('data-visible');
  }

  render() {
    const style = `top: ${this._top}px; left: ${this._left}px;`;
    return html`
      <div class="bar" style=${style} @mousedown=${this._preventBlur}>
        <button title="Bold (Cmd+B)" ?data-active=${this._activeBold} @click=${() => this._toggle('toggleBold')}>B</button>
        <button title="Italic (Cmd+I)" ?data-active=${this._activeItalic} @click=${() => this._toggle('toggleItalic')}><em>I</em></button>
        <button title="Underline (Cmd+U)" ?data-active=${this._activeUnderline} @click=${() => this._toggle('toggleUnderline')}><u>U</u></button>
        <button title="Strike" ?data-active=${this._activeStrike} @click=${() => this._toggle('toggleStrike')}><s>S</s></button>
        <button title="Code" ?data-active=${this._activeCode} @click=${() => this._toggle('toggleCode')}>&lt;&gt;</button>
        <span class="divider"></span>
        <button title="Link" ?data-active=${this._activeLink} @click=${this._toggleLinkPopover}>↗</button>
        ${this._linkPopoverOpen ? this._renderLinkPopover() : ''}
      </div>
    `;
  }

  private _renderLinkPopover() {
    return html`
      <div
        class="link-popover"
        @click=${(e: Event) => e.stopPropagation()}
        @mousedown=${(e: Event) => e.stopPropagation()}
      >
        <input
          type="url"
          placeholder="https://…"
          .value=${this._linkValue}
          @mousedown=${() => richTextController.holdFocus()}
          @blur=${() => richTextController.releaseFocus()}
          @input=${(e: Event) => this._linkValue = (e.target as HTMLInputElement).value}
          @keydown=${(e: KeyboardEvent) => e.key === 'Enter' && this._applyLink()}
        />
        <button class="primary" @click=${this._applyLink}>Apply</button>
        ${this._activeLink ? html`<button @click=${this._removeLink} title="Remove link">×</button>` : ''}
        <pigeon-link-type-picker
          .linkTypes=${this.linkTypes}
          @link-type-select=${this._onLinkTypeSelect}
        ></pigeon-link-type-picker>
      </div>
    `;
  }

  private _sync() {
    const ed = this.editor;
    if (!ed || ed.isDestroyed) {
      this._visible = false;
      return;
    }
    const { from, to } = ed.state.selection;
    if (from === to) {
      this._visible = false;
      this._linkPopoverOpen = false;
      return;
    }

    this._activeBold = ed.isActive('bold');
    this._activeItalic = ed.isActive('italic');
    this._activeUnderline = ed.isActive('underline');
    this._activeStrike = ed.isActive('strike');
    this._activeCode = ed.isActive('code');
    this._activeLink = ed.isActive('link');

    try {
      const start = ed.view.coordsAtPos(from);
      const end = ed.view.coordsAtPos(to);
      this._top = Math.min(start.top, end.top);
      this._left = (start.left + end.right) / 2;
      this._visible = true;
    } catch {
      this._visible = false;
    }
  }

  private _toggle(command: 'toggleBold' | 'toggleItalic' | 'toggleUnderline' | 'toggleStrike' | 'toggleCode') {
    const ed = this.editor;
    if (!ed) return;
    // Cast — TipTap's chain types are dynamic per extension.
    (ed.chain().focus() as unknown as Record<string, () => { run(): void }>)[command]().run();
    this._sync();
  }

  private _toggleLinkPopover() {
    if (!this.editor) return;
    const existing = this.editor.getAttributes('link')?.href ?? '';
    this._linkValue = existing;
    this._linkPopoverOpen = !this._linkPopoverOpen;
  }

  private _applyLink() {
    const ed = this.editor;
    if (!ed) return;
    const href = this._linkValue.trim();
    if (!href) {
      this._removeLink();
      return;
    }
    // Defence in depth: the link extension already blocks unsafe schemes,
    // but reject the input here so the user gets immediate feedback.
    if (!/^(https?:|mailto:|tel:|#|\/|\{\{)/i.test(href)) return;
    ed.chain().focus().extendMarkRange('link').setLink({ href }).run();
    this._linkPopoverOpen = false;
    this._sync();
  }

  private _onLinkTypeSelect(e: CustomEvent<{ href: string }>) {
    this._linkValue = e.detail.href;
    this._applyLink();
  }

  private _removeLink() {
    const ed = this.editor;
    if (!ed) return;
    ed.chain().focus().extendMarkRange('link').unsetLink().run();
    this._linkPopoverOpen = false;
    this._sync();
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'pigeon-rich-text-bubble': PigeonRichTextBubble;
  }
}
