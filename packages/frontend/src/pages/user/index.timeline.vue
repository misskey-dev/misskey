<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkStickyContainer>
	<template #header>
		<MkTab v-model="tab" :class="$style.tab">
			<option value="featured">{{ i18n.ts.featured }}</option>
			<option :value="null">{{ i18n.ts.notes }}</option>
			<option value="all">{{ i18n.ts.all }}</option>
			<option value="files">{{ i18n.ts.withFiles }}</option>
			<option value="mutualBanners">{{ i18n.ts.mutualBanner }}</option>
		</MkTab>
	</template>
	<MkNotes v-if="tab !== 'mutualBanners'" :noGap="true" :pagination="pagination" :class="$style.tl"/>
	<div v-else>
		<div v-if="mutualBanners && mutualBanners.length > 0" :class="$style.mutualBanners">
			<div v-for="(mutualBanner, i) in mutualBanners" :key="i" class="_margin">
				<MkLink :hideIcon="true" :url="mutualBanner.url">
					<img :class="$style.banner" :src="mutualBanner.imgUrl"/>
				</MkLink>
				<p>{{ (mutualBanner.description === '' || mutualBanner.description === null) ? i18n.ts.noDescription : mutualBanner.description }}</p>
				<MkButton v-if="$i?.id === user.id" @click="mutualBannerUnFollow(mutualBanner.id)">{{ i18n.ts.unfollow }}</MkButton>
			</div>
		</div>
		<div v-else>
			<p>{{ i18n.ts.nothing }}</p>
		</div>
	</div>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';
import * as Misskey from 'misskey-js';
import MkNotes from '@/components/MkNotes.vue';
import MkTab from '@/components/MkTab.vue';
import { i18n } from '@/i18n.js';
import MkLink from '@/components/MkLink.vue';
import MkButton from '@/components/MkButton.vue';
import { $i } from '@/account.js';
import * as os from '@/os.js';

const props = defineProps<{
	user: Misskey.entities.UserDetailed;
}>();

const mutualBanners = ref(props.user.mutualBanners);

const tab = ref<string | null>('all');

const pagination = computed(() => tab.value === 'featured' ? {
	endpoint: 'users/featured-notes' as const,
	limit: 10,
	params: {
		userId: props.user.id,
	},
} : {
	endpoint: 'users/notes' as const,
	limit: 10,
	params: {
		userId: props.user.id,
		withRenotes: tab.value === 'all',
		withReplies: tab.value === 'all',
		withFiles: tab.value === 'files',
		withChannelNotes: true,
	},
});

function mutualBannerUnFollow(id:string) {
	os.apiWithDialog('i/update', {
		mutualBannerPining: [
			...($i?.mutualBanners?.map(banner => banner.id) ?? []).filter(bannerId => bannerId !== id),
		],
	});
	if (mutualBanners.value) {
		mutualBanners.value = mutualBanners.value.filter(banner => banner.id !== id);
	}
}
</script>

<style lang="scss" module>
.tab {
	padding: calc(var(--margin) / 2) 0;
	background: var(--bg);
}

.tl {
	background: var(--bg);
	border-radius: var(--radius);
	overflow: clip;
}

.banner {
	max-width: 300px;
	min-width: 200px;
	max-height: 60px;
	min-height: 40px;
	object-fit: contain;
}

.mutualBanners{
	display: flex;
	flex-wrap: wrap;
	justify-content: space-around;
	background: var(--panel);
	border-radius: var(--radius);
}
</style>
