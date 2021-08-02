<template>
<FormBase>
	<FormTextarea v-model:value="items" tall manual-save>
		<span>{{ $ts.menu }}</span>
		<template #desc><button class="_textButton" @click="addItem">{{ $ts.addItem }}</button></template>
	</FormTextarea>

	<FormRadios v-model="menuDisplay">
		<template #desc>{{ $ts.display }}</template>
		<option value="sideFull">{{ $ts._menuDisplay.sideFull }}</option>
		<option value="sideIcon">{{ $ts._menuDisplay.sideIcon }}</option>
		<option value="top">{{ $ts._menuDisplay.top }}</option>
		<!-- <MkRadio v-model="menuDisplay" value="hide" disabled>{{ $ts._menuDisplay.hide }}</MkRadio>--> <!-- TODO: サイドバーを完全に隠せるようにすると、別途ハンバーガーボタンのようなものをUIに表示する必要があり面倒 -->
	</FormRadios>

	<FormButton @click="reset()" danger><i class="fas fa-redo"></i> {{ $ts.default }}</FormButton>
</FormBase>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import FormSwitch from '@client/components/form/switch.vue';
import FormTextarea from '@client/components/form/textarea.vue';
import FormRadios from '@client/components/form/radios.vue';
import FormBase from '@client/components/form/base.vue';
import FormGroup from '@client/components/form/group.vue';
import FormButton from '@client/components/form/button.vue';
import * as os from '@client/os';
import { menuDef } from '@client/menu';
import { defaultStore } from '@client/store';
import * as symbols from '@client/symbols';
import { unisonReload } from '@client/scripts/unison-reload';

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
				icon: 'fas fa-list-ul'
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
			const { canceled, result: item } = await os.dialog({
				type: null,
				title: this.$ts.addItem,
				select: {
					items: [...menu.map(k => ({
						value: k, text: this.$ts[this.menuDef[k].title]
					})), ...[{
						value: '-', text: this.$ts.divider
					}]]
				},
				showCancelButton: true
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
			const { canceled } = await os.dialog({
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
