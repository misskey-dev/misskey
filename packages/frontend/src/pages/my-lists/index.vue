<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkStickyContainer>
	<template #header><MkPageHeader :actions="headerActions" :tabs="headerTabs"/></template>
	<MkSpacer :contentMax="700">
		<div class="_gaps">
			<div v-if="items.length === 0" class="empty">
				<div class="_fullinfo">
					<img :src="infoImageUrl" class="_ghost"/>
					<div>{{ i18n.ts.nothing }}</div>
				</div>
			</div>

			<MkButton primary rounded style="margin: 0 auto;" @click="create"><i class="ti ti-plus"></i> {{ i18n.ts.createList }}</MkButton>

			<div v-if="items.length > 0" class="_gaps">
				<MkA v-for="list in items" :key="list.id" class="_panel" :class="$style.list" :to="`/my/lists/${ list.id }`">
					<div style="margin-bottom: 4px;">{{ list.name }} <span :class="$style.nUsers">({{ i18n.t('nUsers', { n: `${list.userIds.length}/${$i?.policies['userEachUserListsLimit']}` }) }})</span></div>
					<MkAvatars :userIds="list.userIds" :limit="10"/>
				</MkA>
			</div>
		</div>
	</MkSpacer>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import { onActivated, computed } from 'vue';
import MkButton from '@/components/MkButton.vue';
import MkAvatars from '@/components/MkAvatars.vue';
import * as os from '@/os.js';
import { i18n } from '@/i18n.js';
import { definePageMetadata } from '@/scripts/page-metadata.js';
import { userListsCache } from '@/cache';
import { infoImageUrl } from '@/instance.js';
import { $i } from '@/account.js';

const items = computed(() => userListsCache.value.value ?? []);

function fetch() {
	userListsCache.fetch();
}

fetch();

async function create() {
	const { canceled, result: name } = await os.inputText({
		title: i18n.ts.enterListName,
	});
	if (canceled) return;
	await os.apiWithDialog('users/lists/create', { name: name });
	userListsCache.delete();
	fetch();
}

const headerActions = computed(() => [{
	asFullButton: true,
	icon: 'ti ti-refresh',
	text: i18n.ts.reload,
	handler: () => {
		userListsCache.delete();
		fetch();
	},
}]);

const headerTabs = computed(() => []);

definePageMetadata({
	title: i18n.ts.manageLists,
	icon: 'ti ti-list',
});

onActivated(() => {
	fetch();
});
</script>

<style lang="scss" module>
.list {
	display: block;
	padding: 16px;
	border: solid 1px var(--divider);
	border-radius: 6px;
	margin-bottom: 8px;

	&:hover {
		border: solid 1px var(--accent);
		text-decoration: none;
	}
}

.nUsers {
	font-size: .9em;
	opacity: .7;
}
</style>
