<template>
<div class="ecsvsegy" v-if="!fetching">
	<sequential-entrance animation="entranceFromTop" delay="25">
		<template v-for="favorite in favorites">
			<mk-note-detail class="post" :note="favorite.note" :key="favorite.note.id"/>
		</template>
	</sequential-entrance>
	<div class="more" v-if="existMore">
		<ui-button inline @click="more">{{ $t('@.load-more') }}</ui-button>
	</div>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';
import Progress from '../../../common/scripts/loading';

export default Vue.extend({
	i18n: i18n('.vue'),
	data() {
		return {
			fetching: true,
			favorites: [],
			existMore: false,
			moreFetching: false
		};
	},
	created() {
		this.fetch();
	},
	methods: {
		fetch() {
			Progress.start();
			this.fetching = true;

			this.$root.api('i/favorites', {
				limit: 11
			}).then(favorites => {
				if (favorites.length == 11) {
					this.existMore = true;
					favorites.pop();
				}

				this.favorites = favorites;
				this.fetching = false;

				Progress.done();
			});
		},
		more() {
			this.moreFetching = true;
			this.$root.api('i/favorites', {
				limit: 11,
				untilId: this.favorites[this.favorites.length - 1].id
			}).then(favorites => {
				if (favorites.length == 11) {
					this.existMore = true;
					favorites.pop();
				} else {
					this.existMore = false;
				}

				this.favorites = this.favorites.concat(favorites);
				this.moreFetching = false;
			});
		}
	}
});
</script>

<style lang="stylus" scoped>
.ecsvsegy
	margin 0 auto

	> * > .post
		margin-bottom 16px

	> .more
		margin 32px 16px 16px 16px
		text-align center

</style>
