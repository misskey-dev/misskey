<template>
<FormBase>
	<FormTextarea v-model:value="items" tall>
		<span>{{ $ts.sidebar }}</span>
		<template #desc><button class="_textButton" @click="addItem">{{ $ts.addItem }}</button></template>
	</FormTextarea>

	<FormRadios v-model="sidebarDisplay">
		<template #desc>{{ $ts.display }}</template>
		<option value="full">{{ $ts._sidebar.full }}</option>
		<option value="icon">{{ $ts._sidebar.icon }}</option>
		<!-- <MkRadio v-model="sidebarDisplay" value="hide" disabled>{{ $ts._sidebar.hide }}</MkRadio>--> <!-- TODO: サイドバーを完全に隠せるようにすると、別途ハンバーガーボタンのようなものをUIに表示する必要があり面倒 -->
	</FormRadios>

	<FormButton @click="save()" primary><Fa :icon="faSave"/> {{ $ts.save }}</FormButton>
	<FormButton @click="reset()" danger><Fa :icon="faRedo"/> {{ $ts.default }}</FormButton>
</FormBase>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faListUl, faSave, faRedo } from '@fortawesome/free-solid-svg-icons';
import FormSwitch from '@client/components/form/switch.vue';
import FormTextarea from '@client/components/form/textarea.vue';
import FormRadios from '@client/components/form/radios.vue';
import FormBase from '@client/components/form/base.vue';
import FormGroup from '@client/components/form/group.vue';
import FormButton from '@client/components/form/button.vue';
import * as os from '@client/os';
import { sidebarDef } from '@client/sidebar';
import { defaultStore } from '@client/store';
import * as symbols from '@client/symbols';

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
				title: this.$ts.sidebar,
				icon: faListUl
			},
			menuDef: sidebarDef,
			items: '',
			faSave, faRedo
		}
	},

	computed: {
		splited(): string[] {
			return this.items.trim().split('\n').filter(x => x.trim() !== '');
		},

		sidebarDisplay: defaultStore.makeGetterSetter('sidebarDisplay')
	},

	created() {
		this.items = this.$store.state.menu.join('\n');
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
			this.save();
		},

		save() {
			this.$store.set('menu', this.splited);
			this.reloadAsk();
		},

		reset() {
			this.$store.reset('menu');
			this.items = this.$store.state.menu.join('\n');
			this.reloadAsk();
		},

		async reloadAsk() {
			const { canceled } = await os.dialog({
				type: 'info',
				text: this.$ts.reloadToApplySetting,
				showCancelButton: true
			});
			if (canceled) return;

			location.reload();
		}
	},
});
</script>
