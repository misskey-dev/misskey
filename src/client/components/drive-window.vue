<template>
<x-window ref="window" :width="800" :height="500" @closed="() => { $emit('closed'); destroyDom(); }" :with-ok-button="true" :ok-button-disabled="(type === 'file') && (selected.length === 0)" @ok="ok()">
	<template #header>
		{{ multiple ? ((type === 'file') ? $t('selectFiles') : $t('selectFolders')) : ((type === 'file') ? $t('selectFile') : $t('selectFolder')) }}
		<span v-if="selected.length > 0" style="margin-left: 8px; opacity: 0.5;">({{ selected.length | number }})</span>
	</template>
	<div>
		<x-drive :multiple="multiple" @change-selection="onChangeSelection" :select="type"/>
	</div>
</x-window>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import XDrive from './drive.vue';
import XWindow from './window.vue';

export default defineComponent({
	components: {
		XDrive,
		XWindow,
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

	data() {
		return {
			selected: []
		};
	},

	methods: {
		ok() {
			this.$emit('selected', this.selected);
			this.$refs.window.close();
		},

		onChangeSelection(xs) {
			this.selected = xs;
		}
	}
});
</script>
