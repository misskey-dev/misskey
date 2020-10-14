<template>
<XModalWindow :width="800" :height="500" @close="$emit('done')" :with-ok-button="true" :ok-button-disabled="(type === 'file') && (selected.length === 0)" @ok="ok()">
	<template #header>
		{{ multiple ? ((type === 'file') ? $t('selectFiles') : $t('selectFolders')) : ((type === 'file') ? $t('selectFile') : $t('selectFolder')) }}
		<span v-if="selected.length > 0" style="margin-left: 8px; opacity: 0.5;">({{ number(selected.length) }})</span>
	</template>
	<div>
		<XDrive :multiple="multiple" @change-selection="onChangeSelection" @selected="ok()" :select="type"/>
	</div>
</XModalWindow>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import XDrive from './drive.vue';
import XModalWindow from './modal-window.vue';
import number from '@/filters/number';
import * as os from '@/os';

export default defineComponent({
	components: {
		XDrive,
		XModalWindow,
	},

	props: {
		type: {
			type: String,
			required: false,
			default: 'file'
		},
		multiple: {
			type: Boolean,
			default: false
		}
	},

	emits: ['done'],

	data() {
		return {
			selected: []
		};
	},

	methods: {
		ok() {
			this.$emit('done', this.selected);
		},

		onChangeSelection(xs) {
			this.selected = xs;
		},

		number
	}
});
</script>
