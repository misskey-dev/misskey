<template>
<div>
	<ui-container :body-togglable="true">
		<template #header><fa :icon="faEdit" fixed-width/>{{ $t('my-pages') }}</template>
		<div class="rknalgpo" v-if="!fetching">
			<ui-button class="new" @click="create()"><fa :icon="faPlus"/></ui-button>
			<sequential-entrance animation="entranceFromTop" delay="25" tag="div" class="pages">
				<x-page-preview v-for="page in pages" class="page" :page="page" :key="page.id"/>
			</sequential-entrance>
			<ui-button v-if="existMore" @click="fetchMore()" style="margin-top:16px;">{{ $t('@.load-more') }}</ui-button>
		</div>
	</ui-container>

	<ui-container :body-togglable="true">
		<template #header><fa :icon="faHeart" fixed-width/>{{ $t('liked-pages') }}</template>
		<div class="rknalgpo" v-if="!fetching">
			<sequential-entrance animation="entranceFromTop" delay="25" tag="div" class="pages">
				<x-page-preview v-for="like in likes" class="page" :page="like.page" :key="like.page.id"/>
			</sequential-entrance>
			<ui-button v-if="existMoreLikes" @click="fetchMoreLiked()">{{ $t('@.load-more') }}</ui-button>
		</div>
	</ui-container>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import { faPlus, faEdit } from '@fortawesome/free-solid-svg-icons';
import { faStickyNote, faHeart } from '@fortawesome/free-regular-svg-icons';
import i18n from '../../../i18n';
import Progress from '../../scripts/loading';
import XPagePreview from '../../views/components/page-preview.vue';

export default Vue.extend({
	i18n: i18n('pages'),
	components: {
		XPagePreview
	},
	data() {
		return {
			fetching: true,
			pages: [],
			existMore: false,
			moreFetching: false,
			likes: [],
			existMoreLikes: false,
			moreLikesFetching: false,
			faStickyNote, faPlus, faEdit, faHeart
		};
	},
	created() {
		this.fetch();

		this.$emit('init', {
			title: this.$t('@.pages'),
			icon: faStickyNote
		});
	},
	methods: {
		async fetch() {
			Progress.start();
			this.fetching = true;

			const pages = await this.$root.api('i/pages', {
				limit: 11
			});

			if (pages.length == 11) {
				this.existMore = true;
				pages.pop();
			}

			const likes = await this.$root.api('i/page-likes', {
				limit: 11
			});

			if (likes.length == 11) {
				this.existMoreLikes = true;
				likes.pop();
			}

			this.pages = pages;
			this.likes = likes;
			this.fetching = false;

			Progress.done();
		},
		fetchMore() {
			this.moreFetching = true;
			this.$root.api('i/pages', {
				limit: 11,
				untilId: this.pages[this.pages.length - 1].id
			}).then(pages => {
				if (pages.length == 11) {
					this.existMore = true;
					pages.pop();
				} else {
					this.existMore = false;
				}

				this.pages = this.pages.concat(pages);
				this.moreFetching = false;
			});
		},
		fetchMoreLiked() {
			this.moreLikesFetching = true;
			this.$root.api('i/page-likes', {
				limit: 11,
				untilId: this.likes[this.likes.length - 1].id
			}).then(pages => {
				if (pages.length == 11) {
					this.existMoreLikes = true;
					pages.pop();
				} else {
					this.existMoreLikes = false;
				}

				this.likes = this.likes.concat(pages);
				this.moreLikesFetching = false;
			});
		},
		create() {
			this.$router.push(`/i/pages/new`);
		}
	}
});
</script>

<style lang="stylus" scoped>
.rknalgpo
	padding 16px

	> .new
		margin-bottom 16px

	> * > .page:not(:last-child)
		margin-bottom 8px

	@media (min-width 500px)
		> * > .page:not(:last-child)
			margin-bottom 16px

</style>
