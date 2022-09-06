<template>
<MkStickyContainer>
	<template #header><XHeader :actions="headerActions" :tabs="headerTabs"/></template>
	<MkSpacer :content-max="800">
		<div v-for="relay in relays" :key="relay.inbox" class="relaycxt _panel _block" style="padding: 16px;">
			<div>{{ relay.inbox }}</div>
			<div class="status">
				<i v-if="relay.status === 'accepted'" class="fas fa-check icon accepted"></i>
				<i v-else-if="relay.status === 'rejected'" class="fas fa-ban icon rejected"></i>
				<i v-else class="fas fa-clock icon requesting"></i>
				<span>{{ $t(`_relayStatus.${relay.status}`) }}</span>
			</div>
			<MkButton class="button" inline danger @click="remove(relay.inbox)"><i class="fas fa-trash-alt"></i> {{ i18n.ts.remove }}</MkButton>
		</div>
	</MkSpacer>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import { } from 'vue';
import XHeader from './_header_.vue';
import MkButton from '@/components/MkButton.vue';
import * as os from '@/os';
import { i18n } from '@/i18n';
import { definePageMetadata } from '@/scripts/page-metadata';

let relays: any[] = $ref([]);

async function addRelay() {
	const { canceled, result: inbox } = await os.inputText({
		title: i18n.ts.addRelay,
		type: 'url',
		placeholder: i18n.ts.inboxUrl,
	});
	if (canceled) return;
	os.api('admin/relays/add', {
		inbox,
	}).then((relay: any) => {
		refresh();
	}).catch((err: any) => {
		os.alert({
			type: 'error',
			text: err.message || err,
		});
	});
}

function remove(inbox: string) {
	os.api('admin/relays/remove', {
		inbox,
	}).then(() => {
		refresh();
	}).catch((err: any) => {
		os.alert({
			type: 'error',
			text: err.message || err,
		});
	});
}

function refresh() {
	os.api('admin/relays/list').then((relayList: any) => {
		relays = relayList;
	});
}

refresh();

const headerActions = $computed(() => [{
	asFullButton: true,
	icon: 'fas fa-plus',
	text: i18n.ts.addRelay,
	handler: addRelay,
}]);

const headerTabs = $computed(() => []);

definePageMetadata({
	title: i18n.ts.relays,
	icon: 'fas fa-globe',
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
