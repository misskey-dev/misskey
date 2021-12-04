<template>
<!-- eslint-disable vue/no-mutating-props -->
<XContainer :draggable="true" @remove="() => $emit('remove')">
	<template #header><i class="fas fa-sticky-note"></i> {{ $ts._pages.blocks.note }}</template>

	<section style="padding: 0 16px 0 16px;">
		<MkInput v-model="id">
			<template #label>{{ $ts._pages.blocks._note.id }}</template>
			<template #caption>{{ $ts._pages.blocks._note.idDescription }}</template>
		</MkInput>
		<MkSwitch v-model="value.detailed"><span>{{ $ts._pages.blocks._note.detailed }}</span></MkSwitch>

		<XNote v-if="note && !value.detailed" :key="note.id + ':normal'" v-model:note="note" style="margin-bottom: 16px;"/>
		<XNoteDetailed v-if="note && value.detailed" :key="note.id + ':detail'" v-model:note="note" style="margin-bottom: 16px;"/>
	</section>
</XContainer>
</template>

<script lang="ts">
/* eslint-disable vue/no-mutating-props */
import { defineComponent } from 'vue';
import XContainer from '../page-editor.container.vue';
import MkInput from '@/components/form/input.vue';
import MkSwitch from '@/components/form/switch.vue';
import XNote from '@/components/note.vue';
import XNoteDetailed from '@/components/note-detailed.vue';
import * as os from '@/os';

export default defineComponent({
	components: {
		XContainer, MkInput, MkSwitch, XNote, XNoteDetailed,
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
