<template>
<div class="_formRoot">
	<FormTextarea v-model="items" tall manual-save class="_formBlock">
		<template #label>{{ $ts.menu }}</template>
		<template #caption><button class="_textButton" @click="addItem">{{ $ts.addItem }}</button></template>
	</FormTextarea>

	<FormRadios v-model="menuDisplay" class="_formBlock">
		<template #label>{{ $ts.display }}</template>
		<option value="sideFull">{{ $ts._menuDisplay.sideFull }}</option>
		<option value="sideIcon">{{ $ts._menuDisplay.sideIcon }}</option>
		<option value="top">{{ $ts._menuDisplay.top }}</option>
		<!-- <MkRadio v-model="menuDisplay" value="hide" disabled>{{ $ts._menuDisplay.hide }}</MkRadio>--> <!-- TODO: サイドバーを完全に隠せるようにすると、別途ハンバーガーボタンのようなものをUIに表示する必要があり面倒 -->
	</FormRadios>

	<FormButton danger class="_formBlock" @click="reset()"><i class="fas fa-redo"></i> {{ $ts.default }}</FormButton>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import FormTextarea from '@/components/form/textarea.vue';
import FormRadios from '@/components/form/radios.vue';
import FormBase from '@/components/debobigego/base.vue';
import FormButton from '@/components/ui/button.vue';
import * as os from '@/os';
import { menuDef } from '@/menu';
import { defaultStore } from '@/store';
import * as symbols from '@/symbols';
import { unisonReload } from '@/scripts/unison-reload';

export default defineComponent({
	components: {
		FormBase,
		FormButton,
		FormTextarea,
		FormRadios,
	},

	emits: ['info'],
	
	data() {
		return {
			[symbols.PAGE_INFO]: {
				title: this.$ts.menu,
				icon: 'fas fa-list-ul',
				bg: 'var(--bg)',
			},
			menuDef: menuDef,
			items: defaultStore.state.menu.join('\n'),
		}
	},

	computed: {
		splited(): string[] {
			return this.items.trim().split('\n').filter(x => x.trim() !== '');
		},

		menuDisplay: defaultStore.makeGetterSetter('menuDisplay')
	},

	watch: {
		menuDisplay() {
			this.reloadAsk();
		},

		items() {
			this.save();
		},
	},

	mounted() {
		this.$emit('info', this[symbols.PAGE_INFO]);
	},

	methods: {
		async addItem() {
			const menu = Object.keys(this.menuDef).filter(k => !this.$store.state.menu.includes(k));
			const { canceled, result: item } = await os.select({
				title: this.$ts.addItem,
				items: [...menu.map(k => ({
					value: k, text: this.$ts[this.menuDef[k].title]
				})), ...[{
					value: '-', text: this.$ts.divider
				}]]
			});
			if (canceled) return;
			this.items = [...this.splited, item].join('\n');
		},

		save() {
			this.$store.set('menu', this.splited);
			this.reloadAsk();
		},

		reset() {
			this.$store.reset('menu');
			this.items = this.$store.state.menu.join('\n');
		},

		async reloadAsk() {
			const { canceled } = await os.confirm({
				type: 'info',
				text: this.$ts.reloadToApplySetting,
				showCancelButton: true
			});
			if (canceled) return;

			unisonReload();
		}
	},
});
</script>
