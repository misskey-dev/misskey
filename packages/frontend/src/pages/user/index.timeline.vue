<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkStickyContainer>
	<template #header>
		<MkTab
			v-model="tab"
			:tabs="[
				{ key: 'featured', label: i18n.ts.featured },
				{ key: 'notes', label: i18n.ts.notes },
				{ key: 'all', label: i18n.ts.all },
				{ key: 'files', label: i18n.ts.withFiles },
			]"
			:class="$style.tab"
		>
		</MkTab>
	</template>
	<MkNotesTimeline v-if="tab === 'featured'" :noGap="true" :paginator="featuredPaginator" :pullToRefresh="false" :class="$style.tl"/>
	<MkNotesTimeline v-else :noGap="true" :paginator="notesPaginator" :pullToRefresh="false" :class="$style.tl"/>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import { ref, computed, markRaw } from 'vue';
import * as Misskey from 'misskey-js';
import MkNotesTimeline from '@/components/MkNotesTimeline.vue';
import MkTab from '@/components/MkTab.vue';
import { i18n } from '@/i18n.js';
import { Paginator } from '@/utility/paginator.js';

const props = defineProps<{
	user: Misskey.entities.UserDetailed;
}>();

const tab = ref<'featured' | 'notes' | 'all' | 'files'>('all');

const featuredPaginator = markRaw(new Paginator('users/featured-notes', {
	limit: 10,
	params: {
		userId: props.user.id,
	},
}));

const notesPaginator = markRaw(new Paginator('users/notes', {
	limit: 10,
	computedParams: computed(() => ({
		userId: props.user.id,
		withRenotes: tab.value === 'all',
		withReplies: tab.value === 'all',
		withChannelNotes: tab.value === 'all',
		withFiles: tab.value === 'files',
	})),
}));
</script>

<style lang="scss" module>
.tab {
	padding: calc(var(--MI-margin) / 2) 0;
	background: var(--MI_THEME-bg);
}

.tl {
	background: var(--MI_THEME-bg);
	border-radius: var(--MI-radius);
	overflow: clip;
}
</style>
