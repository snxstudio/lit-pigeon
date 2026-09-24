<script setup lang="ts">
import { shallowRef } from 'vue';
import { PigeonEditor, type PigeonDocument } from '@lit-pigeon/vue';
import { MjmlRenderer, documentToMjml } from '@lit-pigeon/renderer-mjml';

const props = defineProps<{ initial?: PigeonDocument }>();
const emit = defineEmits<{ save: [result: { mjml: string; html: string }] }>();

const renderer = new MjmlRenderer();
// shallowRef: the editor's documents must not be wrapped in a deep reactive proxy.
const latest = shallowRef<PigeonDocument | undefined>(props.initial);

function onChange(payload: { document: PigeonDocument }) {
  latest.value = payload.document;
}

async function save() {
  if (!latest.value) return;
  const mjml = documentToMjml(latest.value);
  const { html } = await renderer.render(latest.value);
  emit('save', { mjml, html });
}
</script>

<template>
  <PigeonEditor
    :document="props.initial"
    :renderer="renderer"
    :document-to-mjml="documentToMjml"
    style="display: block; height: 80vh"
    @change="onChange"
  />
  <button type="button" @click="save">Save</button>
</template>
