<template>
<XContainer @remove="() => $emit('remove')" :draggable="true">
	<template #header><Fa :icon="faStickyNote"/> {{ value.title }}</template>
	<template #func>
		<button @click="rename()" class="_button">
			<Fa :icon="faPencilAlt"/>
		</button>
		<button @click="add()" class="_button">
			<Fa :icon="faPlus"/>
		</button>
	</template>

	<section class="ilrvjyvi">
		<XBlocks class="children" v-model:value="value.children" :hpml="hpml"/>
	</section>
</XContainer>
</template>

<script lang="ts">
import { defineComponent, defineAsyncComponent } from 'vue';
import { v4 as uuid } from 'uuid';
import { faPlus, faPencilAlt } from '@fortawesome/free-solid-svg-icons';
import { faStickyNote } from '@fortawesome/free-regular-svg-icons';
import XContainer from '../page-editor.container.vue';
import * as os from '@/os';

export default defineComponent({
	components: {
		XContainer,
		XBlocks: defineAsyncComponent(() => import('../page-editor.blocks.vue')),
	},

	inject: ['getPageBlockList'],

	props: {
		value: {
			required: true
		},
		hpml: {
			required: true,
		},
	},

	data() {
		return {
			faStickyNote, faPlus, faPencilAlt
		};
	},

	created() {
		if (this.value.title == null) this.value.title = null;
		if (this.value.children == null) this.value.children = [];
	},

	mounted() {
		if (this.value.title == null) {
			this.rename();
		}
	},

	methods: {
		async rename() {
			const { canceled, result: title } = await os.dialog({
				title: 'Enter title',
				input: {
					type: 'text',
					default: this.value.title
				},
				showCancelButton: true
			});
			if (canceled) return;
			this.value.title = title;
		},

		async add() {
			const { canceled, result: type } = await os.dialog({
				type: null,
				title: this.$t('_pages.chooseBlock'),
				select: {
					groupedItems: this.getPageBlockList()
				},
				showCancelButton: true
			});
			if (canceled) return;

			const id = uuid();
			this.value.children.push({ id, type });
		},
	}
});
</script>

<style lang="scss" scoped>
.ilrvjyvi {
	> .children {
		padding: 16px;
	}
}
</style>
