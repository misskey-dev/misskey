<template>
<div>
	<portal to="header"><fa :icon="faStickyNote"/>{{ $t('pages') }}</portal>

	<mk-tab v-model:value="tab" :items="[{ label: $t('_pages.my'), value: 'my', icon: faEdit }, { label: $t('_pages.liked'), value: 'liked', icon: faHeart }]"/>

	<div class="rknalgpo my" v-if="tab === 'my'">
		<mk-button class="new" @click="create()"><fa :icon="faPlus"/></mk-button>
		<mk-pagination :pagination="myPagesPagination" #default="{items}">
			<mk-page-preview v-for="page in items" class="ckltabjg" :page="page" :key="page.id"/>
		</mk-pagination>
	</div>

	<div class="rknalgpo" v-if="tab === 'liked'">
		<mk-pagination :pagination="likedPagesPagination" #default="{items}">
			<mk-page-preview v-for="like in items" class="ckltabjg" :page="like.page" :key="like.page.id"/>
		</mk-pagination>
	</div>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faPlus, faEdit } from '@fortawesome/free-solid-svg-icons';
import { faStickyNote, faHeart } from '@fortawesome/free-regular-svg-icons';
import MkPagePreview from '@/components/page-preview.vue';
import MkPagination from '@/components/ui/pagination.vue';
import MkButton from '@/components/ui/button.vue';
import MkTab from '@/components/tab.vue';
import * as os from '@/os';

export default defineComponent({
	components: {
		MkPagePreview, MkPagination, MkButton, MkTab
	},
	data() {
		return {
			tab: 'my',
			myPagesPagination: {
				endpoint: 'i/pages',
				limit: 5,
			},
			likedPagesPagination: {
				endpoint: 'i/page-likes',
				limit: 5,
			},
			faStickyNote, faPlus, faEdit, faHeart
		};
	},
	methods: {
		create() {
			this.$router.push(`/my/pages/new`);
		}
	}
});
</script>

<style lang="scss" scoped>
.rknalgpo {
	padding: 16px;

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
