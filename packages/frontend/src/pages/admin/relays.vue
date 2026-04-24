<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader :actions="headerActions" :tabs="headerTabs">
	<div class="_spacer" style="--MI_SPACER-w: 800px;">
		<SearchMarker path="/admin/relays" :label="i18n.ts.relays" :keywords="['relays']" icon="ti ti-planet">
			<div class="_gaps">
				<div v-for="relay in relays" :key="relay.inbox" class="relaycxt _panel" style="padding: 16px;">
					<div>{{ relay.inbox }}</div>
					<div style="margin: 8px 0;">
						<i v-if="relay.status === 'accepted'" class="ti ti-check" :class="$style.icon" style="color: var(--MI_THEME-success);"></i>
						<i v-else-if="relay.status === 'rejected'" class="ti ti-ban" :class="$style.icon" style="color: var(--MI_THEME-error);"></i>
						<i v-else class="ti ti-clock" :class="$style.icon"></i>
						<span>{{ i18n.ts._relayStatus[relay.status] }}</span>
					</div>
					<MkButton class="button" inline danger @click="remove(relay.inbox)"><i class="ti ti-trash"></i> {{ i18n.ts.remove }}</MkButton>
				</div>
			</div>
		</SearchMarker>
	</div>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';
import * as Misskey from 'misskey-js';
import MkButton from '@/components/MkButton.vue';
import * as os from '@/os.js';
import { misskeyApi } from '@/utility/misskey-api.js';
import { i18n } from '@/i18n.js';
import { definePage } from '@/page.js';

const relays = ref<Misskey.entities.AdminRelaysListResponse>([]);

async function addRelay() {
	const { canceled, result: inbox } = await os.inputText({
		title: i18n.ts.addRelay,
		type: 'url',
		placeholder: i18n.ts.inboxUrl,
	});
	if (canceled || inbox == null) return;
	misskeyApi('admin/relays/add', {
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

function remove(inbox: string) {
	misskeyApi('admin/relays/remove', {
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
	misskeyApi('admin/relays/list').then(relayList => {
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

definePage(() => ({
	title: i18n.ts.relays,
	icon: 'ti ti-planet',
}));
</script>

<style lang="scss" module>
.icon {
	width: 1em;
	margin-right: 0.75em;
}
</style>
