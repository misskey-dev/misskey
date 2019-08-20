<template>
<x-container @remove="() => $emit('remove')" :draggable="true">
	<template #header><fa :icon="faQuestion"/> {{ $t('blocks.if') }}</template>
	<template #func>
		<button @click="add()">
			<fa :icon="faPlus"/>
		</button>
	</template>

	<section class="romcojzs">
		<ui-select v-model="value.var">
			<template #label>{{ $t('blocks._if.variable') }}</template>
			<option v-for="v in aiScript.getVarsByType('boolean')" :value="v.name">{{ v.name }}</option>
			<optgroup :label="$t('script.pageVariables')">
				<option v-for="v in aiScript.getPageVarsByType('boolean')" :value="v">{{ v }}</option>
			</optgroup>
			<optgroup :label="$t('script.enviromentVariables')">
				<option v-for="v in aiScript.getEnvVarsByType('boolean')" :value="v">{{ v }}</option>
			</optgroup>
		</ui-select>

		<x-blocks class="children" v-model="value.children" :ai-script="aiScript"/>
	</section>
</x-container>
</template>

<script lang="ts">
import Vue from 'vue';
import { v4 as uuid } from 'uuid';
import { faPlus, faQuestion } from '@fortawesome/free-solid-svg-icons';
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
			faPlus, faQuestion
		};
	},

	beforeCreate() {
		this.$options.components.XBlocks = require('../page-editor.blocks.vue').default
	},

	created() {
		if (this.value.children == null) Vue.set(this.value, 'children', []);
		if (this.value.var === undefined) Vue.set(this.value, 'var', null);
	},

	methods: {
		async add() {
			const { canceled, result: type } = await this.$root.dialog({
				type: null,
				title: this.$t('choose-block'),
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

<style lang="stylus" scoped>
.romcojzs
	padding 0 16px 16px 16px

</style>
