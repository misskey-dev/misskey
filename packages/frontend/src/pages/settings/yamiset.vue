<!--
SPDX-FileCopyrightText: hitalin
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<SearchMarker path="/settings/yamiset" :label="i18n.ts._yami.yamiSet" :keywords="['yami', 'original', 'custom' ]" icon="ti ti-key">
	<div class="_gaps_m">
		<SearchMarker :keywords="['search', 'engine', 'searx', 'yami']">
			<FormSection>
				<template #label><i class="ti ti-search"></i> <SearchLabel>{{ i18n.ts.searchEngine }}</SearchLabel></template>
				<MkSelect v-model="searchEngine" class="_formBlock" @update:modelValue="save">
					<template #caption><SearchKeyword>{{ i18n.ts._yami.searchEngineDescription }}</SearchKeyword></template>
					<option value="https://google.com/search?">Google Search (google.com)</option>
					<option value="https://duckduckgo.com/?">DuckDuckGo (duckduckgo.com)</option>
					<option value="https://search.yahoo.com/search?">Yahoo! Search (search.yahoo.com)</option>
					<option value="https://www.ecosia.org/search?">Ecosia (ecosia.org)</option>
					<option value="https://www.startpage.com/do/search?">Startpage (startpage.com)</option>
					<option value="https://search.yami.ski/search?">SearX (search.yami.ski)</option>
				</MkSelect>
			</FormSection>
		</SearchMarker>
	</div>
</SearchMarker>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import MkSelect from '@/components/MkSelect.vue';
import FormSection from '@/components/form/section.vue';
import { defaultStore } from '@/store.js';
import { i18n } from '@/i18n.js';
import { definePageMetadata } from '@/scripts/page-metadata.js';
import SearchMarker from '@/components/global/SearchMarker.vue';
import SearchLabel from '@/components/global/SearchLabel.vue';
import SearchKeyword from '@/components/global/SearchKeyword.vue';

const searchEngine = computed(defaultStore.makeGetterSetter('searchEngine'));

function save() {
	// 設定変更時のリロードは不要になった
}

definePageMetadata(() => ({
	title: i18n.ts._yami.yamiSet,
	icon: 'ti ti-key',
}));
</script>
