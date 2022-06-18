<template>
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
</template>

<script lang="ts" setup>
import { computed, inject } from 'vue';
import MkPagePreview from '@/components/page-preview.vue';
import MkPagination from '@/components/ui/pagination.vue';
import MkButton from '@/components/ui/button.vue';
import * as symbols from '@/symbols';
import { mainRouter } from '@/router';
import { Router } from '@/nirax';
import { i18n } from '@/i18n';
import { definePageMetadata } from '@/scripts/page-metadata';

const router: Router = inject('router') ?? mainRouter;

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

definePageMetadata(computed(() => ({
	title: i18n.ts.pages,
	icon: 'fas fa-sticky-note',
	bg: 'var(--bg)',
	actions: [{
		icon: 'fas fa-plus',
		text: i18n.ts.create,
		handler: create,
	}],
	tabs: [{
		active: tab === 'featured',
		title: i18n.ts._pages.featured,
		icon: 'fas fa-fire-alt',
		onClick: () => { tab = 'featured'; },
	}, {
		active: tab === 'my',
		title: i18n.ts._pages.my,
		icon: 'fas fa-edit',
		onClick: () => { tab = 'my'; },
	}, {
		active: tab === 'liked',
		title: i18n.ts._pages.liked,
		icon: 'fas fa-heart',
		onClick: () => { tab = 'liked'; },
	}],
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
