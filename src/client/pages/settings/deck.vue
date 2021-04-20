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

	<FormLink @click="setProfile">{{ $ts._deck.profile }}<template #suffix>{{ profile }}</template></FormLink>
</FormBase>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import FormSwitch from '@client/components/form/switch.vue';
import FormLink from '@client/components/form/link.vue';
import FormRadios from '@client/components/form/radios.vue';
import FormInput from '@client/components/form/input.vue';
import FormBase from '@client/components/form/base.vue';
import FormGroup from '@client/components/form/group.vue';
import { deckStore } from '@client/ui/deck/deck-store';
import * as os from '@client/os';
import { unisonReload } from '@client/scripts/unison-reload';
import * as symbols from '@client/symbols';

export default defineComponent({
	components: {
		FormSwitch,
		FormLink,
		FormInput,
		FormRadios,
		FormBase,
		FormGroup,
	},

	emits: ['info'],

	data() {
		return {
			[symbols.PAGE_INFO]: {
				title: this.$ts.deck,
				icon: 'fas fa-columns'
			},
		}
	},

	computed: {
		navWindow: deckStore.makeGetterSetter('navWindow'),
		alwaysShowMainColumn: deckStore.makeGetterSetter('alwaysShowMainColumn'),
		columnAlign: deckStore.makeGetterSetter('columnAlign'),
		columnMargin: deckStore.makeGetterSetter('columnMargin'),
		columnHeaderHeight: deckStore.makeGetterSetter('columnHeaderHeight'),
		profile: deckStore.makeGetterSetter('profile'),
	},

	watch: {
		async navWindow() {
			const { canceled } = await os.dialog({
				type: 'info',
				text: this.$ts.reloadToApplySetting,
				showCancelButton: true
			});
			if (canceled) return;

			unisonReload();
		}
	},

	mounted() {
		this.$emit('info', this[symbols.PAGE_INFO]);
	},

	methods: {
		async setProfile() {
			const { canceled, result: name } = await os.dialog({
				title: this.$ts._deck.profile,
				input: {
					allowEmpty: false
				}
			});
			if (canceled) return;
			this.profile = name;
			unisonReload();
		}
	}
});
</script>
