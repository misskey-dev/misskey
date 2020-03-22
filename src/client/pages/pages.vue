<template>
<div>
	<portal to="icon"><fa :icon="faStickyNote"/></portal>
	<portal to="title">{{ $t('pages') }}</portal>

	<mk-container :body-togglable="true">
		<template #header><fa :icon="faEdit" fixed-width/>{{ $t('_pages.my') }}</template>
		<div class="rknalgpo my">
			<mk-button class="new" @click="create()"><fa :icon="faPlus"/></mk-button>
			<mk-pagination :pagination="myPagesPagination" #default="{items}">
				<mk-page-preview v-for="page in items" class="ckltabjg" :page="page" :key="page.id"/>
			</mk-pagination>
		</div>
	</mk-container>

	<mk-container :body-togglable="true">
		<template #header><fa :icon="faHeart" fixed-width/>{{ $t('_pages.liked') }}</template>
		<div class="rknalgpo">
			<mk-pagination :pagination="likedPagesPagination" #default="{items}">
				<mk-page-preview v-for="like in items" class="ckltabjg" :page="like.page" :key="like.page.id"/>
			</mk-pagination>
		</div>
	</mk-container>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import { faPlus, faEdit } from '@fortawesome/free-solid-svg-icons';
import { faStickyNote, faHeart } from '@fortawesome/free-regular-svg-icons';
import i18n from '../i18n';
import MkPagePreview from '../components/page-preview.vue';
import MkPagination from '../components/ui/pagination.vue';
import MkButton from '../components/ui/button.vue';
import MkContainer from '../components/ui/container.vue';

export default Vue.extend({
	i18n,
	components: {
		MkPagePreview, MkPagination, MkButton, MkContainer
	},
	data() {
		return {
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
