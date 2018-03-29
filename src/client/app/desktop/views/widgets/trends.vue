<template>
<div class="mkw-trends">
	<template v-if="!props.compact">
		<p class="title">%fa:fire%%i18n:desktop.tags.mk-trends-home-widget.title%</p>
		<button @click="fetch" title="%i18n:desktop.tags.mk-trends-home-widget.refresh%">%fa:sync%</button>
	</template>
	<p class="fetching" v-if="fetching">%fa:spinner .pulse .fw%%i18n:common.loading%<mk-ellipsis/></p>
	<div class="post" v-else-if="post != null">
		<p class="text"><router-link :to="`/@${ acct }/${ post.id }`">{{ post.text }}</router-link></p>
		<p class="author">―<router-link :to="`/@${ acct }`">@{{ acct }}</router-link></p>
	</div>
	<p class="empty" v-else>%i18n:desktop.tags.mk-trends-home-widget.nothing%</p>
</div>
</template>

<script lang="ts">
import define from '../../../common/define-widget';
import getAcct from '../../../../../common/user/get-acct';

export default define({
	name: 'trends',
	props: () => ({
		compact: false
	})
}).extend({
	computed: {
		acct() {
			return getAcct(this.post.user);
		},
	},
	data() {
		return {
			post: null,
			fetching: true,
			offset: 0
		};
	},
	mounted() {
		this.fetch();
	},
	methods: {
		func() {
			this.props.compact = !this.props.compact;
		},
		fetch() {
			this.fetching = true;
			this.post = null;

			(this as any).api('posts/trend', {
				limit: 1,
				offset: this.offset,
				repost: false,
				reply: false,
				media: false,
				poll: false
			}).then(posts => {
				const post = posts ? posts[0] : null;
				if (post == null) {
					this.offset = 0;
				} else {
					this.offset++;
				}
				this.post = post;
				this.fetching = false;
			});
		}
	}
});
</script>

<style lang="stylus" scoped>
.mkw-trends
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
		border-bottom solid 1px #eee

		> [data-fa]
			margin-right 4px

	> button
		position absolute
		z-index 2
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

	> .post
		padding 16px
		font-size 12px
		font-style oblique
		color #555

		> p
			margin 0

		> .text,
		> .author
			> a
				color inherit

	> .empty
		margin 0
		padding 16px
		text-align center
		color #aaa

	> .fetching
		margin 0
		padding 16px
		text-align center
		color #aaa

		> [data-fa]
			margin-right 4px

</style>
