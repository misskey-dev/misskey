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

<script lang="ts">
import { computed, defineComponent } from 'vue';
import MkPagePreview from '@/components/page-preview.vue';
import MkPagination from '@/components/ui/pagination.vue';
import MkButton from '@/components/ui/button.vue';
import * as symbols from '@/symbols';

export default defineComponent({
	components: {
		MkPagePreview, MkPagination, MkButton
	},
	data() {
		return {
			[symbols.PAGE_INFO]: computed(() => ({
				title: this.$ts.pages,
				icon: 'fas fa-sticky-note',
				bg: 'var(--bg)',
				actions: [{
					icon: 'fas fa-plus',
					text: this.$ts.create,
					handler: this.create,
				}],
				tabs: [{
					active: this.tab === 'featured',
					title: this.$ts._pages.featured,
					icon: 'fas fa-fire-alt',
					onClick: () => { this.tab = 'featured'; },
				}, {
					active: this.tab === 'my',
					title: this.$ts._pages.my,
					icon: 'fas fa-edit',
					onClick: () => { this.tab = 'my'; },
				}, {
					active: this.tab === 'liked',
					title: this.$ts._pages.liked,
					icon: 'fas fa-heart',
					onClick: () => { this.tab = 'liked'; },
				},]
			})),
			tab: 'featured',
			featuredPagesPagination: {
				endpoint: 'pages/featured' as const,
				noPaging: true,
			},
			myPagesPagination: {
				endpoint: 'i/pages' as const,
				limit: 5,
			},
			likedPagesPagination: {
				endpoint: 'i/page-likes' as const,
				limit: 5,
			},
		};
	},
	methods: {
		create() {
			this.$router.push(`/pages/new`);
		}
	}
});
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
