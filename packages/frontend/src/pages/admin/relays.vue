<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkStickyContainer>
	<template #header><XHeader :actions="headerActions" :tabs="headerTabs"/></template>
	<MkSpacer :contentMax="800">
		<div class="_gaps">
			<div v-for="relay in relays" :key="relay.inbox" class="relaycxt _panel" style="padding: 16px;">
				<div>{{ relay.inbox }}</div>
				<div style="margin: 8px 0;">
					<i v-if="relay.status === 'accepted'" class="ti ti-check" :class="$style.icon" style="color: var(--success);"></i>
					<i v-else-if="relay.status === 'rejected'" class="ti ti-ban" :class="$style.icon" style="color: var(--error);"></i>
					<i v-else class="ti ti-clock" :class="$style.icon"></i>
					<span>{{ i18n.t(`_relayStatus.${relay.status}`) }}</span>
				</div>
				<MkButton class="button" inline danger @click="remove(relay.inbox)"><i class="ti ti-trash"></i> {{ i18n.ts.remove }}</MkButton>
			</div>
		</div>
	</MkSpacer>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';
import XHeader from './_header_.vue';
import MkButton from '@/components/MkButton.vue';
import * as os from '@/os.js';
import { i18n } from '@/i18n.js';
import { definePageMetadata } from '@/scripts/page-metadata.js';

const relays = ref<any[]>([]);

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
		relays.value = relayList;
	});
}

refresh();

const headerActions = computed(() => [{
	asFullButton: true,
	icon: 'ti ti-plus',
	text: i18n.ts.addRelay,
	handler: addRelay,
}]);

const headerTabs = computed(() => []);

definePageMetadata({
	title: i18n.ts.relays,
	icon: 'ti ti-planet',
});
</script>

<style lang="scss" module>
.icon {
	width: 1em;
	margin-right: 0.75em;
}
</style>
