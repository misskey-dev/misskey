<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkStickyContainer>
	<template #header><MkPageHeader :actions="headerActions" :tabs="headerTabs"/></template>
	<MkSpacer :contentMax="700">
		<Transition :name="defaultStore.state.animation ? 'fade' : ''" mode="out-in">
			<div v-if="page" :key="page.id" class="xcukqgmh">
				<div class="main">
					<!--
				<div class="header">
					<h1>{{ page.title }}</h1>
				</div>
				-->
					<div class="banner">
						<MkMediaImage
							v-if="page.eyeCatchingImageId"
							:image="page.eyeCatchingImage"
							:cover="true"
							:disableImageLink="true"
							class="thumbnail"
						/>
					</div>
					<div class="content">
						<XPage :page="page"/>
					</div>
					<div class="actions">
						<div class="like">
							<MkButton v-if="page.isLiked" v-tooltip="i18n.ts._pages.unlike" class="button" asLike primary @click="unlike()"><i class="ti ti-heart-off"></i><span v-if="page.likedCount > 0" class="count">{{ page.likedCount }}</span></MkButton>
							<MkButton v-else v-tooltip="i18n.ts._pages.like" class="button" asLike @click="like()"><i class="ti ti-heart"></i><span v-if="page.likedCount > 0" class="count">{{ page.likedCount }}</span></MkButton>
						</div>
						<div class="other">
							<button v-if="$i && $i.id === page.userId" v-tooltip="i18n.ts.edit" v-click-anime class="_button" @click="edit"><i class="ti ti-pencil ti-fw"></i></button>
							<button v-tooltip="i18n.ts.shareWithNote" v-click-anime class="_button" @click="shareWithNote"><i class="ti ti-repeat ti-fw"></i></button>
							<button v-tooltip="i18n.ts.copyLink" v-click-anime class="_button" @click="copyLink"><i class="ti ti-link ti-fw"></i></button>
							<button v-if="isSupportShare()" v-tooltip="i18n.ts.share" v-click-anime class="_button" @click="share"><i class="ti ti-share ti-fw"></i></button>
							<button v-if="$i" v-click-anime class="_button" @mousedown="showMenu"><i class="ti ti-dots ti-fw"></i></button>
						</div>
					</div>
					<div class="user">
						<MkAvatar :user="page.user" class="avatar" link preview/>
						<div class="name">
							<MkUserName :user="page.user" style="display: block;"/>
							<MkAcct :user="page.user"/>
						</div>
						<MkFollowButton v-if="!$i || $i.id != page.user.id" :user="page.user" :inline="true" :transparent="false" :full="true" large class="koudoku"/>
					</div>
				</div>
				<div class="footer">
					<div><i class="ti ti-clock"></i> {{ i18n.ts.createdAt }}: <MkTime :time="page.createdAt" mode="detail"/></div>
					<div v-if="page.createdAt != page.updatedAt"><i class="ti ti-clock"></i> {{ i18n.ts.updatedAt }}: <MkTime :time="page.updatedAt" mode="detail"/></div>
				</div>
				<MkAd :prefer="['horizontal', 'horizontal-big']"/>
				<MkContainer :max-height="300" :foldable="true" class="other">
					<template #icon><i class="ti ti-clock"></i></template>
					<template #header>{{ i18n.ts.recentPosts }}</template>
					<MkPagination v-slot="{items}" :pagination="otherPostsPagination" :class="$style.relatedPagesRoot" class="_gaps">
						<MkPagePreview v-for="page in items" :key="page.id" :page="page" :class="$style.relatedPagesItem"/>
					</MkPagination>
				</MkContainer>
			</div>
			<MkError v-else-if="error" @retry="fetchPage()"/>
			<MkLoading v-else/>
		</Transition>
	</MkSpacer>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import { computed, watch, ref, defineAsyncComponent } from 'vue';
import * as Misskey from 'misskey-js';
import XPage from '@/components/page/page.vue';
import MkButton from '@/components/MkButton.vue';
import * as os from '@/os.js';
import { misskeyApi } from '@/scripts/misskey-api.js';
import { url } from '@/config.js';
import MkMediaImage from '@/components/MkMediaImage.vue';
import MkFollowButton from '@/components/MkFollowButton.vue';
import MkContainer from '@/components/MkContainer.vue';
import MkPagination from '@/components/MkPagination.vue';
import MkPagePreview from '@/components/MkPagePreview.vue';
import { i18n } from '@/i18n.js';
import { definePageMetadata } from '@/scripts/page-metadata.js';
import { pageViewInterruptors, defaultStore } from '@/store.js';
import { deepClone } from '@/scripts/clone.js';
import { $i } from '@/account.js';
import { isSupportShare } from '@/scripts/navigator.js';
import copyToClipboard from '@/scripts/copy-to-clipboard.js';
import { useRouter } from '@/router/supplier.js';
import { MenuItem } from '@/types/menu';

const router = useRouter();

const props = defineProps<{
	pageName: string;
	username: string;
}>();

const page = ref<Misskey.entities.Page | null>(null);
const error = ref<any>(null);
const otherPostsPagination = {
	endpoint: 'users/pages' as const,
	limit: 6,
	params: computed(() => ({
		userId: page.value.user.id,
	})),
};
const path = computed(() => props.username + '/' + props.pageName);

function fetchPage() {
	page.value = null;
	misskeyApi('pages/show', {
		name: props.pageName,
		username: props.username,
	}).then(async _page => {
		page.value = _page;

		// plugin
		if (pageViewInterruptors.length > 0) {
			let result = deepClone(_page);
			for (const interruptor of pageViewInterruptors) {
				result = await interruptor.handler(result);
			}
			page.value = result;
		}
	}).catch(err => {
		error.value = err;
	});
}

