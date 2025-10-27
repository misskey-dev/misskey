<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_gaps">
	<MkButton v-if="$i && ($i.isModerator || $i.policies.canManageCustomEmojis)" primary link to="/custom-emojis-manager">{{ i18n.ts.manageCustomEmojis }}</MkButton>

	<div v-if="emojisByCategory != null" class="_gaps">
		<div class="query">
			<MkInput v-model="q" class="" :placeholder="i18n.ts.search" autocapitalize="off">
				<template #prefix><i class="ti ti-search"></i></template>
			</MkInput>
		</div>

		<MkFoldableSection v-if="searchResult != null && searchResult.length > 0">
			<template #header>{{ i18n.ts.searchResult }}</template>
			<div :class="$style.emojis">
				<XEmoji v-for="emoji in searchResult" :key="emoji.name" :emoji="emoji"/>
			</div>
		</MkFoldableSection>

		<MkFoldableSection v-for="emojis, categoryName in emojisByCategory" :key="categoryName" :expanded="false" @headerClick="(opened) => onCategoryHeaderClick(categoryName, opened)">
			<template #header>{{ categoryName === CATEGORY_NONE ? i18n.ts.other : categoryName }}</template>
			<div v-if="emojis != null" :class="$style.emojis">
				<XEmoji v-for="emoji in emojis" :key="emoji.name" :emoji="emoji"/>
			</div>
			<div v-else>
				<MkLoading/>
			</div>
		</MkFoldableSection>
	</div>
	<div v-else>
		<MkLoading/>
	</div>
</div>
</template>

<script lang="ts" setup>
import { watch, ref, onMounted } from 'vue';
import XEmoji from './emojis.emoji.vue';
import MkButton from '@/components/MkButton.vue';
import MkInput from '@/components/MkInput.vue';
import MkFoldableSection from '@/components/MkFoldableSection.vue';
import { getEmojiCategories, getEmojisByCategory, searchEmojis, CATEGORY_NONE } from '@/utility/idb-emoji-store.js';
import type { V1Emoji } from '@/utility/idb-emoji-store.js';
import { i18n } from '@/i18n.js';
import { $i } from '@/i.js';

const q = ref('');
const emojisByCategory = ref<Record<string, V1Emoji[] | null> | null>(null);
const searching = ref(false);
const searchResult = ref<V1Emoji[] | null>(null);

async function search() {
	if (q.value.trim() === '') {
		searchResult.value = null;
		return;
	}

	searching.value = true;
	const results = await searchEmojis(q.value.trim(), Infinity);
	searchResult.value = results;
	searching.value = false;
}

async function fetchCategories() {
	const categories = await getEmojiCategories();
	emojisByCategory.value = Object.fromEntries(categories.map(category => [category, null]));
}

async function onCategoryHeaderClick(categoryName: string, opened: boolean) {
	if (!opened) return;

	if (emojisByCategory.value == null) return;

	if (emojisByCategory.value[categoryName] != null) return;

	const emojis = await getEmojisByCategory(categoryName);
	emojisByCategory.value[categoryName] = emojis;
}

onMounted(() => {
	fetchCategories();
});

watch(q, () => {
	search();
});
</script>

<style lang="scss" module>
.emojis {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
	grid-gap: 12px;
}
</style>
