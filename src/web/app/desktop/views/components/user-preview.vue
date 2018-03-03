<template>
<div class="mk-user-preview">
	<template v-if="u != null">
		<div class="banner" :style="u.banner_url ? `background-image: url(${u.banner_url}?thumbnail&size=512)` : ''"></div>
		<router-link class="avatar" :to="`/${u.username}`">
			<img :src="`${u.avatar_url}?thumbnail&size=64`" alt="avatar"/>
		</router-link>
		<div class="title">
			<router-link class="name" :to="`/${u.username}`">{{ u.name }}</router-link>
			<p class="username">@{{ u.username }}</p>
		</div>
		<div class="description">{{ u.description }}</div>
		<div class="status">
			<div>
				<p>投稿</p><a>{{ u.posts_count }}</a>
			</div>
			<div>
				<p>フォロー</p><a>{{ u.following_count }}</a>
			</div>
			<div>
				<p>フォロワー</p><a>{{ u.followers_count }}</a>
			</div>
		</div>
		<mk-follow-button v-if="os.isSignedIn && user.id != os.i.id" :user="u"/>
	</template>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import * as anime from 'animejs';

export default Vue.extend({
	props: {
		user: {
			type: [Object, String],
			required: true
		}
	},
	data() {
		return {
			u: null
		};
	},
	mounted() {
		if (typeof this.user == 'object') {
			this.u = this.user;
			this.$nextTick(() => {
				this.open();
			});
		} else {
			(this as any).api('users/show', {
				user_id: this.user[0] == '@' ? undefined : this.user,
				username: this.user[0] == '@' ? this.user.substr(1) : undefined
			}).then(user => {
				this.u = user;
				this.open();
			});
		}
	},
	methods: {
		open() {
			anime({
				targets: this.$el,
				opacity: 1,
				'margin-top': 0,
				duration: 200,
				easing: 'easeOutQuad'
			});
		},
		close() {
			anime({
				targets: this.$el,
				opacity: 0,
				'margin-top': '-8px',
				duration: 200,
				easing: 'easeOutQuad',
				complete: () => this.$destroy()
			});
		}
	}
});
</script>

<style lang="stylus" scoped>
@import '~const.styl'

.mk-user-preview
	position absolute
	z-index 2048
	margin-top -8px
	width 250px
	background #fff
	background-clip content-box
	border solid 1px rgba(0, 0, 0, 0.1)
	border-radius 4px
	overflow hidden
	opacity 0

	> .banner
		height 84px
		background-color #f5f5f5
		background-size cover
		background-position center

	> .avatar
		display block
		position absolute
		top 62px
		left 13px
		z-index 2

		> img
			display block
			width 58px
			height 58px
			margin 0
			border solid 3px #fff
			border-radius 8px

	> .title
		display block
		padding 8px 0 8px 82px

		> .name
			display inline-block
			margin 0
			font-weight bold
			line-height 16px
			color #656565

		> .username
			display block
			margin 0
			line-height 16px
			font-size 0.8em
			color #999

	> .description
		padding 0 16px
		font-size 0.7em
		color #555

	> .status
		padding 8px 16px

		> div
			display inline-block
			width 33%

			> p
				margin 0
				font-size 0.7em
				color #aaa

			> a
				font-size 1em
				color $theme-color

	> .mk-follow-button
		position absolute
		top 92px
		right 8px

</style>