function share() {
	navigator.share({
		title: page.value.title ?? page.value.name,
		text: page.value.summary,
		url: `${url}/@${page.value.user.username}/pages/${page.value.name}`,
	});
}

function copyLink() {
	copyToClipboard(`${url}/@${page.value.user.username}/pages/${page.value.name}`);
	os.success();
}

function shareWithNote() {
	os.post({
		initialText: `${page.value.title || page.value.name} ${url}/@${page.value.user.username}/pages/${page.value.name}`,
	});
}

function like() {
	os.apiWithDialog('pages/like', {
		pageId: page.value.id,
	}).then(() => {
		page.value.isLiked = true;
		page.value.likedCount++;
	});
}

async function unlike() {
	const confirm = await os.confirm({
		type: 'warning',
		text: i18n.ts.unlikeConfirm,
	});
	if (confirm.canceled) return;
	os.apiWithDialog('pages/unlike', {
		pageId: page.value.id,
	}).then(() => {
		page.value.isLiked = false;
		page.value.likedCount--;
	});
}

function pin(pin) {
	os.apiWithDialog('i/update', {
		pinnedPageId: pin ? page.value.id : null,
	});
}

function edit() {
	if (!page.value) return;

	router.push(`/pages/edit/${page.value.id}`);
}

function reportAbuse() {
	if (!page.value) return;

	const pageUrl = `${url}/@${props.username}/pages/${props.pageName}`;

	os.popup(defineAsyncComponent(() => import('@/components/MkAbuseReportWindow.vue')), {
		user: page.value.user,
		initialComment: `Page: ${pageUrl}\n-----\n`,
	}, {}, 'closed');
}

function showMenu(ev: MouseEvent) {
	if (!page.value) return;

	const menu: MenuItem[] = [
		...($i && $i.id === page.value.userId ? [
			{
				icon: 'ti ti-code',
				text: i18n.ts._pages.viewSource,
				action: () => router.push(`/@${props.username}/pages/${props.pageName}/view-source`),
			},
			...($i.pinnedPageId === page.value.id ? [{
				icon: 'ti ti-pinned-off',
				text: i18n.ts.unpin,
				action: () => pin(false),
			}] : [{
				icon: 'ti ti-pin',
				text: i18n.ts.pin,
				action: () => pin(true),
			}]),
		] : []),
		...($i && $i.id !== page.value.userId ? [
			{
				icon: 'ti ti-exclamation-circle',
				text: i18n.ts.reportAbuse,
				action: reportAbuse,
			},
			...($i.isModerator || $i.isAdmin ? [
				{
					type: 'divider' as const,
				},
				{
					icon: 'ti ti-trash',
					text: i18n.ts.delete,
					danger: true,
					action: () => os.confirm({
						type: 'warning',
						text: i18n.ts.deleteConfirm,
					}).then(({ canceled }) => {
						if (canceled || !page.value) return;

						os.apiWithDialog('pages/delete', { pageId: page.value.id });
					}),
				},
			] : []),
		] : []),
	];

	os.popupMenu(menu, ev.currentTarget ?? ev.target);
}

watch(() => path.value, fetchPage, { immediate: true });

const headerActions = computed(() => []);

const headerTabs = computed(() => []);

definePageMetadata(() => ({
	title: page.value ? page.value.title || page.value.name : i18n.ts.pages,
	...page.value ? {
		avatar: page.value.user,
		path: `/@${page.value.user.username}/pages/${page.value.name}`,
		share: {
			title: page.value.title || page.value.name,
			text: page.value.summary,
		},
	} : {},
}));
</script>

<style lang="scss" scoped>
.fade-enter-active,
.fade-leave-active {
	transition: opacity 0.125s ease;
}
.fade-enter-from,
.fade-leave-to {
	opacity: 0;
}

.xcukqgmh {
	> .main {
		padding: 32px;

		> .header {
			padding: 16px;

			> h1 {
				margin: 0;
			}
		}

		> .banner {
			> .thumbnail {
				// TODO: 良い感じのアスペクト比で表示
				display: block;
				width: 100%;
				height: auto;
				aspect-ratio: 3/1;
				border-radius: var(--radius);
				overflow: hidden;
				object-fit: cover;
			}
		}

		> .content {
			margin-top: 16px;
			padding: 16px 0 0 0;
		}

		> .actions {
			display: flex;
			align-items: center;
			margin-top: 16px;
			padding: 16px 0 0 0;
			border-top: solid 0.5px var(--divider);

			> .other {
				margin-left: auto;

				> button {
					padding: 8px;
					margin: 0 8px;

					&:hover {
						color: var(--fgHighlighted);
					}
				}
			}
		}

		> .user {
			margin-top: 16px;
			padding: 16px 0 0 0;
			border-top: solid 0.5px var(--divider);
			display: flex;
			align-items: center;

			> .avatar {
				width: 52px;
				height: 52px;
			}

			> .name {
				margin: 0 0 0 12px;
				font-size: 90%;
			}

			> .koudoku {
				margin-left: auto;
			}
		}

		> .links {
			margin-top: 16px;
			padding: 24px 0 0 0;
			border-top: solid 0.5px var(--divider);

			> .link {
				margin-right: 0.75em;
			}
		}
	}

	> .footer {
		margin: var(--margin) 0 var(--margin) 0;
		font-size: 85%;
		opacity: 0.75;
	}
}
</style>

<style module>
.relatedPagesRoot {
	padding: var(--margin);
}

.relatedPagesItem > article {
	background-color: var(--panelHighlight) !important;
}
</style>
