<template>
<mk-ui>
	<main v-if="!fetching">
		<ui-button @click="create()"><fa :icon="faPlus"/></ui-button>
		<sequential-entrance animation="entranceFromTop" delay="25">
			<template v-for="page in pages">
				<x-page-preview class="page" :page="page" :key="page.id"/>
			</template>
		</sequential-entrance>
		<ui-button v-if="existMore" @click="fetchMore()">{{ $t('@.load-more') }}</ui-button>
	</main>
</mk-ui>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';
import Progress from '../../../common/scripts/loading';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { faStickyNote } from '@fortawesome/free-regular-svg-icons';
import XPagePreview from '../../../common/views/components/page-preview.vue';

export default Vue.extend({
	i18n: i18n(),
	components: {
		XPagePreview
	},
	data() {
		return {
			fetching: true,
			pages: [],
			existMore: false,
			moreFetching: false,
			faStickyNote, faPlus
		};
	},
	created() {
		this.fetch();
	},
	methods: {
		fetch() {
			Progress.start();
			this.fetching = true;

			this.$root.api('i/pages', {
				limit: 11
			}).then(pages => {
				if (pages.length == 11) {
					this.existMore = true;
					pages.pop();
				}

				this.pages = pages;
				this.fetching = false;

				Progress.done();
			});
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
		create() {
			this.$router.push(`/i/pages/new`);
		}
	}
});
</script>

<style lang="stylus" scoped>
main
	margin 0 auto
	padding 16px
	max-width 950px

	> * > .page
		margin-bottom 8px

	@media (min-width 500px)
		> * > .page
			margin-bottom 16px

</style>
