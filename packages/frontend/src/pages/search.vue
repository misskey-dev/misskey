<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkStickyContainer>
	<template #header><MkPageHeader v-model:tab="tab" :actions="headerActions" :tabs="headerTabs"/></template>

	<MkHorizontalSwipe v-model:tab="tab" :tabs="headerTabs">
		<div v-if="tab === 'note'" key="note">
			<div v-if="notesSearchAvailable || ignoreNotesSearchAvailable">
				<XNote v-bind="props"/>
			</div>
			<MkSpacer v-else :contentMax="800">
				<MkInfo warn>{{ i18n.ts.notesSearchNotAvailable }}</MkInfo>
			</MkSpacer>
		</div>

		<MkSpacer v-else-if="tab === 'user'" key="user" :contentMax="800">
			<XUser v-bind="props"/>
		</MkSpacer>
	</MkHorizontalSwipe>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import { computed, defineAsyncComponent, ref, toRef } from 'vue';
import { i18n } from '@/i18n.js';
import { definePage } from '@/page.js';
import { notesSearchAvailable } from '@/utility/check-permissions.js';
import MkInfo from '@/components/MkInfo.vue';
import MkHorizontalSwipe from '@/components/MkHorizontalSwipe.vue';

const props = withDefaults(defineProps<{
	query?: string,
	userId?: string,
	username?: string,
	host?: string | null,
	type?: 'note' | 'user',
	origin?: 'combined' | 'local' | 'remote',
	// For storybook only
	ignoreNotesSearchAvailable?: boolean,
}>(), {
	query: '',
	userId: undefined,
	username: undefined,
	host: undefined,
	type: 'note',
	origin: 'combined',
	ignoreNotesSearchAvailable: false,
});

const XNote = defineAsyncComponent(() => import('./search.note.hana.vue'));
const XUser = defineAsyncComponent(() => import('./search.user.vue'));

const tab = ref(toRef(props, 'type').value);

const headerActions = computed(() => []);

const headerTabs = computed(() => [{
	key: 'note',
	title: i18n.ts.notes,
	icon: 'ti ti-pencil',
}, {
	key: 'user',
	title: i18n.ts.users,
	icon: 'ti ti-users',
}]);

definePage(() => ({
	title: i18n.ts.search,
	icon: 'ti ti-search',
}));
</script>
