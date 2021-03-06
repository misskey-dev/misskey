<template>
<XModalWindow ref="dialog"
	:width="800"
	:height="500"
	:with-ok-button="true"
	:ok-button-disabled="(type === 'file') && (selected.length === 0)"
	@click="cancel()"
	@close="cancel()"
	@ok="ok()"
	@closed="$emit('closed')"
>
	<template #header>
		{{ multiple ? ((type === 'file') ? $ts.selectFiles : $ts.selectFolders) : ((type === 'file') ? $ts.selectFile : $ts.selectFolder) }}
		<span v-if="selected.length > 0" style="margin-left: 8px; opacity: 0.5;">({{ number(selected.length) }})</span>
	</template>
	<XDrive :multiple="multiple" @changeSelection="onChangeSelection" @selected="ok()" :select="type"/>
</XModalWindow>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import XDrive from './drive.vue';
import XModalWindow from '@/components/ui/modal-window.vue';
import number from '@/filters/number';

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

	emits: ['done', 'closed'],

	data() {
		return {
			selected: []
		};
	},

	methods: {
		ok() {
			this.$emit('done', this.selected);
			this.$refs.dialog.close();
		},

		cancel() {
			this.$emit('done');
			this.$refs.dialog.close();
		},

		onChangeSelection(xs) {
			this.selected = xs;
		},

		number
	}
});
</script>
