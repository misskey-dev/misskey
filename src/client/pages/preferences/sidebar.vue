<template>
<section class="_card">
	<div class="_title"><fa :icon="faListUl"/> {{ $t('sidebar') }}</div>
	<div class="_content">
		<mk-textarea v-model="items" tall>
			<span>{{ $t('sidebar') }}</span>
			<template #desc><button class="_textButton" @click="addItem">{{ $t('addItem') }}</button></template>
		</mk-textarea>
	</div>
	<div class="_footer">
		<mk-button inline @click="save()" primary><fa :icon="faSave"/> {{ $t('save') }}</mk-button>
		<mk-button inline @click="reset()"><fa :icon="faRedo"/> {{ $t('default') }}</mk-button>
	</div>
</section>
</template>

<script lang="ts">
import Vue from 'vue';
import { faListUl, faSave, faRedo } from '@fortawesome/free-solid-svg-icons';
import MkButton from '../../components/ui/button.vue';
import MkTextarea from '../../components/ui/textarea.vue';
import i18n from '../../i18n';
import { defaultDeviceUserSettings } from '../../store';
import { createMenuDef } from '../../app';

export default Vue.extend({
	i18n,

	components: {
		MkButton,
		MkTextarea,
	},
	
	data() {
		return {
			menuDef: createMenuDef({}),
			items: '',
			faListUl, faSave, faRedo
		}
	},

	computed: {
		splited(): string[] {
			return this.items.trim().split('\n').filter(x => x.trim() !== '');
		}
	},

	created() {
		this.items = this.$store.state.deviceUser.menu.join('\n');
	},

	methods: {
		async addItem() {
			const menu = Object.keys(this.menuDef).filter(k => !this.$store.state.deviceUser.menu.includes(k));
			const { canceled, result: item } = await this.$root.dialog({
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
