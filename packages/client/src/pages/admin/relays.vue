<template>
<FormBase class="relaycxt">
	<FormButton primary @click="addRelay"><i class="fas fa-plus"></i> {{ $ts.addRelay }}</FormButton>

	<div v-for="relay in relays" :key="relay.inbox" class="_debobigegoItem">
		<div class="_debobigegoPanel" style="padding: 16px;">
			<div>{{ relay.inbox }}</div>
			<div>{{ $t(`_relayStatus.${relay.status}`) }}</div>
			<MkButton class="button" inline danger @click="remove(relay.inbox)"><i class="fas fa-trash-alt"></i> {{ $ts.remove }}</MkButton>
		</div>
	</div>
</FormBase>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import MkButton from '@/components/ui/button.vue';
import MkInput from '@/components/form/input.vue';
import FormBase from '@/components/debobigego/base.vue';
import FormButton from '@/components/debobigego/button.vue';
import * as os from '@/os';
import * as symbols from '@/symbols';

export default defineComponent({
	components: {
		FormBase,
		FormButton,
		MkButton,
		MkInput,
	},

	emits: ['info'],

	data() {
		return {
			[symbols.PAGE_INFO]: {
				title: this.$ts.relays,
				icon: 'fas fa-globe',
				bg: 'var(--bg)',
			},
			relays: [],
			inbox: '',
		}
	},

	created() {
		this.refresh();
	},

	mounted() {
		this.$emit('info', this[symbols.PAGE_INFO]);
	},

	methods: {
		async addRelay() {
			const { canceled, result: inbox } = await os.inputText({
				title: this.$ts.addRelay,
				type: 'url',
				placeholder: this.$ts.inboxUrl
			});
			if (canceled) return;
			os.api('admin/relays/add', {
				inbox
			}).then((relay: any) => {
				this.refresh();
			}).catch((e: any) => {
				os.alert({
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
				os.alert({
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

</style>
