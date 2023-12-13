<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<FormSlot>
  <template #label><slot name="label"></slot></template>
  <MkTab v-model="tab" style="margin-bottom: var(--margin);">
    <option value="edit">{{ i18n.ts.edit }}</option>
    <option value="preview">{{ i18n.ts.preview }}</option>
  </MkTab>
  <MkTextarea
      v-show="tab === 'edit'"
			ref="inputEl"
			v-model="v"
      :required="required"
      :readonly="readonly"
      :disabled="disabled"
      :pattern="pattern"
      :placeholder="placeholder"
      :autofocus="autofocus"
      :autocomplete="autocomplete"
      :spellcheck="spellcheck"
      :debounce="props.debounce"
      :manualSave="manualSave"
      :code="code"
      :tall="tall"
      :pre="pre"
      mfmAutocomplete
			@focus="focused = true"
			@blur="focused = false"
			@keydown="onKeydown($event)"
			@input="onInput" />
  <div v-show="tab === 'preview'" class="_panel" :class="{ [$style.mfmPreview]: true, [$style.tall]: tall }">
    <Mfm :text="v" :nyaize="nyaize ?? false" :author="author" />
  </div>
  <template #caption><slot name="caption"></slot></template>
</FormSlot>
</template>

<script lang="ts" setup>
import { ref, watch, toRefs, shallowRef } from 'vue';
import { debounce } from 'throttle-debounce';
import { i18n } from '@/i18n.js';
import FormSlot from '@/components/form/slot.vue';
import MkTab from '@/components/MkTab.vue';
import MkTextarea from '@/components/MkTextarea.vue';
import Misskey from 'misskey-js';

const props = defineProps<{
	modelValue: string | null;
	required?: boolean;
	readonly?: boolean;
	disabled?: boolean;
	pattern?: string;
	placeholder?: string;
	autofocus?: boolean;
	autocomplete?: string;
	spellcheck?: boolean;
	debounce?: boolean;
	manualSave?: boolean;
	code?: boolean;
	tall?: boolean;
	pre?: boolean;
  author?: Misskey.entities.UserLite;
  nyaize?: "respect" | boolean;
}>();

const emit = defineEmits<{
	(ev: 'change', _ev: KeyboardEvent): void;
	(ev: 'keydown', _ev: KeyboardEvent): void;
	(ev: 'enter'): void;
	(ev: 'update:modelValue', value: string): void;
}>();

const { modelValue } = toRefs(props);
const v = ref<string>(modelValue.value ?? '');
const focused = ref(false);
const changed = ref(false);
const inputEl = shallowRef<HTMLTextAreaElement>();
const tab = ref("edit");

const focus = () => inputEl.value.focus();
const onInput = (ev) => {
	changed.value = true;
	emit('change', ev);
};
const onKeydown = (ev: KeyboardEvent) => {
	if (ev.isComposing || ev.key === 'Process' || ev.keyCode === 229) return;

	emit('keydown', ev);

	if (ev.code === 'Enter') {
		emit('enter');
	}
};

const updated = () => {
	changed.value = false;
	emit('update:modelValue', v.value ?? '');
};

const debouncedUpdated = debounce(1000, updated);

watch(modelValue, newValue => {
	v.value = newValue;
});

watch(v, newValue => {
	if (!props.manualSave) {
		if (props.debounce) {
			debouncedUpdated();
		} else {
			updated();
		}
	}
});
</script>

<style lang="scss" module>
.mfmPreview {
  padding: 12px;
  border: 1px solid var(--divider);
  border-radius: 6px;
  box-sizing: border-box;
  min-height: 130px;
}

.tall {
  min-height: 200px;
}
</style>
