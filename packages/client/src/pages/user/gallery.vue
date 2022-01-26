<template>
<div>
	<MkPagination v-slot="{items}" :pagination="pagination">
		<div class="jrnovfpt">
			<MkGalleryPostPreview v-for="post in items" :key="post.id" :post="post" class="post"/>
		</div>
	</MkPagination>
</div>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue';
import MkGalleryPostPreview from '@/components/gallery-post-preview.vue';
import MkPagination from '@/components/ui/pagination.vue';

export default defineComponent({
	components: {
		MkPagination,
		MkGalleryPostPreview,
	},

	props: {
		user: {
			type: Object,
			required: true
		},
	},

	data() {
		return {
			pagination: {
				endpoint: 'users/gallery/posts' as const,
				limit: 6,
				params: computed(() => ({
					userId: this.user.id
				})),
			},
		};
	},
});
</script>

<style lang="scss" scoped>
.jrnovfpt {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
	grid-gap: 12px;
	margin: var(--margin);
}
</style>
