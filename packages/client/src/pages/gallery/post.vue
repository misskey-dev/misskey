<template>
<div class="_root">
	<transition name="fade" mode="out-in">
		<div v-if="post" class="rkxwuolj">
			<div class="files">
				<div v-for="file in post.files" :key="file.id" class="file">
					<img :src="file.url"/>
				</div>
			</div>
			<div class="body _block">
				<div class="title">{{ post.title }}</div>
				<div class="description"><Mfm :text="post.description"/></div>
				<div class="info">
					<i class="fas fa-clock"></i> <MkTime :time="post.createdAt" mode="detail"/>
				</div>
				<div class="actions">
					<div class="like">
						<MkButton v-if="post.isLiked" v-tooltip="$ts._gallery.unlike" class="button" primary @click="unlike()"><i class="fas fa-heart"></i><span v-if="post.likedCount > 0" class="count">{{ post.likedCount }}</span></MkButton>
						<MkButton v-else v-tooltip="$ts._gallery.like" class="button" @click="like()"><i class="far fa-heart"></i><span v-if="post.likedCount > 0" class="count">{{ post.likedCount }}</span></MkButton>
					</div>
					<div class="other">
						<button v-if="$i && $i.id === post.user.id" v-tooltip="$ts.edit" v-click-anime class="_button" @click="edit"><i class="fas fa-pencil-alt fa-fw"></i></button>
						<button v-tooltip="$ts.shareWithNote" v-click-anime class="_button" @click="shareWithNote"><i class="fas fa-retweet fa-fw"></i></button>
						<button v-tooltip="$ts.share" v-click-anime class="_button" @click="share"><i class="fas fa-share-alt fa-fw"></i></button>
					</div>
				</div>
				<div class="user">
					<MkAvatar :user="post.user" class="avatar"/>
					<div class="name">
						<MkUserName :user="post.user" style="display: block;"/>
						<MkAcct :user="post.user"/>
					</div>
					<MkFollowButton v-if="!$i || $i.id != post.user.id" :user="post.user" :inline="true" :transparent="false" :full="true" large class="koudoku"/>
				</div>
			</div>
			<MkAd :prefer="['horizontal', 'horizontal-big']"/>
			<MkContainer :max-height="300" :foldable="true" class="other">
				<template #header><i class="fas fa-clock"></i> {{ $ts.recentPosts }}</template>
				<MkPagination v-slot="{items}" :pagination="otherPostsPagination">
					<div class="sdrarzaf">
						<MkGalleryPostPreview v-for="post in items" :key="post.id" :post="post" class="post"/>
					</div>
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
import MkButton from '@/components/ui/button.vue';
import * as os from '@/os';
import * as symbols from '@/symbols';
import MkContainer from '@/components/ui/container.vue';
import ImgWithBlurhash from '@/components/img-with-blurhash.vue';
import MkPagination from '@/components/ui/pagination.vue';
import MkGalleryPostPreview from '@/components/gallery-post-preview.vue';
import MkFollowButton from '@/components/follow-button.vue';
import { url } from '@/config';

export default defineComponent({
	components: {
		MkContainer,
		ImgWithBlurhash,
		MkPagination,
		MkGalleryPostPreview,
		MkButton,
		MkFollowButton,
	},
	props: {
		postId: {
			type: String,
			required: true
		}
	},
	data() {
		return {
			[symbols.PAGE_INFO]: computed(() => this.post ? {
				title: this.post.title,
				avatar: this.post.user,
				path: `/gallery/${this.post.id}`,
				share: {
					title: this.post.title,
					text: this.post.description,
				},
				actions: [{
					icon: 'fas fa-pencil-alt',
					text: this.$ts.edit,
					handler: this.edit
				}]
			} : null),
			otherPostsPagination: {
				endpoint: 'users/gallery/posts',
				limit: 6,
				params: () => ({
					userId: this.post.user.id
				})
			},
			post: null,
			error: null,
		};
	},

	watch: {
		postId: 'fetch'
	},

	created() {
		this.fetch();
	},

	methods: {
		fetch() {
			this.post = null;
			os.api('gallery/posts/show', {
				postId: this.postId
			}).then(post => {
				this.post = post;
			}).catch(e => {
				this.error = e;
			});
		},

		share() {
			navigator.share({
				title: this.post.title,
				text: this.post.description,
				url: `${url}/gallery/${this.post.id}`
			});
		},

		shareWithNote() {
			os.post({
				initialText: `${this.post.title} ${url}/gallery/${this.post.id}`
			});
		},

		like() {
			os.apiWithDialog('gallery/posts/like', {
				postId: this.postId,
			}).then(() => {
				this.post.isLiked = true;
				this.post.likedCount++;
			});
		},

		async unlike() {
			const confirm = await os.confirm({
				type: 'warning',
				text: this.$ts.unlikeConfirm,
			});
			if (confirm.canceled) return;
			os.apiWithDialog('gallery/posts/unlike', {
				postId: this.postId,
			}).then(() => {
				this.post.isLiked = false;
				this.post.likedCount--;
			});
		},

		edit() {
			this.$router.push(`/gallery/${this.post.id}/edit`);
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

.rkxwuolj {
	> .files {
		> .file {
			> img {
				display: block;
				max-width: 100%;
				max-height: 500px;
				margin: 0 auto;
			}

			& + .file {
				margin-top: 16px;
			}
		}
	}

	> .body {
		padding: 32px;

		> .title {
			font-weight: bold;
			font-size: 1.2em;
			margin-bottom: 16px;
		}

		> .info {
			margin-top: 16px;
			font-size: 90%;
			opacity: 0.7;
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
	}
}

.sdrarzaf {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
	grid-gap: 12px;
	margin: var(--margin);

	> .post {

	}
}
</style>
