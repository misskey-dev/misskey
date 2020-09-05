<template>
<div class="xcukqgmh">
	<portal to="header" v-if="page"><mk-avatar class="avatar" :user="page.user" :disable-preview="true"/>{{ page.title || page.name }}</portal>

	<div class="_card" v-if="page" :key="page.id">
		<div class="_title">{{ page.title }}</div>
		<div class="banner">
			<img :src="page.eyeCatchingImage.url" v-if="page.eyeCatchingImageId"/>
		</div>
		<div class="_content">
			<x-page :page="page"/>
		</div>
		<div class="_footer">
			<small>@{{ page.user.username }}</small>
			<template v-if="$store.getters.isSignedIn && $store.state.i.id === page.userId">
				<router-link :to="`/my/pages/edit/${page.id}`">{{ $t('_pages.editThisPage') }}</router-link>
				<a v-if="$store.state.i.pinnedPageId === page.id" @click="pin(false)">{{ $t('unpin') }}</a>
				<a v-else @click="pin(true)">{{ $t('pin') }}</a>
			</template>
			<router-link :to="`./${page.name}/view-source`">{{ $t('_pages.viewSource') }}</router-link>
			<div class="like">
				<button class="_button" @click="unlike()" v-if="page.isLiked" :title="$t('_pages.unlike')"><fa :icon="faHeartS"/></button>
				<button class="_button" @click="like()" v-else :title="$t('_pages.like')"><fa :icon="faHeartR"/></button>
				<span class="count" v-if="page.likedCount > 0">{{ page.likedCount }}</span>
			</div>
		</div>
	</div>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faHeart as faHeartS } from '@fortawesome/free-solid-svg-icons';
import { faHeart as faHeartR } from '@fortawesome/free-regular-svg-icons';
import XPage from '../components/page/page.vue';

export default defineComponent({
	components: {
		XPage
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
			page: null,
			faHeartS, faHeartR
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
			this.$root.api('pages/show', {
				name: this.pageName,
				username: this.username,
			}).then(page => {
				this.page = page;
			});
		},

		like() {
			this.$root.api('pages/like', {
				pageId: this.page.id,
			}).then(() => {
				this.page.isLiked = true;
				this.page.likedCount++;
			});
		},

		unlike() {
			this.$root.api('pages/unlike', {
				pageId: this.page.id,
			}).then(() => {
				this.page.isLiked = false;
				this.page.likedCount--;
			});
		},

		pin(pin) {
			this.$root.api('i/update', {
				pinnedPageId: pin ? this.page.id : null,
			}).then(() => {
				this.$root.showDialog({
					type: 'success',
					iconOnly: true, autoClose: true
				});
			});
		}
	}
});
</script>

<style lang="scss" scoped>
.xcukqgmh {
	> ._card {
		> .banner {
			> img {
				display: block;
				width: 100%;
				height: 120px;
				object-fit: cover;
			}
		}

		> ._footer {
			> * {
				margin: 0 0.5em;
			}
		}
	}
}
</style>
