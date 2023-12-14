<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkStickyContainer>
	<template #header>
		<MkPageHeader v-model:tab="tab" :actions="headerActions" :tabs="headerTabs"/>
	</template>
	<MkSpacer v-if="tab === 'emojis'" :contentMax="1000" :marginMin="20">
		<MkButton
			v-if="$i && ($i.isModerator || $i.policies.canManageCustomEmojis)" primary link
			to="/custom-emojis-manager"
		>
			{{ i18n.ts.manageCustomEmojis }}
		</MkButton>
		<MkButton
			v-if="$i && (!$i.isModerator || !$i.policies.canManageCustomEmojis || $i.policies.canRequestCustomEmojis)"
			primary style="margin-top: 8px;" @click="edit"
		>
			{{ i18n.ts.requestCustomEmojis }}
		</MkButton>

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
				<XEmoji v-for="emoji in searchEmojis" :key="emoji.name" :emoji="emoji" :draft="emoji.draft"/>
			</div>
		</MkFoldableSection>

		<MkFoldableSection v-for="category in filteredCategories" v-once :key="category">
			<template #header>{{ category || i18n.ts.other }}</template>
			<div :class="$style.emojis">
				<XEmoji
					v-for="emoji in customEmojis.filter(e => e.category === category && !e.draft)" :key="emoji.name"
					:emoji="emoji" :draft="emoji.draft"
				/>
			</div>
		</MkFoldableSection>
	</MkSpacer>

	<MkSpacer v-if="tab === 'draft'" :contentMax="1000" :marginMin="20">
		<div :class="$style.emojis">
			<XEmoji v-for="emoji in draftEmojis" :key="emoji.name" :emoji="emoji" :draft="emoji.draft"/>
		</div>
	</MkSpacer>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import { watch, defineAsyncComponent, ref, computed } from 'vue';
import * as Misskey from 'misskey-js';
import XEmoji from './emojis.emoji.vue';
import MkButton from '@/components/MkButton.vue';
import MkInput from '@/components/MkInput.vue';
import MkFoldableSection from '@/components/MkFoldableSection.vue';
import {customEmojis, customEmojiCategories, getCustomEmojiTags} from '@/custom-emojis.js';
import { i18n } from '@/i18n.js';
import * as os from '@/os';
import { $i } from '@/account.js';
import { definePageMetadata } from '@/scripts/page-metadata';

let tab = ref('emojis');
const headerActions = computed(() => []);

const customEmojiTags = getCustomEmojiTags();
const q = ref('');
const searchEmojis = ref<Misskey.entities.EmojiSimple[]>(null);
const selectedTags = ref(new Set());
const headerTabs = computed(() => [{
    key: 'emojis',
    title: i18n.ts.list,
}, {
    key: 'draft',
    title: i18n.ts.draftEmojis,
}]);
const filteredCategories = computed(() => {
    return customEmojiCategories.value.filter((category: any) => {
        return customEmojis.value.some((em: any) => em.category === category && !em.draft);
    });
});
definePageMetadata(ref({}));
const draftEmojis = customEmojis.value.filter(emoji => emoji.draft);

function search() {
	if ((q.value === '' || q.value == null) && selectedTags.value.size === 0) {
		searchEmojis.value = null;
		return;
	}

	if (selectedTags.value.size === 0) {
		const queryarry = q.value.match(/\:([a-z0-9_]*)\:/g);

		if (queryarry) {
			searchEmojis.value = customEmojis.value.filter(emoji =>
				queryarry.includes(`:${emoji.name}:`),
			);
		} else {
			searchEmojis.value = customEmojis.value.filter(emoji => emoji.name.includes(q.value) || emoji.aliases.includes(q.value));
		}
	} else {
		searchEmojis.value = customEmojis.value.filter(emoji => (emoji.name.includes(q.value) || emoji.aliases.includes(q.value)) && [...selectedTags.value].every(t => emoji.aliases.includes(t)));
	}
}

function toggleTag(tag) {
	if (selectedTags.value.has(tag)) {
		selectedTags.value.delete(tag);
	} else {
		selectedTags.value.add(tag);
	}
}

watch(q, () => {
	search();
});
const edit = () => {
    os.popup(defineAsyncComponent(() => import('@/components/MkEmojiEditDialog.vue')), {
        isRequest: true,
    }, {
        done: result => {
            window.location.reload();
        },
    }, 'closed');
};
watch(selectedTags, () => {
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
