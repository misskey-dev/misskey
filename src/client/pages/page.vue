<template>
<div class="_root">
	<transition name="fade" mode="out-in">
		<div v-if="page" class="xcukqgmh" :key="page.id" v-size="{ max: [450] }">
			<div class="_block main">
				<!--
				<div class="header">
					<h1>{{ page.title }}</h1>
				</div>
				-->
				<div class="banner">
					<img :src="page.eyeCatchingImage.url" v-if="page.eyeCatchingImageId"/>
				</div>
				<div class="content">
					<XPage :page="page"/>
				</div>
				<div class="actions">
					<div class="like">
						<MkButton class="button" @click="unlike()" v-if="page.isLiked" v-tooltip="$ts._pages.unlike" primary><i class="fas fa-heart"></i><span class="count" v-if="page.likedCount > 0">{{ page.likedCount }}</span></MkButton>
						<MkButton class="button" @click="like()" v-else v-tooltip="$ts._pages.like"><i class="far fa-heart"></i><span class="count" v-if="page.likedCount > 0">{{ page.likedCount }}</span></MkButton>
					</div>
					<div class="other">
						<button class="_button" @click="shareWithNote" v-tooltip="$ts.shareWithNote" v-click-anime><i class="fas fa-retweet fa-fw"></i></button>
						<button class="_button" @click="share" v-tooltip="$ts.share" v-click-anime><i class="fas fa-share-alt fa-fw"></i></button>
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
					<MkA :to="`/@${username}/pages/${pageName}/view-source`" class="link">{{ $ts._pages.viewSource }}</MkA>
					<template v-if="$i && $i.id === page.userId">
						<MkA :to="`/pages/edit/${page.id}`" class="link">{{ $ts._pages.editThisPage }}</MkA>
						<button v-if="$i.pinnedPageId === page.id" @click="pin(false)" class="link _textButton">{{ $ts.unpin }}</button>
						<button v-else @click="pin(true)" class="link _textButton">{{ $ts.pin }}</button>
					</template>
				</div>
			</div>
			<div class="footer">
				<div><i class="far fa-clock"></i> {{ $ts.createdAt }}: <MkTime :time="page.createdAt" mode="detail"/></div>
				<div v-if="page.createdAt != page.updatedAt"><i class="far fa-clock"></i> {{ $ts.updatedAt }}: <MkTime :time="page.updatedAt" mode="detail"/></div>
			</div>
			<MkAd :prefer="['horizontal', 'horizontal-big']"/>
			<MkContainer :max-height="300" :foldable="true" class="other">
				<template #header><i class="fas fa-clock"></i> {{ $ts.recentPosts }}</template>
				<MkPagination :pagination="otherPostsPagination" #default="{items}">
					<MkPagePreview v-for="page in items" :page="page" :key="page.id" class="_gap"/>
				</MkPagination>
			</MkContainer>
		</div>
		<MkError v-else-if="error" @retry="fetch()"/>
		<MkLoading v-else/>
	</transition>
</div>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue';
import XPage from '@client/components/page/page.vue';
import MkButton from '@client/components/ui/button.vue';
import * as os from '@client/os';
import * as symbols from '@client/symbols';
import { url } from '@client/config';
import MkFollowButton from '@client/components/follow-button.vue';
import MkContainer from '@client/components/ui/container.vue';
import MkPagination from '@client/components/ui/pagination.vue';
import MkPagePreview from '@client/components/page-preview.vue';

export default defineComponent({
	components: {
		XPage,
		MkButton,
		MkFollowButton,
		MkContainer,
		MkPagination,
		MkPagePreview,
	},

	props: {
		pageName: {
			type: String,
			required: true
		},
		username: {
			type: String,
			required: true
		},
	},

	data() {
		return {
			[symbols.PAGE_INFO]: computed(() => this.page ? {
				title: computed(() => this.page.title || this.page.name),
				avatar: this.page.user,
				path: `/@${this.page.user.username}/pages/${this.page.name}`,
				share: {
					title: this.page.title || this.page.name,
					text: this.page.summary,
				},
			} : null),
			page: null,
			error: null,
			otherPostsPagination: {
				endpoint: 'users/pages',
				limit: 6,
				params: () => ({
					userId: this.page.user.id
				})
			},
		};
	},

	computed: {
		path(): string {
			return this.username + '/' + this.pageName;
		}
	},

	watch: {
		path() {
			this.fetch();
		}
	},

	created() {
		this.fetch();
	},

	methods: {
		fetch() {
			this.page = null;
			os.api('pages/show', {
				name: this.pageName,
				username: this.username,
			}).then(page => {
				this.page = page;
			}).catch(e => {
				this.error = e;
			});
		},

		share() {
			navigator.share({
				title: this.page.title || this.page.name,
				text: this.page.summary,
				url: `${url}/@${this.page.user.username}/pages/${this.page.name}`
			});
		},

		shareWithNote() {
			os.post({
				initialText: `${this.page.title || this.page.name} ${url}/@${this.page.user.username}/pages/${this.page.name}`
			});
		},

		like() {
			os.apiWithDialog('pages/like', {
				pageId: this.page.id,
			}).then(() => {
				this.page.isLiked = true;
				this.page.likedCount++;
			});
		},

		async unlike() {
			const confirm = await os.dialog({
				type: 'warning',
				showCancelButton: true,
				text: this.$ts.unlikeConfirm,
			});
			if (confirm.canceled) return;
			os.apiWithDialog('pages/unlike', {
				pageId: this.page.id,
			}).then(() => {
				this.page.isLiked = false;
				this.page.likedCount--;
			});
		},

		pin(pin) {
			os.apiWithDialog('i/update', {
				pinnedPageId: pin ? this.page.id : null,
			});
		}
	}
});
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
	--padding: 32px;

	&.max-width_450px {
		--padding: 16px;
	}

	> .main {
		padding: var(--padding);

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
		margin: var(--padding);
		font-size: 85%;
		opacity: 0.75;
	}
}
</style>
