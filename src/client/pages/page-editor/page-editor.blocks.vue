<template>
<XDraggable tag="div" v-model="blocks" item-key="id" handle=".drag-handle" :group="{ name: 'blocks' }" animation="150" swap-threshold="0.5">
	<template #item="{element}">
		<component :is="'x-' + element.type" :value="element" @update:value="updateItem" @remove="() => removeItem(element)" :hpml="hpml"/>
	</template>
</XDraggable>
</template>

<script lang="ts">
import { defineComponent, defineAsyncComponent } from 'vue';
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
import * as os from '@client/os';

export default defineComponent({
	components: {
		XDraggable: defineAsyncComponent(() => import('vuedraggable').then(x => x.default)),
		XSection, XText, XImage, XButton, XTextarea, XTextInput, XTextareaInput, XNumberInput, XSwitch, XIf, XPost, XCounter, XRadioButton, XCanvas, XNote
	},

	props: {
		value: {
			type: Array,
			required: true
		},
		hpml: {
			required: true,
		},
	},

	emits: ['update:value'],

	computed: {
		blocks: {
			get() {
				return this.value;
			},
			set(value) {
				this.$emit('update:value', value);
			}
		}
	},

	methods: {
		updateItem(v) {
			const i = this.blocks.findIndex(x => x.id === v.id);
			const newValue = [
				...this.blocks.slice(0, i),
				v,
				...this.blocks.slice(i + 1)
			];
			this.$emit('update:value', newValue);
		},

		removeItem(el) {
			console.log(el);
			const i = this.blocks.findIndex(x => x.id === el.id);
			const newValue = [
				...this.blocks.slice(0, i),
				...this.blocks.slice(i + 1)
			];
			this.$emit('update:value', newValue);
		},
	}
});
</script>
