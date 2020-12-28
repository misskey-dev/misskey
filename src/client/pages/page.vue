<template>
<div class="xcukqgmh" v-if="page" :key="page.id">
	<div class="_section main">
		<div class="_content">
			<div class="banner">
				<img :src="page.eyeCatchingImage.url" v-if="page.eyeCatchingImageId"/>
			</div>
			<div>
				<XPage :page="page"/>
				<small style="display: block; opacity: 0.7; margin-top: 1em;">@{{ page.user.username }}</small>
			</div>
		</div>
	</div>
	<div class="_section like">
		<div class="_content">
			<button class="_button" @click="unlike()" v-if="page.isLiked" :title="$ts._pages.unlike"><Fa :icon="faHeartS"/></button>
			<button class="_button" @click="like()" v-else :title="$ts._pages.like"><Fa :icon="faHeartR"/></button>
			<span class="count" v-if="page.likedCount > 0">{{ page.likedCount }}</span>
		</div>
	</div>
	<div class="_section links">
		<div class="_content">
			<MkA :to="`./${page.name}/view-source`" class="link">{{ $ts._pages.viewSource }}</MkA>
			<template v-if="$i && $i.id === page.userId">
				<MkA :to="`/pages/edit/${page.id}`" class="link">{{ $ts._pages.editThisPage }}</MkA>
				<button v-if="$i.pinnedPageId === page.id" @click="pin(false)" class="link _textButton">{{ $ts.unpin }}</button>
				<button v-else @click="pin(true)" class="link _textButton">{{ $ts.pin }}</button>
			</template>
		</div>
	</div>
</div>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue';
import { faHeart as faHeartS } from '@fortawesome/free-solid-svg-icons';
import { faHeart as faHeartR } from '@fortawesome/free-regular-svg-icons';
import XPage from '@/components/page/page.vue';
import * as os from '@/os';

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
			INFO: computed(() => this.page ? {
				title: computed(() => this.page.title || this.page.name),
				avatar: this.page.user,
			} : null),
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
			os.api('pages/show', {
				name: this.pageName,
				username: this.username,
			}).then(page => {
				this.page = page;
			});
		},

		like() {
			os.api('pages/like', {
				pageId: this.page.id,
			}).then(() => {
				this.page.isLiked = true;
				this.page.likedCount++;
			});
		},

		unlike() {
			os.api('pages/unlike', {
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
.xcukqgmh {
	> .main {
		> ._content {
			> .banner {
				> img {
					display: block;
					width: 100%;
					height: 120px;
					object-fit: cover;
				}
			}
		}
	}

	> .links {
		> ._content {
			> .link {
				margin-right: 0.75em;
			}
		}
	}
}
</style>
