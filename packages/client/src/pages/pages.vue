<template>
<MkSpacer>
	<!-- TODO: MkHeaderに統合 -->
	<MkTab v-if="$i" v-model="tab">
		<option value="featured"><i class="fas fa-fire-alt"></i> {{ $ts._pages.featured }}</option>
		<option value="my"><i class="fas fa-edit"></i> {{ $ts._pages.my }}</option>
		<option value="liked"><i class="fas fa-heart"></i> {{ $ts._pages.liked }}</option>
	</MkTab>

	<div class="_section">
		<div v-if="tab === 'featured'" class="rknalgpo _content">
			<MkPagination #default="{items}" :pagination="featuredPagesPagination">
				<MkPagePreview v-for="page in items" :key="page.id" class="ckltabjg" :page="page"/>
			</MkPagination>
		</div>

		<div v-if="tab === 'my'" class="rknalgpo _content my">
			<MkButton class="new" @click="create()"><i class="fas fa-plus"></i></MkButton>
			<MkPagination #default="{items}" :pagination="myPagesPagination">
				<MkPagePreview v-for="page in items" :key="page.id" class="ckltabjg" :page="page"/>
			</MkPagination>
		</div>

		<div v-if="tab === 'liked'" class="rknalgpo _content">
			<MkPagination #default="{items}" :pagination="likedPagesPagination">
				<MkPagePreview v-for="like in items" :key="like.page.id" class="ckltabjg" :page="like.page"/>
			</MkPagination>
		</div>
	</div>
</MkSpacer>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import MkPagePreview from '@/components/page-preview.vue';
import MkPagination from '@/components/ui/pagination.vue';
import MkButton from '@/components/ui/button.vue';
import MkTab from '@/components/tab.vue';
import * as symbols from '@/symbols';

export default defineComponent({
	components: {
		MkPagePreview, MkPagination, MkButton, MkTab
	},
	data() {
		return {
			[symbols.PAGE_INFO]: {
				title: this.$ts.pages,
				icon: 'fas fa-sticky-note',
				bg: 'var(--bg)',
				actions: [{
					icon: 'fas fa-plus',
					text: this.$ts.create,
					handler: this.create,
				}],
			},
			tab: 'featured',
			featuredPagesPagination: {
				endpoint: 'pages/featured',
				noPaging: true,
			},
			myPagesPagination: {
				endpoint: 'i/pages',
				limit: 5,
			},
			likedPagesPagination: {
				endpoint: 'i/page-likes',
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
