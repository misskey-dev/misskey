<template>
<XContainer @remove="() => $emit('remove')" :draggable="true">
	<template #header><Fa :icon="faStickyNote"/> {{ $ts._pages.blocks.note }}</template>

	<section style="padding: 0 16px 0 16px;">
		<MkInput v-model:value="id">
			<span>{{ $ts._pages.blocks._note.id }}</span>
			<template #desc>{{ $ts._pages.blocks._note.idDescription }}</template>
		</MkInput>
		<MkSwitch v-model:value="value.detailed"><span>{{ $ts._pages.blocks._note.detailed }}</span></MkSwitch>

		<XNote v-if="note" v-model:note="note" :key="note.id + ':' + (value.detailed ? 'detailed' : 'normal')" :detail="value.detailed" style="margin-bottom: 16px;"/>
	</section>
</XContainer>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faStickyNote } from '@fortawesome/free-solid-svg-icons';
import XContainer from '../page-editor.container.vue';
import MkInput from '@/components/ui/input.vue';
import MkSwitch from '@/components/ui/switch.vue';
import XNote from '@/components/note.vue';
import * as os from '@/os';

export default defineComponent({
	components: {
		XContainer, MkInput, MkSwitch, XNote
	},

	props: {
		value: {
			required: true
		},
	},

	data() {
		return {
			id: this.value.note,
			note: null,
			faStickyNote
		};
	},

	watch: {
		id: {
			async handler() {
				if (this.id && (this.id.startsWith('http://') || this.id.startsWith('https://'))) {
					this.value.note = this.id.endsWith('/') ? this.id.substr(0, this.id.length - 1).split('/').pop() : this.id.split('/').pop();
				} else {
					this.value.note = this.id;
				}

				this.note = await os.api('notes/show', { noteId: this.value.note });
			},
			immediate: true
		},
	},

	created() {
		if (this.value.note == null) this.value.note = null;
		if (this.value.detailed == null) this.value.detailed = false;
	},
});
</script>
