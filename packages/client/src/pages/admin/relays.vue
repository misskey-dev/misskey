<template>
<MkSpacer :content-max="800">
	<div v-for="relay in relays" :key="relay.inbox" class="relaycxt _panel _block" style="padding: 16px;">
		<div>{{ relay.inbox }}</div>
		<div class="status">
			<i v-if="relay.status === 'accepted'" class="fas fa-check icon accepted"></i>
			<i v-else-if="relay.status === 'rejected'" class="fas fa-ban icon rejected"></i>
			<i v-else class="fas fa-clock icon requesting"></i>
			<span>{{ $t(`_relayStatus.${relay.status}`) }}</span>
		</div>
		<MkButton class="button" inline danger @click="remove(relay.inbox)"><i class="fas fa-trash-alt"></i> {{ $ts.remove }}</MkButton>
	</div>
</MkSpacer>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import MkButton from '@/components/ui/button.vue';
import * as os from '@/os';
import * as symbols from '@/symbols';

export default defineComponent({
	components: {
		MkButton,
	},

	emits: ['info'],

	data() {
		return {
			[symbols.PAGE_INFO]: {
				title: this.$ts.relays,
				icon: 'fas fa-globe',
				bg: 'var(--bg)',
				actions: [{
					asFullButton: true,
					icon: 'fas fa-plus',
					text: this.$ts.addRelay,
					handler: this.addRelay,
				}],
			},
			relays: [],
			inbox: '',
		}
	},

	created() {
		this.refresh();
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
.relaycxt {
	> .status {
		margin: 8px 0;

		> .icon {
			width: 1em;
			margin-right: 0.75em;

			&.accepted {
				color: var(--success);
			}

			&.rejected {
				color: var(--error);
			}
		}
	}
}
</style>
