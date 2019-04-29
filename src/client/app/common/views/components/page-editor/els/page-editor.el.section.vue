<template>
<x-container @remove="() => $emit('remove')">
	<template #header><fa :icon="faStickyNote"/> {{ value.title }}</template>
	<template #func>
		<button @click="rename()">
			<fa :icon="faPencilAlt"/>
		</button>
		<button @click="add()">
			<fa :icon="faPlus"/>
		</button>
	</template>

	<section class="ilrvjyvi">
		<div class="children">
			<x-block v-for="child in value.children" :value="child" @input="v => updateItem(v)" @remove="() => remove(child)" :key="child.id" :ai-script="aiScript"/>
		</div>
	</section>
</x-container>
</template>

<script lang="ts">
import Vue from 'vue';
import * as uuid from 'uuid';
import { faPlus, faPencilAlt } from '@fortawesome/free-solid-svg-icons';
import { faStickyNote } from '@fortawesome/free-regular-svg-icons';
import i18n from '../../../../../i18n';
import XContainer from '../page-editor.container.vue';

export default Vue.extend({
	i18n: i18n('pages'),

	components: {
		XContainer
	},

	inject: ['getPageBlockList'],

	props: {
		value: {
			required: true
		},
		aiScript: {
			required: true,
		},
	},

	data() {
		return {
			faStickyNote, faPlus, faPencilAlt
		};
	},

	beforeCreate() {
		this.$options.components.XBlock = require('../page-editor.block.vue').default
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
				title: this.$t('choose-block'),
				select: {
					items: this.getPageBlockList()
				},
				showCancelButton: true
			});
			if (canceled) return;

			const id = uuid.v4();
			this.value.children.push({ id, type });
		},

		updateItem(v) {
			const i = this.value.children.findIndex(x => x.id === v.id);
			const newValue = [
				...this.value.children.slice(0, i),
				v,
				...this.value.children.slice(i + 1)
			];
			this.value.children = newValue;
			this.$emit('input', this.value);
		},

		remove(el) {
			const i = this.value.children.findIndex(x => x.id === el.id);
			const newValue = [
				...this.value.children.slice(0, i),
				...this.value.children.slice(i + 1)
			];
			this.value.children = newValue;
			this.$emit('input', this.value);
		}
	}
});
</script>

<style lang="stylus" scoped>
.ilrvjyvi
	> .children
		padding 16px

</style>
