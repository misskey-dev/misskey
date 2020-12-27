<template>
<FormBase>
	<FormGroup>
		<template #label>{{ $ts.defaultNavigationBehaviour }}</template>
		<FormSwitch v-model:value="navWindow">{{ $ts.openInWindow }}</FormSwitch>
	</FormGroup>

	<FormSwitch v-model:value="alwaysShowMainColumn">{{ $ts._deck.alwaysShowMainColumn }}</FormSwitch>

	<FormRadios v-model="columnAlign">
		<template #desc>{{ $ts._deck.columnAlign }}</template>
		<option value="left">{{ $ts.left }}</option>
		<option value="center">{{ $ts.center }}</option>
	</FormRadios>

	<FormRadios v-model="columnHeaderHeight">
		<template #desc>{{ $ts._deck.columnHeaderHeight }}</template>
		<option :value="42">{{ $ts.narrow }}</option>
		<option :value="45">{{ $ts.medium }}</option>
		<option :value="48">{{ $ts.wide }}</option>
	</FormRadios>

	<FormInput v-model:value="columnMargin" type="number">
		<span>{{ $ts._deck.columnMargin }}</span>
		<template #suffix>px</template>
	</FormInput>
</FormBase>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faImage, faCog, faColumns } from '@fortawesome/free-solid-svg-icons';
import FormSwitch from '@/components/form/switch.vue';
import FormSelect from '@/components/form/select.vue';
import FormRadios from '@/components/form/radios.vue';
import FormInput from '@/components/form/input.vue';
import FormBase from '@/components/form/base.vue';
import FormGroup from '@/components/form/group.vue';
import { deckStore } from '@/ui/deck/deck-store';
import * as os from '@/os';

export default defineComponent({
	components: {
		FormSwitch,
		FormSelect,
		FormInput,
		FormRadios,
		FormBase,
		FormGroup,
	},

	emits: ['info'],

	data() {
		return {
			INFO: {
				title: this.$ts.deck,
				icon: faColumns
			},
			faImage, faCog,
		}
	},

	computed: {
		navWindow: deckStore.makeGetterSetter('navWindow'),
		alwaysShowMainColumn: deckStore.makeGetterSetter('alwaysShowMainColumn'),
		columnAlign: deckStore.makeGetterSetter('columnAlign'),
		columnMargin: deckStore.makeGetterSetter('columnMargin'),
		columnHeaderHeight: deckStore.makeGetterSetter('columnHeaderHeight'),
	},

	watch: {
		async navWindow() {
			const { canceled } = await os.dialog({
				type: 'info',
				text: this.$ts.reloadToApplySetting,
				showCancelButton: true
			});
			if (canceled) return;

			location.reload();
		}
	},

	mounted() {
		this.$emit('info', this.INFO);
	},
});
</script>
