<template>
<MkStickyContainer>
	<template #header><MkPageHeader v-model:tab="tab" :actions="headerActions" :tabs="headerTabs"/></template>

	<MkSpacer v-if="tab === 'note'" :contentMax="800">
		<div v-if="notesSearchAvailable">
			<XNote/>
		</div>
		<div v-else>
			<MkInfo warn>{{ i18n.ts.notesSearchNotAvailable }}</MkInfo>
		</div>
	</MkSpacer>

	<MkSpacer v-else-if="tab === 'user'" :contentMax="800">
		<XUser/>
	</MkSpacer>
	<MkSpacer v-else-if="tab === 'event'" :contentMax="800">
		<XEvent/>
	</MkSpacer>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import { computed, defineAsyncComponent } from 'vue';
import { i18n } from '@/i18n';
import { definePageMetadata } from '@/scripts/page-metadata';
import { $i } from '@/account';
import { instance } from '@/instance';
import MkInfo from '@/components/MkInfo.vue';
import { $ref } from 'vue/macros';

const XNote = defineAsyncComponent(() => import('./search.note.vue'));
const XUser = defineAsyncComponent(() => import('./search.user.vue'));
const XEvent = defineAsyncComponent(() => import('./search.event.vue'));

let tab = $ref('note');

const notesSearchAvailable = (($i == null && instance.policies.canSearchNotes) || ($i != null && $i.policies.canSearchNotes));

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
	title: i18n.ts.search,
	icon: 'ti ti-search',
})));
</script>
