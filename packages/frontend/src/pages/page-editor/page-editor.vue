<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkStickyContainer>
	<template #header><MkPageHeader :actions="headerActions" :tabs="headerTabs"/></template>
	<MkSpacer :contentMax="800">
		<div v-if="fetchStatus === 'loading'">
			<MkLoading/>
		</div>
		<div v-else-if="fetchStatus === 'done' && page != null" :class="$style.pageMain">
			<div :class="$style.pageBanner">
				<div v-if="page?.eyeCatchingImageId" :class="$style.pageBannerImage">
					<MkMediaImage
						:image="page.eyeCatchingImage!"
						:cover="true"
						:disableImageLink="true"
						:class="$style.thumbnail"
					/>
				</div>
			</div>
			<div :class="$style.pageBannerTitle" class="_gaps_s">
				<h1></h1>
				<div :class="$style.pageBannerTitleSub">
					<div v-if="page?.user" :class="$style.pageBannerTitleUser">
						<MkAvatar :user="page.user" :class="$style.avatar" indicator link preview/> <MkA :to="`/@${username}`"><MkUserName :user="page.user" :nowrap="false"/></MkA>
					</div>
					<div :class="$style.pageBannerTitleSubActions">
						<MkA v-if="page?.userId === $i?.id" v-tooltip="i18n.ts._pages.editThisPage" :to="`/pages/edit/${page.id}`" class="_button" :class="$style.generalActionButton"><i class="ti ti-pencil ti-fw"></i></MkA>
						<button v-tooltip="i18n.ts.share" class="_button" :class="$style.generalActionButton" @click="share"><i class="ti ti-share ti-fw"></i></button>
					</div>
				</div>
			</div>
		</div>
		<div v-else-if="fetchStatus === 'notMe'" class="_fullInfo">
			This page is not yours
		</div>
	</MkSpacer>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import { computed, provide, watch, ref } from 'vue';
import * as Misskey from 'misskey-js';
import { v4 as uuid } from 'uuid';
import XBlocks from './page-editor.blocks.vue';
import MkButton from '@/components/MkButton.vue';
import MkSelect from '@/components/MkSelect.vue';
import MkSwitch from '@/components/MkSwitch.vue';
import MkInput from '@/components/MkInput.vue';
import MkMediaImage from '@/components/MkMediaImage.vue';
import { url } from '@@/js/config.js';
import * as os from '@/os.js';
import { misskeyApi } from '@/scripts/misskey-api.js';
import { selectFile } from '@/scripts/select-file.js';
import { i18n } from '@/i18n.js';
import { definePageMetadata } from '@/scripts/page-metadata.js';
import { signinRequired } from '@/account.js';
import { mainRouter } from '@/router/main.js';
import { getPageBlockList } from '@/pages/page-editor/common.js';

const props = defineProps<{
	initPageId?: string;
}>();

const $i = signinRequired();

const fetchStatus = ref<'loading' | 'done' | 'notMe'>('loading');
const page = ref<Partial<Misskey.entities.Page> | null>(null);
const content = computed<Misskey.entities.Page['content']>({
	get: () => page.value?.content ?? [],
	set: (value) => {
		if (page.value) {
			page.value.content = value;
		} else {
			page.value = {
				content: value,
			};
		}
	},
});

async function init() {
	if (props.initPageId) {
		const _page = await misskeyApi('pages/show', {
			pageId: props.initPageId,
		});
		if (_page.user.id !== $i.id) {
			fetchStatus.value = 'notMe';
			return;
		}
	}

	if (page.value === null) {
		const id = uuid();
		content.value = [{
			id,
			type: 'text',
			text: 'Hello World!',
		}];
	}

	fetchStatus.value = 'done';
}

init();

const headerActions = computed(() => []);

const headerTabs = computed(() => []);

definePageMetadata(() => ({
	title: props.initPageId ? i18n.ts._pages.editPage : i18n.ts._pages.newPage,
	icon: 'ti ti-pencil',
}));
</script>

<style lang="scss" module>
.pageMain {
	border-radius: var(--MI-radius);
	padding: 2rem;
	background: var(--MI_THEME-panel);
	box-sizing: border-box;
}

.pageBanner {
	width: calc(100% + 4rem);
	margin: -2rem -2rem 1.5rem;
	border-radius: var(--MI-radius) var(--MI-radius) 0 0;
	overflow: hidden;
	position: relative;
}

.pageBannerImage {
	position: relative;
	padding-top: 56.25%;

	> .thumbnail {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
	}
}

.pageBannerTitle {
	position: relative;

	h1 {
		font-size: 2rem;
		font-weight: 700;
		color: var(--MI_THEME-fg);
		margin: 0;
	}

	.pageBannerTitleSub {
		display: flex;
		align-items: center;
		width: 100%;
	}

	.pageBannerTitleUser {
		--height: 32px;
		flex-shrink: 0;
		line-height: var(--height);

		.avatar {
			height: var(--height);
			width: var(--height);
		}
	}

	.pageBannerTitleSubActions {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		gap: var(--MI-marginHalf);
		margin-left: auto;
	}
}
</style>
