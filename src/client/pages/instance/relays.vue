<template>
<FormBase class="relaycxt">
	<FormButton @click="addRelay" primary><i class="fas fa-plus"></i> {{ $ts.addRelay }}</FormButton>

	<div class="_debobigegoItem" v-for="relay in relays" :key="relay.inbox">
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
import MkButton from '@client/components/ui/button.vue';
import MkInput from '@client/components/form/input.vue';
import FormBase from '@client/components/debobigego/base.vue';
import FormButton from '@client/components/debobigego/button.vue';
import * as os from '@client/os';
import * as symbols from '@client/symbols';

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
			const { canceled, result: inbox } = await os.dialog({
				title: this.$ts.addRelay,
				input: {
					placeholder: this.$ts.inboxUrl
				}
			});
			if (canceled) return;
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

</style>
