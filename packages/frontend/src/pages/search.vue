<template>
<MkStickyContainer>
	<template #header><MkPageHeader v-model:tab="tab" :actions="headerActions" :tabs="headerTabs"/></template>
	<MkSpacer v-if="tab === 'note'" :content-max="800">
		<div v-if="notesSearchAvailable" class="_gaps">
			<div class="_gaps">
				<MkInput v-model="searchQuery" :large="true" :autofocus="true" type="search">
					<template #prefix><i class="ti ti-search"></i></template>
				</MkInput>
				<MkButton large primary gradate rounded @click="search">{{ i18n.ts.search }}</MkButton>
			</div>

			<MkFoldableSection v-if="notePagination">
				<template #header>{{ i18n.ts.searchResult }}</template>
				<MkNotes :key="key" :pagination="notePagination"/>
			</MkFoldableSection>
		</div>
		<div v-else>
			<MkInfo warn>{{ i18n.ts.notesSearchNotAvailable }}</MkInfo>
		</div>
	</MkSpacer>
	<MkSpacer v-else-if="tab === 'user'" :content-max="800">
		<div class="_gaps">
			<div class="_gaps">
				<MkInput v-model="searchQuery" :large="true" :autofocus="true" type="search">
					<template #prefix><i class="ti ti-search"></i></template>
				</MkInput>
				<MkRadios v-model="searchOrigin" @update:model-value="search()">
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
	</MkSpacer>
	<MkSpacer v-else-if="tab === 'event'" :content-max="800">
		<div class="_gaps">
			<div class="_gaps">
				<MkInput v-model="searchQuery" :large="true" :autofocus="true" type="search">
					<template #prefix><i class="ti ti-search"></i></template>
				</MkInput>
				<MkSelect v-model="eventSort" small>
					<template #label>{{ i18n.ts.sort }}</template>
					<option value="startDate">{{ i18n.ts._event.startDate }}</option>
					<option value="createdAt">{{ i18n.ts.reverseChronological }}</option>
				</MkSelect>
				<section>
					<MkInput v-model="startDate" small type="date" class="input">
						<template #label>{{ i18n.ts._event.startDate }}</template>
					</MkInput>
					<MkInput v-model="endDate" small type="date" class="input">
						<template #label>{{ i18n.ts._event.endDate }}</template>
					</MkInput>
				</section>
				<MkButton large primary gradate rounded @click="search">{{ i18n.ts.search }}</MkButton>
			</div>

			<MkFoldableSection v-if="eventPagination">
				<template #header>{{ i18n.ts.searchResult }}</template>
				<MkNotes :key="key" :pagination="eventPagination" :get-date="eventSort === 'startDate' ? note => note.event.start : undefined"/>
			</MkFoldableSection>
		</div>
	</MkSpacer>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import { computed, onMounted } from 'vue';
import MkNotes from '@/components/MkNotes.vue';
import MkUserList from '@/components/MkUserList.vue';
import MkInput from '@/components/MkInput.vue';
import MkRadios from '@/components/MkRadios.vue';
import MkButton from '@/components/MkButton.vue';
import MkSelect from '@/components/MkSelect.vue';
import { i18n } from '@/i18n';
import { definePageMetadata } from '@/scripts/page-metadata';
import * as os from '@/os';
import MkFoldableSection from '@/components/MkFoldableSection.vue';
import { $i } from '@/account';
import { instance } from '@/instance';
import MkInfo from '@/components/MkInfo.vue';
import { useRouter } from '@/router';

const router = useRouter();

const props = defineProps<{
	query: string;
	channel?: string;
	type?: string;
	origin?: string;
}>();

let key = $ref('');
let tab = $ref('note');
let searchQuery = $ref('');
let searchOrigin = $ref('combined');
let eventSort = $ref('startDate');
let notePagination = $ref();
let userPagination = $ref();
let eventPagination = $ref();
let startDate = $ref(null);
let endDate = $ref(null);

const notesSearchAvailable = (($i == null && instance.policies.canSearchNotes) || ($i != null && $i.policies.canSearchNotes));

onMounted(() => {
	tab = props.type ?? 'note';
	searchQuery = props.query ?? '';
	searchOrigin = props.origin ?? 'combined';
});

async function search() {
	const query = searchQuery.toString().trim();

	// only notes/users search require the query string
	if ((query == null || query === '') && tab !== 'event') return;

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

	if (tab === 'note') {
		notePagination = {
			endpoint: 'notes/search',
			limit: 10,
			params: {
				query: searchQuery,
				channelId: props.channel,
			},
		};
	} else if (tab === 'user') {
		userPagination = {
			endpoint: 'users/search',
			limit: 10,
			params: {
				query: searchQuery,
				origin: searchOrigin,
			},
		};
	} else if (tab === 'event') {
		eventPagination = {
			endpoint: 'notes/events/search',
			limit: 10,
			offsetMode: true,
			params: {
				query: !searchQuery ? undefined : searchQuery,
				sortBy: eventSort,
				sinceDate: startDate ? (new Date(startDate)).getTime() : undefined,
				untilDate: endDate ? (new Date(endDate)).getTime() + 1000 * 3600 * 24 : undefined,
			},
		};

		// only refresh search on query/key change
		key = JSON.stringify(eventPagination);

		return;
	}

	key = query;
}

const headerActions = $computed(() => []);

const headerTabs = $computed(() => [{
	key: 'note',
	title: i18n.ts.notes,
	icon: 'ti ti-pencil',
}, {
	key: 'user',
	title: i18n.ts.users,
	icon: 'ti ti-users',
}, {
	key: 'event',
	title: i18n.ts.events,
	icon: 'ti ti-calendar',
}]);

definePageMetadata(computed(() => ({
	title: searchQuery ? i18n.t('searchWith', { q: searchQuery }) : i18n.ts.search,
	icon: 'ti ti-search',
})));
</script>
