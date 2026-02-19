// Main editor component
export { PigeonEditor } from './editor.js';

// Canvas components
export { PigeonCanvas } from './components/canvas/pigeon-canvas.js';
export { PigeonRow } from './components/canvas/pigeon-row.js';
export { PigeonColumn } from './components/canvas/pigeon-column.js';
export { PigeonDropIndicator } from './components/canvas/pigeon-drop-indicator.js';

// Palette components
export { PigeonPalette } from './components/palette/pigeon-palette.js';
export { PigeonPaletteItem } from './components/palette/pigeon-palette-item.js';

// Property panel components
export { PigeonProperties } from './components/properties/pigeon-properties.js';

// Property panels
export { PigeonTextPanel } from './components/properties/panels/text-panel.js';
export { PigeonImagePanel } from './components/properties/panels/image-panel.js';
export { PigeonButtonPanel } from './components/properties/panels/button-panel.js';
export { PigeonRowPanel } from './components/properties/panels/row-panel.js';
export { PigeonBodyPanel } from './components/properties/panels/body-panel.js';

// Property controls
export { PigeonColorPicker } from './components/properties/controls/color-picker.js';
export { PigeonSpacingInput } from './components/properties/controls/spacing-input.js';
export { PigeonAlignmentPicker } from './components/properties/controls/alignment-picker.js';
export { PigeonSliderInput } from './components/properties/controls/slider-input.js';

// Toolbar
export { PigeonToolbar } from './components/toolbar/pigeon-toolbar.js';

// Block renderers
export { PigeonTextBlock } from './components/blocks/text-block.js';
export { PigeonImageBlock } from './components/blocks/image-block.js';
export { PigeonButtonBlock } from './components/blocks/button-block.js';
export { PigeonDividerBlock } from './components/blocks/divider-block.js';
export { PigeonSpacerBlock } from './components/blocks/spacer-block.js';
export { PigeonSocialBlock } from './components/blocks/social-block.js';
export { PigeonHtmlBlock } from './components/blocks/html-block.js';

// DnD utilities
export { setDragData, getDragData, clearDragData, writeDragTransfer, readDragTransfer } from './dnd/drag-manager.js';
export type { DragData, DragItemType } from './dnd/drag-manager.js';
export { calculateRowDropIndex, calculateBlockDropIndex } from './dnd/drop-zones.js';
export type { DropTarget } from './dnd/drop-zones.js';
