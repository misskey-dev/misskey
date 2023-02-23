<template>
<MkStickyContainer>
	<template #header><MkPageHeader :actions="headerActions" :tabs="headerTabs"/></template>
	<MkSpacer :content-max="800">
		<MkNotes ref="notes" :pagination="pagination"/>
	</MkSpacer>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import MkNotes from '@/components/MkNotes.vue';
import { i18n } from '@/i18n';
import { definePageMetadata } from '@/scripts/page-metadata';
import * as os from '@/os';
import { useRouter } from '@/router';
import { $i } from '@/account';

const router = useRouter();

const props = defineProps<{
	query: string;
	channel?: string;
}>();

const query = props.query;

if ($i != null) {
	if (query.startsWith('https://') || (query.startsWith('@') && !query.includes(' '))) {
		const promise = os.api('ap/show', {
			uri: props.query,
		});

		os.promiseDialog(promise, null, null, i18n.ts.fetchingAsApObject);

		const res = await promise;

		if (res.type === 'User') {
			router.replace(`/@${res.object.username}@${res.object.host}`);
		} else if (res.type === 'Note') {
			router.replace(`/notes/${res.object.id}`);
		}
	}
}

const pagination = {
	endpoint: 'notes/search' as const,
	limit: 10,
	params: computed(() => ({
		query: props.query,
		channelId: props.channel,
	})),
};

const headerActions = $computed(() => []);

const headerTabs = $computed(() => []);

definePageMetadata(computed(() => ({
	title: i18n.t('searchWith', { q: props.query }),
	icon: 'ti ti-search',
})));
</script>
