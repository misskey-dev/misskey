<template>
<div>
	<ui-card>
		<template #title><fa icon="plus"/> {{ $t('add-relay') }}</template>
		<section class="fit-top">
			<ui-horizon-group inputs>
				<ui-input v-model="inbox">
					<span>{{ $t('inbox') }}</span>
				</ui-input>
			</ui-horizon-group>
			<ui-button @click="add(inbox)">{{ $t('add') }}</ui-button>
		</section>
	</ui-card>

	<ui-card>
		<template #title><fa :icon="faProjectDiagram"/> {{ $t('added-relays') }}</template>
		<section v-for="relay in relays" :key="relay.inbox" class="relayath">
			<div>{{ relay.inbox }}</div>
			<div>{{ $t(`status.${relay.status}`) }}</div>
			<ui-button @click="remove(relay.inbox)">{{ $t('remove') }}</ui-button>
		</section>
	</ui-card>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../i18n';
import { faProjectDiagram } from '@fortawesome/free-solid-svg-icons';

export default Vue.extend({
	i18n: i18n('admin/views/relay.vue'),
	data() {
		return {
			relays: [],
			inbox: '',
			faProjectDiagram
		};
	},

	created() {
		this.reload();
	},

	computed: {
	},

	methods: {
		add(inbox: string) {
			this.$root.api('admin/relays/add', {
				inbox
			}).then((relay: any) => {
				this.inbox = '';
				this.reload();
			}).catch((e: any) => {
				this.$root.dialog({
					type: 'error',
					text: e.message || e
				});
			});
		},

		remove(inbox: string) {
			this.$root.api('admin/relays/remove', {
				inbox
			}).then(() => {
				this.reload();
			}).catch((e: any) => {
				this.$root.dialog({
					type: 'error',
					text: e.message || e
				});
			});
		},

		reload() {
			this.$root.api('admin/relays/list').then((relays: any) => {
				this.relays = relays;
			});
		}
	}
});
</script>

<style lang="stylus" scoped>
.relayath
	> div
		margin 0.3em
</style>
