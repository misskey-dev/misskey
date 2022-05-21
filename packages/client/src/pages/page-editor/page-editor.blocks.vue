<template>
<XDraggable v-model="blocks" tag="div" item-key="id" handle=".drag-handle" :group="{ name: 'blocks' }" animation="150" swap-threshold="0.5">
	<template #item="{element}">
		<component :is="'x-' + element.type" :value="element" :hpml="hpml" @update:value="updateItem" @remove="() => removeItem(element)"/>
	</template>
</XDraggable>
</template>

<script lang="ts" setup>
import { defineAsyncComponent } from 'vue';
import XSection from './els/page-editor.el.section.vue';
import XText from './els/page-editor.el.text.vue';
import XTextarea from './els/page-editor.el.textarea.vue';
import XImage from './els/page-editor.el.image.vue';
import XButton from './els/page-editor.el.button.vue';
import XTextInput from './els/page-editor.el.text-input.vue';
import XTextareaInput from './els/page-editor.el.textarea-input.vue';
import XNumberInput from './els/page-editor.el.number-input.vue';
import XSwitch from './els/page-editor.el.switch.vue';
import XIf from './els/page-editor.el.if.vue';
import XPost from './els/page-editor.el.post.vue';
import XCounter from './els/page-editor.el.counter.vue';
import XRadioButton from './els/page-editor.el.radio-button.vue';
import XCanvas from './els/page-editor.el.canvas.vue';
import XNote from './els/page-editor.el.note.vue';

const XDraggable = defineAsyncComponent(() => import('vuedraggable').then(x => x.default));

const props = defineProps<{
	modelValue: any[],
	hpml: any,
}>();

const emit = defineEmits<{
	(ev: 'update:modelValue', v: any): void
}>();

const blocks = $computed({
	get: () => props.modelValue,
	set: (value) => {
		emit('update:modelValue', value);
	}
});

function updateItem(v) {
	const i = blocks.findIndex(x => x.id === v.id);
	const newValue = [
		...blocks.slice(0, i),
		v,
		...blocks.slice(i + 1)
	];
	emit('update:modelValue', newValue);
}

function removeItem(el) {
	const i = blocks.findIndex(x => x.id === el.id);
	const newValue = [
		...blocks.slice(0, i),
		...blocks.slice(i + 1)
	];
	emit('update:modelValue', newValue);
}
</script>
