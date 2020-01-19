<template>
<x-window ref="window" @closed="() => { $emit('closed'); destroyDom(); }" :with-ok-button="true" :ok-button-disabled="selected.length === 0" @ok="ok()">
	<template #header>{{ multiple ? $t('selectFiles') : $t('selectFile') }}<span v-if="selected.length > 0" style="margin-left: 8px; opacity: 0.5;">({{ selected.length | number }})</span></template>
	<div>
		<x-drive :multiple="multiple" @change-selection="onChangeSelection" :select-mode="true"/>
	</div>
</x-window>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../i18n';
import XDrive from './drive.vue';
import XWindow from './window.vue';

export default Vue.extend({
	i18n,

	components: {
		XDrive,
		XWindow,
	},

	props: {
		type: {
			type: String,
			required: false,
			default: undefined 
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

		onChangeSelection(files) {
			this.selected = files;
		}
	}
});
</script>
