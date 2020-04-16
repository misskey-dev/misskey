<template>
<x-container @remove="() => $emit('remove')" :draggable="true">
	<template #header><fa :icon="faQuestion"/> {{ $t('_pages.blocks.if') }}</template>
	<template #func>
		<button @click="add()">
			<fa :icon="faPlus"/>
		</button>
	</template>

	<section class="romcojzs">
		<mk-select v-model="value.var">
			<template #label>{{ $t('_pages.blocks._if.variable') }}</template>
			<option v-for="v in aoiScript.getVarsByType('boolean')" :value="v.name">{{ v.name }}</option>
			<optgroup :label="$t('_pages.script.pageVariables')">
				<option v-for="v in aoiScript.getPageVarsByType('boolean')" :value="v">{{ v }}</option>
			</optgroup>
			<optgroup :label="$t('_pages.script.enviromentVariables')">
				<option v-for="v in aoiScript.getEnvVarsByType('boolean')" :value="v">{{ v }}</option>
			</optgroup>
		</mk-select>

		<x-blocks class="children" v-model="value.children" :aoi-script="aoiScript"/>
	</section>
</x-container>
</template>

<script lang="ts">
import Vue from 'vue';
import { v4 as uuid } from 'uuid';
import { faPlus, faQuestion } from '@fortawesome/free-solid-svg-icons';
import i18n from '../../../i18n';
import XContainer from '../page-editor.container.vue';
import MkSelect from '../../../components/ui/select.vue';

export default Vue.extend({
	i18n,

	components: {
		XContainer, MkSelect
	},

	inject: ['getPageBlockList'],

	props: {
		value: {
			required: true
		},
		aoiScript: {
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
.romcojzs {
	padding: 0 16px 16px 16px;
}
</style>
