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
		<MkRadios v-model="searchOrigin" @update:modelValue="search()">
			<option value="combined">{{ i18n.ts.all }}</option>
			<option value="local">{{ i18n.ts.local }}</option>
			<option value="remote">{{ i18n.ts.remote }}</option>
		</MkRadios>
		<MkButton large primary gradate rounded @click="search">{{ i18n.ts.search }}</MkButton>
	</div>

	<MkFoldableSection v-if="userPagination">
		<template #header>{{ i18n.ts.searchResult }}</template>
		<MkUserList :key="key" :pagination="userPagination"/>
	</MkFoldableSection>
</div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import MkUserList from '@/components/MkUserList.vue';
import MkInput from '@/components/MkInput.vue';
import MkRadios from '@/components/MkRadios.vue';
import MkButton from '@/components/MkButton.vue';
import { i18n } from '@/i18n.js';
import * as os from '@/os.js';
import MkFoldableSection from '@/components/MkFoldableSection.vue';
import { misskeyApi } from '@/scripts/misskey-api.js';
import { useRouter } from '@/router/supplier.js';

const router = useRouter();

const key = ref('');
const searchQuery = ref('');
const searchOrigin = ref('combined');
const userPagination = ref();

async function search() {
	const query = searchQuery.value.toString().trim();

	if (query == null || query === '') return;

	if (query.startsWith('https://')) {
		const promise = misskeyApi('ap/show', {
			uri: query,
		});

		os.promiseDialog(promise, null, null, i18n.ts.fetchingAsApObject);

		const res = await promise;

		if (res.type === 'User') {
			router.push(`/@${res.object.username}@${res.object.host}`);
		} else if (res.type === 'Note') {
			router.push(`/notes/${res.object.id}`);
		}

		return;
	}

	userPagination.value = {
		endpoint: 'users/search',
		limit: 10,
		params: {
			query: query,
			origin: searchOrigin.value,
		},
	};

	key.value = query;
}
</script>
