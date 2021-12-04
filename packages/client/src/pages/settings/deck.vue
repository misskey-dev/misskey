<template>
<FormBase>
	<FormGroup>
		<template #label>{{ $ts.defaultNavigationBehaviour }}</template>
		<FormSwitch v-model="navWindow">{{ $ts.openInWindow }}</FormSwitch>
	</FormGroup>

	<FormSwitch v-model="alwaysShowMainColumn">{{ $ts._deck.alwaysShowMainColumn }}</FormSwitch>

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

	<FormInput v-model="columnMargin" type="number">
		<span>{{ $ts._deck.columnMargin }}</span>
		<template #suffix>px</template>
	</FormInput>

	<FormLink @click="setProfile">{{ $ts._deck.profile }}<template #suffix>{{ profile }}</template></FormLink>
</FormBase>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import FormSwitch from '@/components/debobigego/switch.vue';
import FormLink from '@/components/debobigego/link.vue';
import FormRadios from '@/components/debobigego/radios.vue';
import FormInput from '@/components/debobigego/input.vue';
import FormBase from '@/components/debobigego/base.vue';
import FormGroup from '@/components/debobigego/group.vue';
import { deckStore } from '@/ui/deck/deck-store';
import * as os from '@/os';
import { unisonReload } from '@/scripts/unison-reload';
import * as symbols from '@/symbols';

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
				icon: 'fas fa-columns',
				bg: 'var(--bg)',
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
			const { canceled } = await os.confirm({
				type: 'info',
				text: this.$ts.reloadToApplySetting,
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
			const { canceled, result: name } = await os.inputText({
				title: this.$ts._deck.profile,
				allowEmpty: false
			});
			if (canceled) return;
			this.profile = name;
			unisonReload();
		}
	}
});
</script>
