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
import FormSwitch from '@/components/form/switch.vue';
import FormTextarea from '@/components/form/textarea.vue';
import FormRadios from '@/components/form/radios.vue';
import FormBase from '@/components/form/base.vue';
import FormGroup from '@/components/form/group.vue';
import FormButton from '@/components/form/button.vue';
import * as os from '@/os';
import { sidebarDef } from '@/sidebar';
import { defaultStore } from '@/store';

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
			INFO: {
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
		this.$emit('info', this.INFO);
	},

	methods: {
		async addItem() {
			const menu = Object.keys(this.menuDef).filter(k => !this.$store.state.menu.includes(k));
			const { canceled, result: item } = await os.dialog({
				type: null,
				title: this.$ts.addItem,
				select: {
					items: [...menu.map(k => ({
						value: k, text: this.$t(this.menuDef[k].title)
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
		},

		reset() {
			this.$store.reset('menu');
			this.items = this.$store.state.menu.join('\n');
		},
	},
});
</script>
