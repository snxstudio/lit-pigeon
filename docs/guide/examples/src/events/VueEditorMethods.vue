<script setup lang="ts">
import { ref } from 'vue';
import { PigeonEditor } from '@lit-pigeon/vue';
import type { PigeonEditor as PigeonEditorElement } from '@lit-pigeon/editor';
import { MjmlRenderer } from '@lit-pigeon/renderer-mjml';

const renderer = new MjmlRenderer();
const wrapper = ref<{ $el: PigeonEditorElement } | null>(null);

// The wrapper's root element is the <pigeon-editor> element itself.
async function exportHtml(): Promise<string | null> {
  return (await wrapper.value?.$el.exportHtml()) ?? null;
}

defineExpose({ exportHtml });
</script>

<template>
  <PigeonEditor ref="wrapper" :renderer="renderer" theme="dark" style="display: block; height: 80vh" />
</template>
