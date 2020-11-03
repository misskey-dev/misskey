<template>
<div class="_section">
	<div class="_card">
		<div class="_content">
			<MkTextarea v-model:value="items" tall>
				<span>{{ $t('sidebar') }}</span>
				<template #desc><button class="_textButton" @click="addItem">{{ $t('addItem') }}</button></template>
			</MkTextarea>
		</div>
		<div class="_content">
			<div>{{ $t('display') }}</div>
			<MkRadio v-model="sidebarDisplay" value="full">{{ $t('_sidebar.full') }}</MkRadio>
			<MkRadio v-model="sidebarDisplay" value="icon">{{ $t('_sidebar.icon') }}</MkRadio>
			<!-- <MkRadio v-model="sidebarDisplay" value="hide" disabled>{{ $t('_sidebar.hide') }}</MkRadio>--> <!-- TODO: サイドバーを完全に隠せるようにすると、別途ハンバーガーボタンのようなものをUIに表示する必要があり面倒 -->
		</div>
		<div class="_footer">
			<MkButton inline @click="save()" primary><Fa :icon="faSave"/> {{ $t('save') }}</MkButton>
			<MkButton inline @click="reset()"><Fa :icon="faRedo"/> {{ $t('default') }}</MkButton>
		</div>
	</div>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faListUl, faSave, faRedo } from '@fortawesome/free-solid-svg-icons';
import MkButton from '@/components/ui/button.vue';
import MkTextarea from '@/components/ui/textarea.vue';
import MkRadio from '@/components/ui/radio.vue';
import { defaultDeviceUserSettings } from '@/store';
import * as os from '@/os';
import { sidebarDef } from '@/sidebar';

export default defineComponent({
	components: {
		MkButton,
		MkTextarea,
		MkRadio,
	},

	emits: ['info'],
	
	data() {
		return {
			INFO: {
				title: this.$t('sidebar'),
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

		sidebarDisplay: {
			get() { return this.$store.state.device.sidebarDisplay; },
			set(value) { this.$store.commit('device/set', { key: 'sidebarDisplay', value }); }
		},
	},

	created() {
		this.items = this.$store.state.deviceUser.menu.join('\n');
	},

	mounted() {
		this.$emit('info', this.INFO);
	},

	methods: {
		async addItem() {
			const menu = Object.keys(this.menuDef).filter(k => !this.$store.state.deviceUser.menu.includes(k));
			const { canceled, result: item } = await os.dialog({
				type: null,
				title: this.$t('addItem'),
				select: {
					items: [...menu.map(k => ({
						value: k, text: this.$t(this.menuDef[k].title)
					})), ...[{
						value: '-', text: this.$t('divider')
					}]]
				},
				showCancelButton: true
			});
			if (canceled) return;
			this.items = [...this.splited, item].join('\n');
			this.save();
		},

		save() {
			this.$store.commit('deviceUser/setMenu', this.splited);
		},

		reset() {
			this.$store.commit('deviceUser/setMenu', defaultDeviceUserSettings.menu);
			this.items = this.$store.state.deviceUser.menu.join('\n');
		},
	},
});
</script>

<style lang="scss" scoped>

</style>
