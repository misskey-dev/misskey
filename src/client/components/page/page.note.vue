<template>
<div class="voxdxuby">
	<XNote v-if="note" v-model:note="note" :key="note.id" :detail="block.detailed"/>
</div>
</template>

<script lang="ts">
import { defineComponent, onMounted, PropType, Ref, ref } from 'vue';
import XNote from '@/components/note.vue';
import * as os from '@/os';
import { NoteBlock } from '@/scripts/hpml/block';

export default defineComponent({
	components: {
		XNote
	},
	props: {
		block: {
			type: Object as PropType<NoteBlock>,
			required: true
		}
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
				note
			};
	}
});
</script>

<style lang="scss" scoped>
.voxdxuby {
	margin: 1em 0;
}
</style>
