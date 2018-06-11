<template>
<div class="mkw-hashtags">
	<mk-widget-container :show-header="!props.compact">
		<template slot="header">%fa:hashtag%%i18n:@title%</template>

		<div class="mkw-hashtags--body" :data-mobile="platform == 'mobile'">
			<p class="fetching" v-if="fetching">%fa:spinner .pulse .fw%%i18n:common.loading%<mk-ellipsis/></p>
			<div v-else>
				<router-link v-for="stat in stats" :key="stat.tag" :to="`/tags/${ stat.tag }`">{{ stat.tag }}</router-link>
			</div>
		</div>
	</mk-widget-container>
</div>
</template>

<script lang="ts">
import define from '../../../common/define-widget';
export default define({
	name: 'hashtags',
	props: () => ({
		compact: false
	})
}).extend({
	data() {
		return {
			stats: [],
			fetching: true,
			clock: null
		};
	},
	mounted() {
		this.fetch();
		this.clock = setInterval(this.fetch, 1000 * 60 * 10);
	},
	beforeDestroy() {
		clearInterval(this.clock);
	},
	methods: {
		func() {
			this.props.compact = !this.props.compact;
			this.save();
		},
		fetch() {
			(this as any).api('hashtags/trend').then(stats => {
				this.stats = stats;
				this.fetching = false;
			});
		}
	}
});
</script>

<style lang="stylus" scoped>
root(isDark)
	.mkw-rss--body
		.feed
			padding 12px 16px
			font-size 0.9em

			> a
				display block
				padding 4px 0
				color isDark ? #9aa4b3 : #666
				border-bottom dashed 1px isDark ? #1c2023 : #eee

				&:last-child
					border-bottom none

		.fetching
			margin 0
			padding 16px
			text-align center
			color #aaa

			> [data-fa]
				margin-right 4px

		&[data-mobile]
			background isDark ? #21242f : #f3f3f3

			.feed
				padding 0

				> a
					padding 8px 16px
					border-bottom none

					&:nth-child(even)
						background isDark ? rgba(#000, 0.05) : rgba(#fff, 0.7)

.mkw-rss[data-darkmode]
	root(true)

.mkw-rss:not([data-darkmode])
	root(false)

</style>
