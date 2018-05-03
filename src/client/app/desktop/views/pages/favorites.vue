<template>
<mk-ui>
	<main v-if="!fetching">
		<template v-for="favorite in favorites">
			<mk-note-detail :note="favorite.note" :key="favorite.note.id"/>
		</template>
		<a v-if="existMore" @click="more">さらに読み込む</a>
	</main>
</mk-ui>
</template>

<script lang="ts">
import Vue from 'vue';
import Progress from '../../../common/scripts/loading';

export default Vue.extend({
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

			(this as any).api('i/favorites', {
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
			(this as any).api('i/favorites', {
				limit: 11,
				maxId: this.favorites[this.favorites.length - 1].id
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
main
	margin 0 auto
	padding 16px
	max-width 700px
</style>
