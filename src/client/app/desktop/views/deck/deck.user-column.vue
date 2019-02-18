<template>
<x-column>
	<template #header>
		<fa icon="user"/><mk-user-name :user="user" v-if="user"/>
	</template>

	<div class="zubukjlciycdsyynicqrnlsmdwmymzqu" v-if="user">
		<div class="is-remote" v-if="user.host != null">
			<details>
				<summary><fa icon="exclamation-triangle"/> {{ $t('@.is-remote-user') }}</summary>
				<a :href="user.url || user.uri" target="_blank">{{ $t('@.view-on-remote') }}</a>
			</details>
		</div>
		<header :style="bannerStyle">
			<div>
				<button class="menu" @click="menu" ref="menu"><fa icon="ellipsis-h"/></button>
				<mk-follow-button v-if="$store.getters.isSignedIn && user.id != $store.state.i.id" :user="user" class="follow" mini/>
				<mk-avatar class="avatar" :user="user" :disable-preview="true"/>
				<router-link class="name" :to="user | userPage()">
					<mk-user-name :user="user"/>
				</router-link>
				<span class="acct">@{{ user | acct }} <fa v-if="user.isLocked == true" class="locked" icon="lock" fixed-width/></span>
				<span class="followed" v-if="user.isFollowed">{{ $t('follows-you') }}</span>
			</div>
		</header>
		<div class="info">
			<div class="description">
				<mfm v-if="user.description" :text="user.description" :is-note="false" :author="user" :i="$store.state.i" :custom-emojis="user.emojis"/>
			</div>
			<div class="fields" v-if="user.fields">
				<dl class="field" v-for="(field, i) in user.fields" :key="i">
					<dt class="name">
						<mfm :text="field.name" :should-break="false" :plain-text="true" :custom-emojis="user.emojis"/>
					</dt>
					<dd class="value">
						<mfm :text="field.value" :author="user" :i="$store.state.i" :custom-emojis="user.emojis"/>
					</dd>
				</dl>
			</div>
			<div class="counts">
				<div>
					<router-link :to="user | userPage()">
						<b>{{ user.notesCount | number }}</b>
						<span>{{ $t('posts') }}</span>
					</router-link>
				</div>
				<div>
					<router-link :to="user | userPage('following')">
						<b>{{ user.followingCount | number }}</b>
						<span>{{ $t('following') }}</span>
					</router-link>
				</div>
				<div>
					<router-link :to="user | userPage('followers')">
						<b>{{ user.followersCount | number }}</b>
						<span>{{ $t('followers') }}</span>
					</router-link>
				</div>
			</div>
		</div>
		<router-view :user="user"></router-view>
	</div>
</x-column>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';
import parseAcct from '../../../../../misc/acct/parse';
import XColumn from './deck.column.vue';
import XUserMenu from '../../../common/views/components/user-menu.vue';

export default Vue.extend({
	i18n: i18n('deck/deck.user-column.vue'),
	components: {
		XColumn,
	},

	data() {
		return {
			user: null,
			fetching: true,
		};
	},

	computed: {
		bannerStyle(): any {
			if (this.user == null) return {};
			if (this.user.bannerUrl == null) return {};
			return {
				backgroundColor: this.user.bannerColor && this.user.bannerColor.length == 3 ? `rgb(${ this.user.bannerColor.join(',') })` : null,
				backgroundImage: `url(${ this.user.bannerUrl })`
			};
		},
	},

	watch: {
		$route: 'fetch'
	},

	created() {
		this.fetch();
	},

	methods: {
		fetch() {
			this.fetching = true;
			this.$root.api('users/show', parseAcct(this.$route.params.user)).then(user => {
				this.user = user;
				this.fetching = false;
			});
		},

		menu() {
			this.$root.new(XUserMenu, {
				source: this.$refs.menu,
				user: this.user
			});
		}
	}
});
</script>

<style lang="stylus" scoped>
.zubukjlciycdsyynicqrnlsmdwmymzqu
	background var(--deckColumnBg)

	> .is-remote
		padding 8px 16px
		font-size 12px

		&.is-remote
			color var(--remoteInfoFg)
			background var(--remoteInfoBg)

		> a
			font-weight bold

	> header
		overflow hidden
		background-size cover
		background-position center

		> div
			padding 32px
			background rgba(#000, 0.5)
			color #fff
			text-align center

			> .menu
				position absolute
				top 8px
				left 8px
				padding 8px
				font-size 16px
				text-shadow 0 0 8px #000

			> .follow
				position absolute
				top 16px
				right 16px

			> .avatar
				display block
				width 64px
				height 64px
				margin 0 auto

			> .name
				display block
				margin-top 8px
				font-weight bold
				text-shadow 0 0 8px #000
				color #fff

			> .acct
				display block
				font-size 14px
				opacity 0.7
				text-shadow 0 0 8px #000

				> .locked
					opacity 0.8

			> .followed
				display inline-block
				font-size 12px
				background rgba(0, 0, 0, 0.5)
				opacity 0.7
				margin-top: 2px
				padding 4px
				border-radius 4px

	> .info
		padding 16px
		font-size 12px
		color var(--text)
		text-align center
		background var(--face)

		&:before
			content ""
			display blcok
			position absolute
			top -32px
			left 0
			right 0
			width 0px
			margin 0 auto
			border-top solid 16px transparent
			border-left solid 16px transparent
			border-right solid 16px transparent
			border-bottom solid 16px var(--face)

		> .fields
			margin-top 8px

			> .field
				display flex
				padding 0
				margin 0
				align-items center

				> .name
					padding 4px
					margin 4px
					width 30%
					overflow hidden
					white-space nowrap
					text-overflow ellipsis
					font-weight bold

				> .value
					padding 4px
					margin 4px
					width 70%
					overflow hidden
					white-space nowrap
					text-overflow ellipsis

		> .counts
			display grid
			grid-template-columns 2fr 2fr 2fr
			margin-top 8px
			border-top solid var(--lineWidth) var(--faceDivider)

			> div
				padding 8px 8px 0 8px
				text-align center

				> a
					color var(--text)

					> b
						display block
						font-size 110%

					> span
						display block
						font-size 80%
						opacity 0.7

</style>
