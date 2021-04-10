<template>
<div>
	<MkTab v-model:value="tab" v-if="$i">
		<option value="featured"><Fa :icon="faFireAlt"/> {{ $ts._pages.featured }}</option>
		<option value="my"><Fa :icon="faEdit"/> {{ $ts._pages.my }}</option>
		<option value="liked"><Fa :icon="faHeart"/> {{ $ts._pages.liked }}</option>
	</MkTab>

	<div class="_section">
		<div class="rknalgpo _content" v-if="tab === 'featured'">
			<MkPagination :pagination="featuredPagesPagination" #default="{items}">
				<MkPagePreview v-for="page in items" class="ckltabjg" :page="page" :key="page.id"/>
			</MkPagination>
		</div>

		<div class="rknalgpo _content my" v-if="tab === 'my'">
			<MkButton class="new" @click="create()"><Fa :icon="faPlus"/></MkButton>
			<MkPagination :pagination="myPagesPagination" #default="{items}">
				<MkPagePreview v-for="page in items" class="ckltabjg" :page="page" :key="page.id"/>
			</MkPagination>
		</div>

		<div class="rknalgpo _content" v-if="tab === 'liked'">
			<MkPagination :pagination="likedPagesPagination" #default="{items}">
				<MkPagePreview v-for="like in items" class="ckltabjg" :page="like.page" :key="like.page.id"/>
			</MkPagination>
		</div>
	</div>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faPlus, faEdit, faFireAlt } from '@fortawesome/free-solid-svg-icons';
import { faStickyNote, faHeart } from '@fortawesome/free-regular-svg-icons';
import MkPagePreview from '@client/components/page-preview.vue';
import MkPagination from '@client/components/ui/pagination.vue';
import MkButton from '@client/components/ui/button.vue';
import MkTab from '@client/components/tab.vue';
import * as symbols from '@client/symbols';

export default defineComponent({
	components: {
		MkPagePreview, MkPagination, MkButton, MkTab
	},
	data() {
		return {
			[symbols.PAGE_INFO]: {
				title: this.$ts.pages,
				icon: faStickyNote,
				action: {
					icon: faPlus,
					handler: this.create
				}
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
			faStickyNote, faPlus, faEdit, faHeart, faFireAlt
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
