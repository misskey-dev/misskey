<template>
<div class="mkw-polls">
	<template v-if="!props.compact">
		<p class="title">%fa:chart-pie%%i18n:desktop.tags.mk-recommended-polls-home-widget.title%</p>
		<button @click="fetch" title="%i18n:desktop.tags.mk-recommended-polls-home-widget.refresh%">%fa:sync%</button>
	</template>
	<div class="poll" v-if="!fetching && poll != null">
		<p v-if="poll.text"><router-link to="`/@${ acct }/${ poll.id }`">{{ poll.text }}</router-link></p>
		<p v-if="!poll.text"><router-link to="`/@${ acct }/${ poll.id }`">%fa:link%</router-link></p>
		<mk-poll :post="poll"/>
	</div>
	<p class="empty" v-if="!fetching && poll == null">%i18n:desktop.tags.mk-recommended-polls-home-widget.nothing%</p>
	<p class="fetching" v-if="fetching">%fa:spinner .pulse .fw%%i18n:common.loading%<mk-ellipsis/></p>
</div>
</template>

<script lang="ts">
import define from '../../../common/define-widget';
import getAcct from '../../../../../misc/user/get-acct';

export default define({
	name: 'polls',
	props: () => ({
		compact: false
	})
}).extend({
	computed: {
		acct() {
			return getAcct(this.poll.user);
		},
	},
	data() {
		return {
			poll: null,
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
			this.poll = null;

			(this as any).api('posts/polls/recommendation', {
				limit: 1,
				offset: this.offset
			}).then(posts => {
				const poll = posts ? posts[0] : null;
				if (poll == null) {
					this.offset = 0;
				} else {
					this.offset++;
				}
				this.poll = poll;
				this.fetching = false;
			});
		}
	}
});
</script>

<style lang="stylus" scoped>
.mkw-polls
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

	> .poll
		padding 16px
		font-size 12px
		color #555

		> p
			margin 0 0 8px 0

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
