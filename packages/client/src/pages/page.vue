<template>
<MkStickyContainer>
	<template #header><MkPageHeader :actions="headerActions" :tabs="headerTabs"/></template>
	<MkSpacer :content-max="700">
		<transition :name="$store.state.animation ? 'fade' : ''" mode="out-in">
			<div v-if="page" :key="page.id" v-size="{ max: [450] }" class="xcukqgmh">
				<div class="_block main">
					<!--
				<div class="header">
					<h1>{{ page.title }}</h1>
				</div>
				-->
					<div class="banner">
						<img v-if="page.eyeCatchingImageId" :src="page.eyeCatchingImage.url"/>
					</div>
					<div class="content">
						<XPage :page="page"/>
					</div>
					<div class="actions">
						<div class="like">
							<MkButton v-if="page.isLiked" v-tooltip="i18n.ts._pages.unlike" class="button" primary @click="unlike()"><i class="fas fa-heart"></i><span v-if="page.likedCount > 0" class="count">{{ page.likedCount }}</span></MkButton>
							<MkButton v-else v-tooltip="i18n.ts._pages.like" class="button" @click="like()"><i class="far fa-heart"></i><span v-if="page.likedCount > 0" class="count">{{ page.likedCount }}</span></MkButton>
						</div>
						<div class="other">
							<button v-tooltip="i18n.ts.shareWithNote" v-click-anime class="_button" @click="shareWithNote"><i class="fas fa-retweet fa-fw"></i></button>
							<button v-tooltip="i18n.ts.share" v-click-anime class="_button" @click="share"><i class="fas fa-share-alt fa-fw"></i></button>
						</div>
					</div>
					<div class="user">
						<MkAvatar :user="page.user" class="avatar"/>
						<div class="name">
							<MkUserName :user="page.user" style="display: block;"/>
							<MkAcct :user="page.user"/>
						</div>
						<MkFollowButton v-if="!$i || $i.id != page.user.id" :user="page.user" :inline="true" :transparent="false" :full="true" large class="koudoku"/>
					</div>
					<div class="links">
						<MkA :to="`/@${username}/pages/${pageName}/view-source`" class="link">{{ i18n.ts._pages.viewSource }}</MkA>
						<template v-if="$i && $i.id === page.userId">
							<MkA :to="`/pages/edit/${page.id}`" class="link">{{ i18n.ts._pages.editThisPage }}</MkA>
							<button v-if="$i.pinnedPageId === page.id" class="link _textButton" @click="pin(false)">{{ i18n.ts.unpin }}</button>
							<button v-else class="link _textButton" @click="pin(true)">{{ i18n.ts.pin }}</button>
						</template>
					</div>
				</div>
				<div class="footer">
					<div><i class="far fa-clock"></i> {{ i18n.ts.createdAt }}: <MkTime :time="page.createdAt" mode="detail"/></div>
					<div v-if="page.createdAt != page.updatedAt"><i class="far fa-clock"></i> {{ i18n.ts.updatedAt }}: <MkTime :time="page.updatedAt" mode="detail"/></div>
				</div>
				<MkAd :prefer="['horizontal', 'horizontal-big']"/>
				<MkContainer :max-height="300" :foldable="true" class="other">
					<template #header><i class="fas fa-clock"></i> {{ i18n.ts.recentPosts }}</template>
					<MkPagination v-slot="{items}" :pagination="otherPostsPagination">
						<MkPagePreview v-for="page in items" :key="page.id" :page="page" class="_gap"/>
					</MkPagination>
				</MkContainer>
			</div>
			<MkError v-else-if="error" @retry="fetchPage()"/>
			<MkLoading v-else/>
		</transition>
	</MkSpacer>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import { computed, watch } from 'vue';
import XPage from '@/components/page/page.vue';
import MkButton from '@/components/ui/button.vue';
import * as os from '@/os';
import { url } from '@/config';
import MkFollowButton from '@/components/follow-button.vue';
import MkContainer from '@/components/ui/container.vue';
import MkPagination from '@/components/ui/pagination.vue';
import MkPagePreview from '@/components/page-preview.vue';
import { i18n } from '@/i18n';
import { definePageMetadata } from '@/scripts/page-metadata';

const props = defineProps<{
	pageName: string;
	username: string;
}>();

let page = $ref(null);
let error = $ref(null);
const otherPostsPagination = {
	endpoint: 'users/pages' as const,
	limit: 6,
	params: computed(() => ({
		userId: page.user.id,
	})),
};
const path = $computed(() => props.username + '/' + props.pageName);

function fetchPage() {
	page = null;
	os.api('pages/show', {
		name: props.pageName,
		username: props.username,
	}).then(_page => {
		page = _page;
	}).catch(err => {
		error = err;
	});
}

function share() {
	navigator.share({
		title: page.title ?? page.name,
		text: page.summary,
		url: `${url}/@${page.user.username}/pages/${page.name}`,
	});
}

function shareWithNote() {
	os.post({
		initialText: `${page.title || page.name} ${url}/@${page.user.username}/pages/${page.name}`,
	});
}

function like() {
	os.apiWithDialog('pages/like', {
		pageId: page.id,
	}).then(() => {
		page.isLiked = true;
		page.likedCount++;
	});
}

async function unlike() {
	const confirm = await os.confirm({
		type: 'warning',
		text: i18n.ts.unlikeConfirm,
	});
	if (confirm.canceled) return;
	os.apiWithDialog('pages/unlike', {
		pageId: page.id,
	}).then(() => {
		page.isLiked = false;
		page.likedCount--;
	});
}

function pin(pin) {
	os.apiWithDialog('i/update', {
		pinnedPageId: pin ? page.id : null,
	});
}

watch(() => path, fetchPage, { immediate: true });

const headerActions = $computed(() => []);

const headerTabs = $computed(() => []);

definePageMetadata(computed(() => page ? {
	title: computed(() => page.title || page.name),
	avatar: page.user,
	path: `/@${page.user.username}/pages/${page.name}`,
	share: {
		title: page.title || page.name,
		text: page.summary,
	},
} : null));
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

		> .header {
			padding: 16px;

			> h1 {
				margin: 0;
			}
		}

		> .banner {
			> img {
				// TODO: 良い感じのアスペクト比で表示
				display: block;
				width: 100%;
				height: 150px;
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

			> .like {
				> .button {
					--accent: rgb(241 97 132);
					--X8: rgb(241 92 128);
					--buttonBg: rgb(216 71 106 / 5%);
					--buttonHoverBg: rgb(216 71 106 / 10%);
					color: #ff002f;

					::v-deep(.count) {
						margin-left: 0.5em;
					}
				}
			}

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
