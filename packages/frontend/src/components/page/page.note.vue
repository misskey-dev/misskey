<template>
<div class="voxdxuby">
	<MkNote v-if="note && !block.detailed" :key="note.id + ':normal'" v-model:note="note"/>
	<MkNoteDetailed v-if="note && block.detailed" :key="note.id + ':detail'" v-model:note="note"/>
</div>
</template>

<script lang="ts">
import { defineComponent, onMounted, PropType, Ref, ref } from 'vue';
import MkNote from '@/components/MkNote.vue';
import MkNoteDetailed from '@/components/MkNoteDetailed.vue';
import * as os from '@/os';
import { NoteBlock } from '@/scripts/hpml/block';

export default defineComponent({
	components: {
		MkNote,
		MkNoteDetailed,
	},
	props: {
		block: {
			type: Object as PropType<NoteBlock>,
			required: true,
		},
	},
	setup(props, ctx) {
		const note: Ref<Record<string, any> | null> = ref(null);

		onMounted(() => {
			os.api('notes/show', { noteId: props.block.note })
			.then(result => {
				note.value = result;
			});
		});

		return {
			note,
		};
	},
});
</script>

<style lang="scss" scoped>
.voxdxuby {
	margin: 1em 0;
}
</style>
