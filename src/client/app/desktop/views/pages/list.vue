<template>
<mk-ui>
	<header :class="$style.header">
		<h1>{{ list.title }}</h1>
	</header>
	<mk-list-timeline :list="list"/>
</mk-ui>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
	data() {
		return {
			fetching: true,
			list: null
		};
	},
	watch: {
		$route: 'fetch'
	},
	mounted() {
		this.fetch();
	},
	methods: {
		fetch() {
			this.fetching = true;

			(this as any).api('users/lists/show', {
				id: this.$route.params.list
			}).then(list => {
				this.list = list;
				this.fetching = false;
			});
		}
	}
});
</script>

<style lang="stylus" module>
.header
	width 100%
	max-width 600px
	margin 0 auto
	color #555

.notes
	max-width 600px
	margin 0 auto
	border solid 1px rgba(0, 0, 0, 0.075)
	border-radius 6px
	overflow hidden

.loading
	padding 64px 0

.empty
	display block
	margin 0 auto
	padding 32px
	max-width 400px
	text-align center
	color #999

	> [data-fa]
		display block
		margin-bottom 16px
		font-size 3em
		color #ccc

</style>
