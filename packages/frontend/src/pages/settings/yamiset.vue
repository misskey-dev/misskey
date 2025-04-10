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
import { computed, ref, watch } from 'vue';
import MkSelect from '@/components/MkSelect.vue';
import FormSection from '@/components/form/section.vue';
import { i18n } from '@/i18n.js';
import { definePage } from '@/page.js';
import SearchMarker from '@/components/global/SearchMarker.vue';
import SearchLabel from '@/components/global/SearchLabel.vue';
import SearchKeyword from '@/components/global/SearchKeyword.vue';
import { prefer } from '@/preferences.js';

// ローカルの状態を管理するための ref
const currentEngine = ref(prefer.s.searchEngine);

// preferの値が変更されたらローカルの状態も更新
watch(() => prefer.s.searchEngine, (newValue) => {
	currentEngine.value = newValue;
}, { immediate: true });

// v-modelにバインドするcomputedプロパティ
const searchEngine = computed({
	get: () => currentEngine.value,
	set: (value) => {
		if (value) {
			// ローカルの状態をすぐに更新
			currentEngine.value = value;
			// preferに保存
			prefer.commit('searchEngine', value);
		}
	},
});

// MkSelectの選択が変更されたときのハンドラ（必要であれば）
function save() {
	// 既に computed setter で処理されているため空でも問題ない
}

definePage(() => ({
	title: i18n.ts._yami.yamiSet,
	icon: 'ti ti-key',
}));
</script>
