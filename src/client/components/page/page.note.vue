<template>
<div class="voxdxuby">
	<XNote v-if="note && !value.detailed" v-model:note="note" :key="note.id + ':normal'"/>
	<XNoteDetailed v-if="note && value.detailed" v-model:note="note" :key="note.id + ':detail'"/>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import XNote from '@/components/note.vue';
import XNoteDetailed from '@/components/note-detailed.vue';
import * as os from '@/os';

export default defineComponent({
	components: {
		XNote,
		XNoteDetailed,
	},
	props: {
		value: {
			required: true
		},
		hpml: {
			required: true
		}
	},
	data() {
		return {
			note: null,
		};
	},
	async mounted() {
		this.note = await os.api('notes/show', { noteId: this.value.note });
	}
});
</script>

<style lang="scss" scoped>
.voxdxuby {
	margin: 1em 0;
}
</style>
