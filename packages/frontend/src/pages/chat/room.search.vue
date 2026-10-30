<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_gaps">
	<MkInput
		v-model="searchQuery"
		:placeholder="i18n.ts._chat.searchMessages"
		type="search"
		@enter="search()"
	>
		<template #prefix><i class="ti ti-search"></i></template>
	</MkInput>

	<MkButton primary rounded @click="search">{{ i18n.ts.search }}</MkButton>

	<MkFoldableSection v-if="searched">
		<template #header>{{ i18n.ts.searchResult }}</template>

		<div v-if="searchResults.length > 0" class="_gaps_s">
			<div v-for="message in searchResults" :key="message.id" :class="$style.searchResultItem">
				<XMessage :message="message" :user="message.fromUser" :isSearchResult="true"/>
			</div>
		</div>
		<MkResult v-else type="notFound"/>
	</MkFoldableSection>
</div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import * as Misskey from 'misskey-js';
import XMessage from './XMessage.vue';
import MkButton from '@/components/MkButton.vue';
import { i18n } from '@/i18n.js';
import { misskeyApi } from '@/utility/misskey-api.js';
import MkInput from '@/components/MkInput.vue';
import MkFoldableSection from '@/components/MkFoldableSection.vue';

const props = defineProps<{
	userId?: string;
	roomId?: string;
}>();

const searchQuery = ref('');
const searched = ref(false);
const searchResults = ref<Misskey.entities.ChatMessage[]>([]);

async function search() {
	const res = await misskeyApi('chat/messages/search', {
		query: searchQuery.value,
		roomId: props.roomId,
		userId: props.userId,
	});

	searchResults.value = res;
	searched.value = true;
}
</script>

<style lang="scss" module>
.searchResultItem {
	padding: 12px;
	border: solid 1px var(--MI_THEME-divider);
	border-radius: 12px;
}
</style>
