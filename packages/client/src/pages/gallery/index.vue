<template>
<div class="xprsixdl _root">
	<MkTab v-if="$i" v-model="tab">
		<option value="explore"><i class="fas fa-icons"></i> {{ $ts.gallery }}</option>
		<option value="liked"><i class="fas fa-heart"></i> {{ $ts._gallery.liked }}</option>
		<option value="my"><i class="fas fa-edit"></i> {{ $ts._gallery.my }}</option>
	</MkTab>

	<div v-if="tab === 'explore'">
		<MkFolder class="_gap">
			<template #header><i class="fas fa-clock"></i>{{ $ts.recentPosts }}</template>
			<MkPagination #default="{items}" :pagination="recentPostsPagination" :disable-auto-load="true">
				<div class="vfpdbgtk">
					<MkGalleryPostPreview v-for="post in items" :key="post.id" :post="post" class="post"/>
				</div>
			</MkPagination>
		</MkFolder>
		<MkFolder class="_gap">
			<template #header><i class="fas fa-fire-alt"></i>{{ $ts.popularPosts }}</template>
			<MkPagination #default="{items}" :pagination="popularPostsPagination" :disable-auto-load="true">
				<div class="vfpdbgtk">
					<MkGalleryPostPreview v-for="post in items" :key="post.id" :post="post" class="post"/>
				</div>
			</MkPagination>
		</MkFolder>
	</div>
	<div v-else-if="tab === 'liked'">
		<MkPagination #default="{items}" :pagination="likedPostsPagination">
			<div class="vfpdbgtk">
				<MkGalleryPostPreview v-for="like in items" :key="like.id" :post="like.post" class="post"/>
			</div>
		</MkPagination>
	</div>
	<div v-else-if="tab === 'my'">
		<MkA to="/gallery/new" class="_link" style="margin: 16px;"><i class="fas fa-plus"></i> {{ $ts.postToGallery }}</MkA>
		<MkPagination #default="{items}" :pagination="myPostsPagination">
			<div class="vfpdbgtk">
				<MkGalleryPostPreview v-for="post in items" :key="post.id" :post="post" class="post"/>
			</div>
		</MkPagination>
	</div>
</div>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue';
import XUserList from '@/components/user-list.vue';
import MkFolder from '@/components/ui/folder.vue';
import MkInput from '@/components/form/input.vue';
import MkButton from '@/components/ui/button.vue';
import MkTab from '@/components/tab.vue';
import MkPagination from '@/components/ui/pagination.vue';
import MkGalleryPostPreview from '@/components/gallery-post-preview.vue';
import number from '@/filters/number';
import * as os from '@/os';
import * as symbols from '@/symbols';

export default defineComponent({
	components: {
		XUserList,
		MkFolder,
		MkInput,
		MkButton,
		MkTab,
		MkPagination,
		MkGalleryPostPreview,
	},

	props: {
		tag: {
			type: String,
			required: false
		}
	},

	data() {
		return {
			[symbols.PAGE_INFO]: {
				title: this.$ts.gallery,
				icon: 'fas fa-icons'
			},
			tab: 'explore',
			recentPostsPagination: {
				endpoint: 'gallery/posts',
				limit: 6,
			},
			popularPostsPagination: {
				endpoint: 'gallery/featured',
				limit: 5,
			},
			myPostsPagination: {
				endpoint: 'i/gallery/posts',
				limit: 5,
			},
			likedPostsPagination: {
				endpoint: 'i/gallery/likes',
				limit: 5,
			},
			tags: [],
		};
	},

	computed: {
		meta() {
			return this.$instance;
		},
		tagUsers(): any {
			return {
				endpoint: 'hashtags/users',
				limit: 30,
				params: {
					tag: this.tag,
					origin: 'combined',
					sort: '+follower',
				}
			};
		},
	},

	watch: {
		tag() {
			if (this.$refs.tags) this.$refs.tags.toggleContent(this.tag == null);
		},
	},

	created() {

	},

	methods: {

	}
});
</script>

<style lang="scss" scoped>
.xprsixdl {
	max-width: 1400px;
	margin: 0 auto;
}

.vfpdbgtk {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
	grid-gap: 12px;
	margin: 0 var(--margin);

	> .post {

	}
}
</style>
