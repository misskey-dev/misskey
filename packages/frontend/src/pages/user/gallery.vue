<template>
<MkSpacer :content-max="700">
	<MkPagination v-slot="{items}" :pagination="pagination">
		<div class="jrnovfpt">
			<MkGalleryPostPreview v-for="post in items" :key="post.id" :post="post" class="post"/>
		</div>
	</MkPagination>
</MkSpacer>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import * as misskey from 'misskey-js';
import MkGalleryPostPreview from '@/components/MkGalleryPostPreview.vue';
import MkPagination from '@/components/MkPagination.vue';

const props = withDefaults(defineProps<{
	user: misskey.entities.User;
}>(), {
});

const pagination = {
	endpoint: 'users/gallery/posts' as const,
	limit: 6,
	params: computed(() => ({
		userId: props.user.id,
	})),
};
</script>

<style lang="scss" scoped>
.jrnovfpt {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
	grid-gap: 12px;
	margin: var(--margin);
}
</style>
