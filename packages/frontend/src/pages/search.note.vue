<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_gaps">
	<div class="_gaps">
		<MkInput v-model="searchQuery" :large="true" :autofocus="true" type="search">
			<template #prefix><i class="ti ti-search"></i></template>
		</MkInput>
		<MkFolder>
			<template #label>{{ i18n.ts.options }}</template>

			<div class="_gaps_m">
				<MkSwitch v-model="isLocalOnly">{{ i18n.ts.localOnly }}</MkSwitch>

				<MkFolder>
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
import { computed, onMounted } from 'vue';
import MkNotes from '@/components/MkNotes.vue';
import MkInput from '@/components/MkInput.vue';
import MkRadios from '@/components/MkRadios.vue';
import MkButton from '@/components/MkButton.vue';
import MkSwitch from '@/components/MkSwitch.vue';
import { i18n } from '@/i18n.js';
import * as os from '@/os.js';
import MkFoldableSection from '@/components/MkFoldableSection.vue';
import { $i } from '@/account.js';
import { instance } from '@/instance.js';
import MkInfo from '@/components/MkInfo.vue';
import { useRouter } from '@/router.js';
import MkFolder from '@/components/MkFolder.vue';

const router = useRouter();

let key = $ref(0);
let searchQuery = $ref('');
let searchOrigin = $ref('combined');
let notePagination = $ref();
let user = $ref(null);
let isLocalOnly = $ref(false);

function selectUser() {
	os.selectUser().then(_user => {
		user = _user;
	});
}

async function search() {
	const query = searchQuery.toString().trim();

	if (query == null || query === '') return;

	if (query.startsWith('https://')) {
		const promise = os.api('ap/show', {
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

	notePagination = {
		endpoint: 'notes/search',
		limit: 10,
		params: {
			query: searchQuery,
			userId: user ? user.id : null,
		},
	};

	if (isLocalOnly) notePagination.params.host = '.';

	key++;
}
</script>
