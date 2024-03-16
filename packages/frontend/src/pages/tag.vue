<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkStickyContainer>
	<template #header><MkPageHeader v-model:tab="tab" :actions="headerActions" :tabs="headerTabs"/></template>
	<MkSpacer :contentMax="800">
		<div v-if="tab === 'all'">
			<MkNotes class="" :pagination="pagination"/>
		</div>
		<div v-else-if="tab === 'localOnly'">
			<MkNotes class="" :pagination="localOnlyPagination"/>
		</div>
		<div v-else-if="tab === 'withFiles'">
			<MkNotes class="" :pagination="withFilesPagination"/>
		</div>
	</MkSpacer>
	<template v-if="$i" #footer>
		<div :class="$style.footer">
			<MkSpacer :contentMax="800" :marginMin="16" :marginMax="16">
				<MkButton rounded primary :class="$style.button" @click="post()"><i class="ti ti-pencil"></i>{{ i18n.ts.postToHashtag }}</MkButton>
			</MkSpacer>
		</div>
	</template>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import MkNotes from '@/components/MkNotes.vue';
import MkButton from '@/components/MkButton.vue';
import { definePageMetadata } from '@/scripts/page-metadata.js';
import { i18n } from '@/i18n.js';
import { $i } from '@/account.js';
import { defaultStore } from '@/store.js';
import * as os from '@/os.js';

const tab = ref('all');

const props = defineProps<{
	tag: string;
}>();

const pagination = {
	endpoint: 'notes/search-by-tag' as const,
	limit: 10,
	params: computed(() => ({
		tag: props.tag,
	})),
};
const notes = ref<InstanceType<typeof MkNotes>>();

const localOnlyPagination = {
	endpoint: 'notes/search-by-tag' as const,
	limit: 10,
	params: computed(() => ({
		tag: props.tag,
		local: true,
	})),
};

const withFilesPagination = {
	endpoint: 'notes/search-by-tag' as const,
	limit: 10,
	params: computed(() => ({
		tag: props.tag,
		withFiles: true,
	})),
};

async function post() {
	defaultStore.set('postFormHashtags', props.tag);
	defaultStore.set('postFormWithHashtags', true);
	await os.post();
	defaultStore.set('postFormHashtags', '');
	defaultStore.set('postFormWithHashtags', false);
	notes.value?.pagingComponent?.reload();
}

const headerActions = computed(() => []);

const headerTabs = computed(() => [{
	key: 'all',
	title: i18n.ts.all,
}, {
	key: 'localOnly',
	title: i18n.ts.localOnly,
}, {
	key: 'withFiles',
	title: i18n.ts.withFiles,
}]);

definePageMetadata(() => ({
	title: props.tag,
	icon: 'ti ti-hash',
}));
</script>

<style lang="scss" module>
.footer {
	-webkit-backdrop-filter: var(--blur, blur(15px));
	backdrop-filter: var(--blur, blur(15px));
	background: var(--acrylicBg);
	border-top: solid 0.5px var(--divider);
	display: flex;
}

.button {
	margin: 0 auto;
}
</style>
