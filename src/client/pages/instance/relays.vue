<template>
<div class="relaycxt">
	<section class="_section add">
		<div class="_title"><i class="fas fa-plus"></i> {{ $ts.addRelay }}</div>
		<div class="_content">
			<MkInput v-model:value="inbox">
				<span>{{ $ts.inboxUrl }}</span>
			</MkInput>
			<MkButton @click="add(inbox)" primary><i class="fas fa-plus"></i> {{ $ts.add }}</MkButton>
		</div>
	</section>

	<section class="_section relays">
		<div class="_title"><i class="fas fa-project-diagram"></i> {{ $ts.addedRelays }}</div>
		<div class="_content relay" v-for="relay in relays" :key="relay.inbox">
			<div>{{ relay.inbox }}</div>
			<div>{{ $t(`_relayStatus.${relay.status}`) }}</div>
			<MkButton class="button" inline @click="remove(relay.inbox)"><i class="fas fa-trash-alt"></i> {{ $ts.remove }}</MkButton>
		</div>
	</section>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import MkButton from '@client/components/ui/button.vue';
import MkInput from '@client/components/ui/input.vue';
import * as os from '@client/os';
import * as symbols from '@client/symbols';

export default defineComponent({
	components: {
		MkButton,
		MkInput,
	},

	data() {
		return {
			[symbols.PAGE_INFO]: {
				title: this.$ts.relays,
				icon: 'fas fa-project-diagram',
			},
			relays: [],
			inbox: '',
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
