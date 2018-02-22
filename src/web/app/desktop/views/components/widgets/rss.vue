<template>
<div class="mkw-rss">
	<template v-if="!props.compact">
		<p class="title">%fa:rss-square%RSS</p>
		<button title="設定">%fa:cog%</button>
	</template>
	<p class="fetching" v-if="fetching">%fa:spinner .pulse .fw%%i18n:common.loading%<mk-ellipsis/></p>
	<div class="feed" v-else>
		<a v-for="item in items" :href="item.link" target="_blank">{{ item.title }}</a>
	</div>
</div>
</template>

<script lang="ts">
import define from '../../../../common/define-widget';
export default define({
	name: 'rss',
	props: () => ({
		compact: false
	})
}).extend({
	data() {
		return {
			url: 'http://news.yahoo.co.jp/pickup/rss.xml',
			items: [],
			fetching: true,
			clock: null
		};
	},
	mounted() {
		this.fetch();
		this.clock = setInterval(this.fetch, 60000);
	},
	beforeDestroy() {
		clearInterval(this.clock);
	},
	methods: {
		func() {
			this.props.compact = !this.props.compact;
		},
		fetch() {
			fetch(`https://api.rss2json.com/v1/api.json?rss_url=${this.url}`, {
				cache: 'no-cache'
			}).then(res => {
				res.json().then(feed => {
					this.items = feed.items;
					this.fetching = false;
				});
			});
		}
	}
});
</script>

<style lang="stylus" scoped>
.mkw-rss
	background #fff
	border solid 1px rgba(0, 0, 0, 0.075)
	border-radius 6px

	> .title
		margin 0
		padding 0 16px
		line-height 42px
		font-size 0.9em
		font-weight bold
		color #888
		box-shadow 0 1px rgba(0, 0, 0, 0.07)

		> [data-fa]
			margin-right 4px

	> button
		position absolute
		top 0
		right 0
		padding 0
		width 42px
		font-size 0.9em
		line-height 42px
		color #ccc

		&:hover
			color #aaa

		&:active
			color #999

	> .feed
		padding 12px 16px
		font-size 0.9em

		> a
			display block
			padding 4px 0
			color #666
			border-bottom dashed 1px #eee

			&:last-child
				border-bottom none

	> .fetching
		margin 0
		padding 16px
		text-align center
		color #aaa

		> [data-fa]
			margin-right 4px

</style>
