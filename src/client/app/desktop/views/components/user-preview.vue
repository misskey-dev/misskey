<template>
<div class="mk-user-preview">
	<template v-if="u != null">
		<div class="banner" :style="u.bannerUrl ? `background-image: url(${u.bannerUrl})` : ''"></div>
		<mk-avatar class="avatar" :user="u" :disable-preview="true"/>
		<div class="title">
			<router-link class="name" :to="u | userPage"><mk-user-name :user="u" :nowrap="false"/></router-link>
			<p class="username"><mk-acct :user="u"/></p>
		</div>
		<div class="description">
			<mfm v-if="u.description" :text="u.description" :author="u" :i="$store.state.i" :custom-emojis="u.emojis"/>
		</div>
		<div class="status">
			<div>
				<p>{{ $t('notes') }}</p><span>{{ u.notesCount }}</span>
			</div>
			<div>
				<p>{{ $t('following') }}</p><span>{{ u.followingCount }}</span>
			</div>
			<div>
				<p>{{ $t('followers') }}</p><span>{{ u.followersCount }}</span>
			</div>
		</div>
		<mk-follow-button class="koudoku-button" v-if="$store.getters.isSignedIn && u.id != $store.state.i.id" :user="u" mini/>
	</template>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';
import anime from 'animejs';
import parseAcct from '../../../../../misc/acct/parse';

export default Vue.extend({
	i18n: i18n('desktop/views/components/user-preview.vue'),
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
			const query = this.user.startsWith('@') ?
				parseAcct(this.user.substr(1)) :
				{ userId: this.user };

			this.$root.api('users/show', query).then(user => {
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
				complete: () => this.destroyDom()
			});
		}
	}
});
</script>

<style lang="stylus" scoped>
.mk-user-preview
	position absolute
	z-index 2048
	margin-top -8px
	width 250px
	background var(--face)
	background-clip content-box
	border solid 1px rgba(#000, 0.1)
	border-radius 4px
	overflow hidden
	opacity 0

	> .banner
		height 84px
		background-color rgba(0, 0, 0, 0.1)
		background-size cover
		background-position center

	> .avatar
		display block
		position absolute
		top 62px
		left 13px
		z-index 2
		width 58px
		height 58px
		border solid 3px var(--face)
		border-radius 8px

	> .title
		display block
		padding 8px 0 8px 82px

		> .name
			display inline-block
			margin 0
			font-weight bold
			line-height 16px
			color var(--text)

		> .username
			display block
			margin 0
			line-height 16px
			font-size 0.8em
			color var(--text)
			opacity 0.7

	> .description
		padding 0 16px
		font-size 0.7em
		color var(--text)

	> .status
		padding 8px 16px

		> div
			display inline-block
			width 33%

			> p
				margin 0
				font-size 0.7em
				color var(--text)

			> span
				font-size 1em
				color var(--primary)

	> .koudoku-button
		position absolute
		top 8px
		right 8px

</style>
