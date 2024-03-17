<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_gaps">
	<div class="_gaps">
		<MkInput v-model="searchQuery" :large="true" :autofocus="true" type="search" @enter="search">
			<template #prefix><i class="ti ti-search"></i></template>
		</MkInput>
		<MkFolder>
			<template #label>{{ i18n.ts.options }}</template>

			<div class="_gaps_m">
				<MkSwitch v-model="isLocalOnly">{{ i18n.ts.localOnly }}</MkSwitch>

				<MkFolder :defaultOpen="true">
					<template #label>{{ i18n.ts.specifyUser }}</template>
					<template v-if="user" #suffix>@{{ user.username }}</template>

					<div style="text-align: center;" class="_gaps">
						<div v-if="user">@{{ user.username }}</div>
						<div>
							<MkButton v-if="user == null" primary rounded inline @click="selectUser">{{ i18n.ts.selectUser }}</MkButton>
							<MkButton v-else danger rounded inline @click="user = null">{{ i18n.ts.remove }}</MkButton>
						</div>
					</div>
				</MkFolder>
			</div>
		</MkFolder>
		<div>
			<MkButton large primary gradate rounded style="margin: 0 auto;" @click="search">{{ i18n.ts.search }}</MkButton>
		</div>
	</div>

	<MkFoldableSection v-if="notePagination">
		<template #header>{{ i18n.ts.searchResult }}</template>
		<MkNotes :key="key" :pagination="notePagination"/>
	</MkFoldableSection>
</div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import MkNotes from '@/components/MkNotes.vue';
import MkInput from '@/components/MkInput.vue';
import MkButton from '@/components/MkButton.vue';
import MkSwitch from '@/components/MkSwitch.vue';
import { i18n } from '@/i18n.js';
import * as os from '@/os.js';
import { doLookup } from '@/scripts/lookup.js';
import MkFoldableSection from '@/components/MkFoldableSection.vue';
import MkFolder from '@/components/MkFolder.vue';

const key = ref(0);
const searchQuery = ref('');
const searchOrigin = ref('combined');
const notePagination = ref();
const user = ref<any>(null);
const isLocalOnly = ref(false);
const isSearching = ref(false);

function selectUser() {
	os.selectUser({ includeSelf: true }).then(_user => {
		user.value = _user;
	});
}

async function search() {
	if (isSearching.value) return;
	isSearching.value = true;

	const query = searchQuery.value.toString().trim();

	if (query == null || query === '') {
		isSearching.value = false;
		return;
	}

	if (query.startsWith('https://') || query.startsWith('http://')) {
		const confirm = await os.actions({
			type: 'question',
			text: i18n.ts.searchOrLookup,
			actions: [
				{
					text: i18n.ts.lookup,
					primary: true,
					value: 'lookup' as const,
				},
				{
					text: i18n.ts.search,
					value: 'search' as const,
				},
			],
		});

		if (confirm.canceled) {
			isSearching.value = false;
			return;
		}

		if (confirm.result === 'lookup') {
			await doLookup(query);
			isSearching.value = false;
			return;
		}
	}

	notePagination.value = {
		endpoint: 'notes/search',
		limit: 10,
		params: {
			query: searchQuery.value,
			userId: user.value ? user.value.id : null,
		},
	};

	if (isLocalOnly.value) notePagination.value.params.host = '.';

	key.value++;
	isSearching.value = false;
}
</script>
