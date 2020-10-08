<template>
<div class="relaycxt">
	<portal to="header"><Fa :icon="faProjectDiagram"/>{{ $t('relays') }}</portal>

	<section class="_section add">
		<div class="_title"><Fa :icon="faPlus"/> {{ $t('addRelay') }}</div>
		<div class="_content">
			<MkInput v-model:value="inbox">
				<span>{{ $t('inboxUrl') }}</span>
			</MkInput>
			<MkButton @click="add(inbox)" primary><Fa :icon="faPlus"/> {{ $t('add') }}</MkButton>
		</div>
	</section>

	<section class="_section relays">
		<div class="_title"><Fa :icon="faProjectDiagram"/> {{ $t('addedRelays') }}</div>
		<div class="_content relay" v-for="relay in relays" :key="relay.inbox">
			<div>{{ relay.inbox }}</div>
			<div>{{ $t(`_relayStatus.${relay.status}`) }}</div>
			<MkButton class="button" inline @click="remove(relay.inbox)"><Fa :icon="faTrashAlt"/> {{ $t('remove') }}</MkButton>
		</div>
	</section>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faPlus, faProjectDiagram } from '@fortawesome/free-solid-svg-icons';
import { faSave, faTrashAlt } from '@fortawesome/free-regular-svg-icons';
import MkButton from '@/components/ui/button.vue';
import MkInput from '@/components/ui/input.vue';
import * as os from '@/os';

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
			os.api('admin/relays/add', {
				inbox
			}).then((relay: any) => {
				this.refresh();
			}).catch((e: any) => {
				os.dialog({
					type: 'error',
					text: e.message || e
				});
			});
		},

		remove(inbox: string) {
			os.api('admin/relays/remove', {
				inbox
			}).then(() => {
				this.refresh();
			}).catch((e: any) => {
				os.dialog({
					type: 'error',
					text: e.message || e
				});
			});
		},

		refresh() {
			os.api('admin/relays/list').then((relays: any) => {
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
