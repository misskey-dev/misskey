<template>
<x-container @remove="() => $emit('remove')" :draggable="true">
	<template #header><fa :icon="faStickyNote"/> {{ value.title }}</template>
	<template #func>
		<button @click="rename()" class="_button">
			<fa :icon="faPencilAlt"/>
		</button>
		<button @click="add()" class="_button">
			<fa :icon="faPlus"/>
		</button>
	</template>

	<section class="ilrvjyvi">
		<x-blocks class="children" v-model="value.children" :hpml="hpml"/>
	</section>
</x-container>
</template>

<script lang="ts">
import Vue from 'vue';
import { v4 as uuid } from 'uuid';
import { faPlus, faPencilAlt } from '@fortawesome/free-solid-svg-icons';
import { faStickyNote } from '@fortawesome/free-regular-svg-icons';
import XContainer from '../page-editor.container.vue';

export default Vue.extend({
	components: {
		XContainer
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

	beforeCreate() {
		this.$options.components.XBlocks = require('../page-editor.blocks.vue').default
	},

	created() {
		if (this.value.title == null) Vue.set(this.value, 'title', null);
		if (this.value.children == null) Vue.set(this.value, 'children', []);
	},

	mounted() {
		if (this.value.title == null) {
			this.rename();
		}
	},

	methods: {
		async rename() {
			const { canceled, result: title } = await this.$root.dialog({
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
			const { canceled, result: type } = await this.$root.dialog({
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
