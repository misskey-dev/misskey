<template>
<!-- eslint-disable vue/no-mutating-props -->
<XContainer :draggable="true" @remove="() => $emit('remove')">
	<template #header><i class="fas fa-sticky-note"></i> {{ value.title }}</template>
	<template #func>
		<button class="_button" @click="rename()">
			<i class="fas fa-pencil-alt"></i>
		</button>
		<button class="_button" @click="add()">
			<i class="fas fa-plus"></i>
		</button>
	</template>

	<section class="ilrvjyvi">
		<XBlocks v-model="value.children" class="children" :hpml="hpml"/>
	</section>
</XContainer>
</template>

<script lang="ts">
/* eslint-disable vue/no-mutating-props */
import { defineComponent, defineAsyncComponent } from 'vue';
import { v4 as uuid } from 'uuid';
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
			const { canceled, result: title } = await os.inputText({
				title: 'Enter title',
				default: this.value.title
			});
			if (canceled) return;
			this.value.title = title;
		},

		async add() {
			const { canceled, result: type } = await os.select({
				title: this.$ts._pages.chooseBlock,
				groupedItems: this.getPageBlockList()
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
