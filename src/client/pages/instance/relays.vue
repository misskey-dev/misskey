<template>
<div class="relaycxt">
	<portal to="icon"><fa :icon="faProjectDiagram"/></portal>
	<portal to="title" v-t="'relays'"></portal>

	<section class="_card add">
		<div class="_title"><fa :icon="faPlus"/> {{ $t('addRelay') }}</div>
		<div class="_content">
			<mk-input v-model="inbox">
				<span v-t="'inboxUrl'"></span>
			</mk-input>
			<mk-button @click="add(inbox)" primary><fa :icon="faPlus"/> {{ $t('add') }}</mk-button>
		</div>
	</section>

	<section class="_card relays">
		<div class="_title"><fa :icon="faProjectDiagram"/> {{ $t('addedRelays') }}</div>
		<div class="_content relay" v-for="relay in relays" :key="relay.inbox">
			<div>{{ relay.inbox }}</div>
			<div>{{ $t(`_relayStatus.${relay.status}`) }}</div>
			<mk-button class="button" inline @click="remove(relay.inbox)"><fa :icon="faTrashAlt"/> {{ $t('remove') }}</mk-button>
		</div>
	</section>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faPlus, faProjectDiagram } from '@fortawesome/free-solid-svg-icons';
import { faSave, faTrashAlt } from '@fortawesome/free-regular-svg-icons';
import MkButton from '../../components/ui/button.vue';
import MkInput from '../../components/ui/input.vue';

export default defineComponent({
	metaInfo() {
		return {
			title: this.$t('relays') as string
		};
	},

	components: {
		MkButton,
		MkInput,
	},

	data() {
		return {
			relays: [],
			inbox: '',
			faPlus, faProjectDiagram, faSave, faTrashAlt
		}
	},

	created() {
		this.refresh();
	},

	methods: {
		add(inbox: string) {
			this.$root.api('admin/relays/add', {
				inbox
			}).then((relay: any) => {
				this.refresh();
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
				this.refresh();
			}).catch((e: any) => {
				this.$root.dialog({
					type: 'error',
					text: e.message || e
				});
			});
		},

		refresh() {
			this.$root.api('admin/relays/list').then((relays: any) => {
				this.relays = relays;
			});
		}
	}
});
</script>

<style lang="scss" scoped>
._content.relay {
	div {
		margin: 0.5em 0;
	}
}
</style>
