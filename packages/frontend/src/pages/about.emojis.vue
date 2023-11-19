<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkStickyContainer>
	<template #header><MkPageHeader v-model:tab="tab" :actions="headerActions" :tabs="headerTabs"/></template>
	<MkSpacer v-if="tab === 'emojis'" :contentMax="1000" :marginMin="20">
		<MkButton v-if="$i && ($i.isModerator || $i.policies.canManageCustomEmojis)" primary link to="/custom-emojis-manager">{{ i18n.ts.manageCustomEmojis }}</MkButton>
		<MkButton v-if="$i && (!$i.isModerator && $i.policies.canRequestCustomEmojis)" primary @click="edit">{{ i18n.ts.requestCustomEmojis }}</MkButton>

		<div class="query" style="margin-top: 10px;">
			<MkInput v-model="q" class="" :placeholder="i18n.ts.search" autocapitalize="off">
				<template #prefix><i class="ti ti-search"></i></template>
			</MkInput>

			<!-- たくさんあると邪魔
                <div class="tags">
                  <span class="tag _button" v-for="tag in customEmojiTags" :class="{ active: selectedTags.has(tag) }" @click="toggleTag(tag)">{{ tag }}</span>
                </div>
                -->
		</div>

		<MkFoldableSection v-if="searchEmojis">
			<template #header>{{ i18n.ts.searchResult }}</template>
			<div :class="$style.emojis">
				<XEmoji v-for="emoji in searchEmojis" :key="emoji.name" :emoji="emoji" :request="emoji.request"/>
			</div>
		</MkFoldableSection>

		<MkFoldableSection v-for="category in customEmojiCategories" v-once :key="category">
			<template #header>{{ category || i18n.ts.other }}</template>
			<div :class="$style.emojis">
				<XEmoji v-for="emoji in customEmojis.filter(e => e.category === category)" :key="emoji.name" :emoji="emoji"/>
			</div>
		</MkFoldableSection>
	</MkSpacer>
	<MkSpacer v-if="tab === 'request'" :contentMax="1000" :marginMin="20">
		<div :class="$style.emojis">
			<XEmoji v-for="emoji in requestEmojis.emojis" :key="emoji.name" :emoji="emoji" :request="true"/>
		</div>
	</MkSpacer>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import { watch, defineAsyncComponent, ref } from 'vue';
import * as Misskey from 'misskey-js';
import XEmoji from './emojis.emoji.vue';
import MkButton from '@/components/MkButton.vue';
import MkInput from '@/components/MkInput.vue';
import MkFoldableSection from '@/components/MkFoldableSection.vue';
import { customEmojis, customEmojiCategories } from '@/custom-emojis.js';
import { i18n } from '@/i18n.js';
import * as os from '@/os';
import { $i } from '@/account.js';
import { definePageMetadata } from '@/scripts/page-metadata';

let tab = $ref('emojis');
const headerActions = $computed(() => []);

const headerTabs = $computed(() => [{
	key: 'emojis',
	title: i18n.ts.list,
}, {
	key: 'request',
	title: i18n.ts.requestingEmojis,
}]);

definePageMetadata(ref({}));

let q = $ref('');
let searchEmojis = $ref<Misskey.entities.CustomEmoji[]>(null);
let selectedTags = $ref(new Set());
const requestEmojis = await os.apiGet('emoji-requests');

function search() {
	if ((q === '' || q == null) && selectedTags.size === 0) {
		searchEmojis = null;
		return;
	}

	if (selectedTags.size === 0) {
		const queryarry = q.match(/\:([a-z0-9_]*)\:/g);

		if (queryarry) {
			searchEmojis = customEmojis.value.filter(emoji =>
				queryarry.includes(`:${emoji.name}:`),
			);
		} else {
			searchEmojis = customEmojis.value.filter(emoji => emoji.name.includes(q) || emoji.aliases.includes(q));
		}
	} else {
		searchEmojis = customEmojis.value.filter(emoji => (emoji.name.includes(q) || emoji.aliases.includes(q)) && [...selectedTags].every(t => emoji.aliases.includes(t)));
	}
}

const edit = () => {
	os.popup(defineAsyncComponent(() => import('@/components/MkEmojiEditDialog.vue')), {
		isRequest: true,
	}, {
		done: result => {
			window.location.reload();
		},
	}, 'closed');
};

watch($$(q), () => {
	search();
});

watch($$(selectedTags), () => {
	search();
}, { deep: true });

definePageMetadata({
	title: i18n.ts.customEmojis,
	icon: null,
});
</script>

<style lang="scss" module>
.emojis {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
	grid-gap: 12px;
}
</style>
