<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader :actions="headerActions" :tabs="headerTabs">
	<div class="_spacer" style="--MI_SPACER-w: 700px;">
		<div class="_gaps">
			<MkTip k="userLists">
				{{ i18n.ts._userLists.tip }}
			</MkTip>

			<MkResult v-if="items.length === 0" type="empty"/>

			<MkButton primary rounded style="margin: 0 auto;" @click="create"><i class="ti ti-plus"></i> {{ i18n.ts.createList }}</MkButton>

			<div v-if="items.length > 0" class="_gaps">
				<MkA v-for="list in items" :key="list.id" class="_panel" :class="$style.list" :to="`/timeline/list/${list.id}`">
					<div style="margin-bottom: 4px;">{{ list.name }} <span :class="$style.nUsers">({{ i18n.tsx.nUsers({ n: `${list.userIds!.length}/${$i.policies['userEachUserListsLimit']}` }) }})</span></div>
					<MkAvatars :userIds="list.userIds!" :limit="10"/>
				</MkA>
			</div>
		</div>
	</div>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { onActivated, computed } from 'vue';
import MkButton from '@/components/MkButton.vue';
import MkAvatars from '@/components/MkAvatars.vue';
import * as os from '@/os.js';
import { i18n } from '@/i18n.js';
import { definePage } from '@/page.js';
import { userListsCache } from '@/cache.js';
import { ensureSignin } from '@/i.js';

const $i = ensureSignin();

const items = computed(() => userListsCache.value.value ?? []);

function _fetch_() {
	userListsCache.fetch();
}

_fetch_();

async function create() {
	const { canceled, result: name } = await os.inputText({
		title: i18n.ts.enterListName,
	});
	if (canceled || name == null) return;
	await os.apiWithDialog('users/lists/create', { name: name });
	userListsCache.delete();
	_fetch_();
}

const headerActions = computed(() => [{
	asFullButton: true,
	icon: 'ti ti-refresh',
	text: i18n.ts.reload,
	handler: () => {
		userListsCache.delete();
		_fetch_();
	},
}]);

const headerTabs = computed(() => []);

definePage(() => ({
	title: i18n.ts.manageLists,
	icon: 'ti ti-list',
}));

onActivated(() => {
	_fetch_();
});
</script>

<style lang="scss" module>
.list {
	display: block;
	padding: 16px;
	border: solid 1px var(--MI_THEME-divider);
	border-radius: 6px;
	margin-bottom: 8px;

	&:hover {
		border: solid 1px var(--MI_THEME-accent);
		text-decoration: none;
	}
}

.nUsers {
	font-size: .9em;
	opacity: .7;
}
</style>
