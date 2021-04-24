<template>
<div class="xprsixdl _root">
	<MkTab v-model:value="tab" v-if="$i">
		<option value="explore"><i class="fas fa-icons"></i> {{ $ts.gallery }}</option>
		<option value="my"><i class="fas fa-edit"></i> {{ $ts._gallery.my }}</option>
		<option value="liked"><i class="fas fa-heart"></i> {{ $ts._gallery.liked }}</option>
	</MkTab>

	<div v-if="tab === 'explore'">
		<MkFolder class="_gap">
			<template #header><i class="fas fa-clock"></i>{{ $ts.recentPosts }}</template>
			<MkPagination :pagination="recentPostsPagination" #default="{items}">
				<div class="vfpdbgtk">
					<MkGalleryPostPreview v-for="post in items" :post="post" :key="post.id" class="post"/>
				</div>
			</MkPagination>
		</MkFolder>
		<MkFolder class="_gap">
			<template #header><i class="fas fa-fire-alt"></i>{{ $ts.popularPosts }}</template>
			
		</MkFolder>
	</div>
	<div v-else-if="tab === 'my'">
		<MkA to="/gallery/new"><i class="fas fa-plus"></i> {{ $ts.postToGallery }}</MkA>
		<MkPagination :pagination="myPostsPagination" #default="{items}">
			<div class="vfpdbgtk">
				<MkGalleryPostPreview v-for="post in items" :post="post" :key="post.id" class="post"/>
			</div>
		</MkPagination>
	</div>
</div>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue';
import XUserList from '@client/components/user-list.vue';
import MkFolder from '@client/components/ui/folder.vue';
import MkInput from '@client/components/ui/input.vue';
import MkButton from '@client/components/ui/button.vue';
import MkTab from '@client/components/tab.vue';
import MkPagination from '@client/components/ui/pagination.vue';
import MkGalleryPostPreview from '@client/components/gallery-post-preview.vue';
import number from '@client/filters/number';
import * as os from '@client/os';
import * as symbols from '@client/symbols';

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
