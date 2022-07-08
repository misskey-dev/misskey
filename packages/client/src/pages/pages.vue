<template>
<MkStickyContainer>
	<template #header><MkPageHeader v-model:tab="tab" :actions="headerActions" :tabs="headerTabs"/></template>
	<MkSpacer :content-max="700">
		<div v-if="tab === 'featured'" class="rknalgpo">
			<MkPagination v-slot="{items}" :pagination="featuredPagesPagination">
				<MkPagePreview v-for="page in items" :key="page.id" class="ckltabjg" :page="page"/>
			</MkPagination>
		</div>

		<div v-else-if="tab === 'my'" class="rknalgpo my">
			<MkButton class="new" @click="create()"><i class="fas fa-plus"></i></MkButton>
			<MkPagination v-slot="{items}" :pagination="myPagesPagination">
				<MkPagePreview v-for="page in items" :key="page.id" class="ckltabjg" :page="page"/>
			</MkPagination>
		</div>

		<div v-else-if="tab === 'liked'" class="rknalgpo">
			<MkPagination v-slot="{items}" :pagination="likedPagesPagination">
				<MkPagePreview v-for="like in items" :key="like.page.id" class="ckltabjg" :page="like.page"/>
			</MkPagination>
		</div>
	</MkSpacer>
</MkStickyContainer>
</template>

<script lang="ts" setup>
import { computed, inject } from 'vue';
import MkPagePreview from '@/components/page-preview.vue';
import MkPagination from '@/components/ui/pagination.vue';
import MkButton from '@/components/ui/button.vue';
import { useRouter } from '@/router';
import { i18n } from '@/i18n';
import { definePageMetadata } from '@/scripts/page-metadata';

const router = useRouter();

let tab = $ref('featured');

const featuredPagesPagination = {
	endpoint: 'pages/featured' as const,
	noPaging: true,
};
const myPagesPagination = {
	endpoint: 'i/pages' as const,
	limit: 5,
};
const likedPagesPagination = {
	endpoint: 'i/page-likes' as const,
	limit: 5,
};

function create() {
	router.push('/pages/new');
}

const headerActions = $computed(() => [{
	icon: 'fas fa-plus',
	text: i18n.ts.create,
	handler: create,
}]);

const headerTabs = $computed(() => [{
	key: 'featured',
	title: i18n.ts._pages.featured,
	icon: 'fas fa-fire-alt',
}, {
	key: 'my',
	title: i18n.ts._pages.my,
	icon: 'fas fa-edit',
}, {
	key: 'liked',
	title: i18n.ts._pages.liked,
	icon: 'fas fa-heart',
}]);

definePageMetadata(computed(() => ({
	title: i18n.ts.pages,
	icon: 'fas fa-sticky-note',
})));
</script>

<style lang="scss" scoped>
.rknalgpo {
	&.my .ckltabjg:first-child {
		margin-top: 16px;
	}

	.ckltabjg:not(:last-child) {
		margin-bottom: 8px;
	}

	@media (min-width: 500px) {
		.ckltabjg:not(:last-child) {
			margin-bottom: 16px;
		}
	}
}
</style>
