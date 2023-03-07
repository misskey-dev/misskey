<template>
<MkStickyContainer>
	<template #header><MkPageHeader :actions="headerActions" :tabs="headerTabs"/></template>
	<MkSpacer :content-max="800">
		<MkInput v-model="searchQuery" :large="true" :autofocus="true" :debounce="true" type="search" style="margin-bottom: var(--margin);" @update:model-value="search()">
			<template #prefix><i class="ti ti-search"></i></template>
		</MkInput>
		<MkTab v-model="searchType" style="margin-bottom: var(--margin);" @update:model-value="search()">
			<option value="note">{{ i18n.ts.note }}</option>
			<option value="user">{{ i18n.ts.user }}</option>
		</MkTab>

		<div v-if="searchType === 'note'">
			<MkNotes v-if="searchQuery" ref="notes" :pagination="notePagination"/>
		</div>
		<div v-else>
			<MkRadios v-model="searchOrigin" style="margin-bottom: var(--margin);" @update:model-value="search()">
				<option value="combined">{{ i18n.ts.all }}</option>
				<option value="local">{{ i18n.ts.local }}</option>
				<option value="remote">{{ i18n.ts.remote }}</option>
			</MkRadios>

			<MkUserList v-if="searchQuery" ref="users" :pagination="userPagination"/>
		</div>
	</MkSpacer>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import { computed, onMounted } from 'vue';
import MkNotes from '@/components/MkNotes.vue';
import MkUserList from '@/components/MkUserList.vue';
import MkInput from '@/components/MkInput.vue';
import MkTab from '@/components/MkTab.vue';
import MkRadios from '@/components/MkRadios.vue';
import { i18n } from '@/i18n';
import { definePageMetadata } from '@/scripts/page-metadata';
import * as os from '@/os';
import { useRouter, mainRouter } from '@/router';

const router = useRouter();

const props = defineProps<{
	query: string;
	channel?: string;
	type?: string;
	origin?: string;
}>();

let searchQuery = $ref('');
let searchType = $ref('note');
let searchOrigin = $ref('combined');

onMounted(() => {
	searchQuery = props.query ?? '';
	searchType = props.type ?? 'note';
	searchOrigin = props.origin ?? 'combined';

	if (searchQuery) {
		search();
	}
});

const search = async () => {
	const query = searchQuery.toString().trim();

	if (query == null || query === '') return;

	if (query.startsWith('@') && !query.includes(' ')) {
		mainRouter.push(`/${query}`);
		return;
	}

	if (query.startsWith('#')) {
		mainRouter.push(`/tags/${encodeURIComponent(query.substr(1))}`);
		return;
	}

	// like 2018/03/12
	if (/^[0-9]{4}\/[0-9]{2}\/[0-9]{2}/.test(query.replace(/-/g, '/'))) {
		const date = new Date(query.replace(/-/g, '/'));

		// 日付しか指定されてない場合、例えば 2018/03/12 ならユーザーは
		// 2018/03/12 のコンテンツを「含む」結果になることを期待するはずなので
		// 23時間59分進める(そのままだと 2018/03/12 00:00:00 「まで」の
		// 結果になってしまい、2018/03/12 のコンテンツは含まれない)
		if (query.replace(/-/g, '/').match(/^[0-9]{4}\/[0-9]{2}\/[0-9]{2}$/)) {
			date.setHours(23, 59, 59, 999);
		}

		// TODO
		//v.$root.$emit('warp', date);
		os.alert({
			icon: 'ti ti-history',
			iconOnly: true, autoClose: true,
		});
		return;
	}

	if (query.startsWith('https://')) {
		const promise = os.api('ap/show', {
			uri: query,
		});

		os.promiseDialog(promise, null, null, i18n.ts.fetchingAsApObject);

		const res = await promise;

		if (res.type === 'User') {
			mainRouter.push(`/@${res.object.username}@${res.object.host}`);
		} else if (res.type === 'Note') {
			mainRouter.push(`/notes/${res.object.id}`);
		}

		return;
	}

	window.history.replaceState('', '', `/search?q=${encodeURIComponent(query)}&type=${searchType}${searchType === 'user' ? `&origin=${searchOrigin}` : ''}`);
};

const notePagination = {
	endpoint: 'notes/search' as const,
	limit: 10,
	params: computed(() => ({
		query: searchQuery,
		channelId: props.channel,
	})),
};
const userPagination = {
	endpoint: 'users/search' as const,
	limit: 10,
	params: computed(() => ({
		query: searchQuery,
		origin: searchOrigin,
	})),
};

const headerActions = $computed(() => []);

const headerTabs = $computed(() => []);

definePageMetadata(computed(() => ({
	title: searchQuery ? i18n.t('searchWith', { q: searchQuery }) : i18n.ts.search,
	icon: 'ti ti-search',
})));
</script>
