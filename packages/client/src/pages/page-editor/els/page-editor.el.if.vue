<template>
<!-- eslint-disable vue/no-mutating-props -->
<XContainer :draggable="true" @remove="() => $emit('remove')">
	<template #header><i class="fas fa-question"></i> {{ $ts._pages.blocks.if }}</template>
	<template #func>
		<button class="_button" @click="add()">
			<i class="fas fa-plus"></i>
		</button>
	</template>

	<section class="romcojzs">
		<MkSelect v-model="value.var">
			<template #label>{{ $ts._pages.blocks._if.variable }}</template>
			<option v-for="v in hpml.getVarsByType('boolean')" :value="v.name">{{ v.name }}</option>
			<optgroup :label="$ts._pages.script.pageVariables">
				<option v-for="v in hpml.getPageVarsByType('boolean')" :value="v">{{ v }}</option>
			</optgroup>
			<optgroup :label="$ts._pages.script.enviromentVariables">
				<option v-for="v in hpml.getEnvVarsByType('boolean')" :value="v">{{ v }}</option>
			</optgroup>
		</MkSelect>

		<XBlocks v-model="value.children" class="children" :hpml="hpml"/>
	</section>
</XContainer>
</template>

<script lang="ts">
/* eslint-disable vue/no-mutating-props */
import { defineComponent, defineAsyncComponent } from 'vue';
import { v4 as uuid } from 'uuid';
import XContainer from '../page-editor.container.vue';
import MkSelect from '@/components/form/select.vue';
import * as os from '@/os';

export default defineComponent({
	components: {
		XContainer, MkSelect,
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
		if (this.value.children == null) this.value.children = [];
		if (this.value.var === undefined) this.value.var = null;
	},

	methods: {
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
.romcojzs {
	padding: 0 16px 16px 16px;
}
</style>
