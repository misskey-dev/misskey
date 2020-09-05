<template>
<section class="_card">
	<div class="_title"><fa :icon="faListUl"/> {{ $t('sidebar') }}</div>
	<div class="_content">
		<mk-textarea v-model:value="items" tall>
			<span>{{ $t('sidebar') }}</span>
			<template #desc><button class="_textButton" @click="addItem">{{ $t('addItem') }}</button></template>
		</mk-textarea>
	</div>
	<div class="_content">
		<div>{{ $t('display') }}</div>
		<mk-radio v-model:value="sidebarDisplay" value="full">{{ $t('_sidebar.full') }}</mk-radio>
		<mk-radio v-model:value="sidebarDisplay" value="icon">{{ $t('_sidebar.icon') }}</mk-radio>
		<!-- <mk-radio v-model:value="sidebarDisplay" value="hide" disabled>{{ $t('_sidebar.hide') }}</mk-radio>--> <!-- TODO: サイドバーを完全に隠せるようにすると、別途ハンバーガーボタンのようなものをUIに表示する必要があり面倒 -->
	</div>
	<div class="_footer">
		<mk-button inline @click="save()" primary><fa :icon="faSave"/> {{ $t('save') }}</mk-button>
		<mk-button inline @click="reset()"><fa :icon="faRedo"/> {{ $t('default') }}</mk-button>
	</div>
</section>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faListUl, faSave, faRedo } from '@fortawesome/free-solid-svg-icons';
import MkButton from '../../components/ui/button.vue';
import MkTextarea from '../../components/ui/textarea.vue';
import MkRadio from '../../components/ui/radio.vue';
import { defaultDeviceUserSettings } from '../../store';

export default defineComponent({
	components: {
		MkButton,
		MkTextarea,
		MkRadio,
	},
	
	data() {
		return {
			menuDef: this.$store.getters.nav({}),
			items: '',
			faListUl, faSave, faRedo
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

	methods: {
		async addItem() {
			const menu = Object.keys(this.menuDef).filter(k => !this.$store.state.deviceUser.menu.includes(k));
			const { canceled, result: item } = await this.$root.showDialog({
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
