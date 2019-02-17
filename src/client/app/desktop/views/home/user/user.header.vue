<template>
<div class="header" :data-is-dark-background="user.bannerUrl != null">
	<div class="banner-container" :style="style">
		<div class="banner" ref="banner" :style="style" @click="onBannerClick"></div>
		<div class="fade"></div>
		<div class="title">
			<p class="name">
				<mk-user-name :user="user"/>
			</p>
			<div>
				<span class="username"><mk-acct :user="user" :detail="true" /></span>
				<span v-if="user.isBot" :title="$t('is-bot')"><fa icon="robot"/></span>
			</div>
		</div>
	</div>
	<mk-avatar class="avatar" :user="user" :disable-preview="true"/>
	<div class="body">
		<div class="actions" v-if="$store.getters.isSignedIn">
			<template v-if="$store.state.i.id != user.id">
				<span class="followed" v-if="user.isFollowed">{{ $t('follows-you') }}</span>
				<mk-follow-button :user="user" :inline="true" class="follow"/>
			</template>
			<ui-button @click="menu" ref="menu" :inline="true"><fa icon="ellipsis-h"/></ui-button>
		</div>
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
		<div class="info">
			<span class="location" v-if="user.host === null && user.profile.location"><fa icon="map-marker"/> {{ user.profile.location }}</span>
			<span class="birthday" v-if="user.host === null && user.profile.birthday"><fa icon="birthday-cake"/> {{ user.profile.birthday.replace('-', $t('year')).replace('-', $t('month')) + $t('day') }} ({{ $t('years-old', { age }) }})</span>
		</div>
		<div class="status">
			<router-link :to="user | userPage()" class="notes-count"><b>{{ user.notesCount | number }}</b>{{ $t('posts') }}</router-link>
			<router-link :to="user | userPage('following')" class="following clickable"><b>{{ user.followingCount | number }}</b>{{ $t('following') }}</router-link>
			<router-link :to="user | userPage('followers')" class="followers clickable"><b>{{ user.followersCount | number }}</b>{{ $t('followers') }}</router-link>
		</div>
	</div>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../../i18n';
import * as age from 's-age';
import XUserMenu from '../../../../common/views/components/user-menu.vue';

export default Vue.extend({
	i18n: i18n('desktop/views/pages/user/user.header.vue'),
	props: ['user'],
	computed: {
		style(): any {
			if (this.user.bannerUrl == null) return {};
			return {
				backgroundColor: this.user.bannerColor && this.user.bannerColor.length == 3 ? `rgb(${ this.user.bannerColor.join(',') })` : null,
				backgroundImage: `url(${ this.user.bannerUrl })`
			};
		},

		age(): number {
			return age(this.user.profile.birthday);
		}
	},
	mounted() {
		if (this.user.bannerUrl) {
			//window.addEventListener('load', this.onScroll);
			//window.addEventListener('scroll', this.onScroll, { passive: true });
			//window.addEventListener('resize', this.onScroll);
		}
	},
	beforeDestroy() {
		if (this.user.bannerUrl) {
			//window.removeEventListener('load', this.onScroll);
			//window.removeEventListener('scroll', this.onScroll);
			//window.removeEventListener('resize', this.onScroll);
		}
	},
	methods: {
		mention() {
			this.$post({ mention: this.user });
		},
		onScroll() {
			const banner = this.$refs.banner as any;

			const top = window.scrollY;

			const z = 1.25; // 奥行き(小さいほど奥)
			const pos = -(top / z);
			banner.style.backgroundPosition = `center calc(50% - ${pos}px)`;

			const blur = top / 32
			if (blur <= 10) banner.style.filter = `blur(${blur}px)`;
		},

		onBannerClick() {
			if (!this.$store.getters.isSignedIn || this.$store.state.i.id != this.user.id) return;

			this.$updateBanner().then(i => {
				this.user.bannerUrl = i.bannerUrl;
			});
		},

		menu() {
			this.$root.new(XUserMenu, {
				source: this.$refs.menu.$el,
				user: this.user
			});
		}
	}
});
</script>

<style lang="stylus" scoped>
.header
	background var(--face)
	box-shadow var(--shadow)
	border-radius var(--round)
	overflow hidden

	&[data-is-dark-background]
		> .banner-container
			> .banner
				background-color #383838

			> .fade
				background linear-gradient(transparent, rgba(#000, 0.7))

			> .title
				color #fff

				> .name
					text-shadow 0 0 8px #000

	> .banner-container
		height 250px
		overflow hidden
		background-size cover
		background-position center

		> .banner
			height 100%
			background-color #bfccd0
			background-size cover
			background-position center

		> .fade
			position absolute
			bottom 0
			left 0
			width 100%
			height 78px

		> .title
			position absolute
			bottom 0
			left 0
			width 100%
			padding 0 0 8px 154px
			color #5e6367

			> .name
				display block
				margin 0
				line-height 32px
				font-weight bold
				font-size 1.8em

			> div
				> *
					display inline-block
					margin-right 16px
					line-height 20px
					opacity 0.8

					&.username
						font-weight bold

	> .avatar
		display block
		position absolute
		top 170px
		left 16px
		z-index 2
		width 120px
		height 120px
		box-shadow 1px 1px 3px rgba(#000, 0.2)

		> &.cat::before,
		> &.cat::after
			border-width 8px

	> .body
		padding 16px 16px 16px 154px
		color var(--text)

		> .actions
			text-align right
			padding-bottom 16px
			margin-bottom 16px
			border-bottom solid 1px var(--faceDivider)

			> *
				margin-left 8px

			> .follow
				width 180px

		> .fields
			margin-top 16px

			> .field
				display flex
				padding 0
				margin 0
				align-items center

				> .name
					border-right solid 1px var(--faceDivider)
					padding 4px
					margin 4px
					width 30%
					overflow hidden
					white-space nowrap
					text-overflow ellipsis
					font-weight bold
					text-align center

				> .value
					padding 4px
					margin 4px
					width 70%
					overflow hidden
					white-space nowrap
					text-overflow ellipsis

		> .info
			margin-top 16px
			padding-top 16px
			border-top solid 1px var(--faceDivider)

			> *
				margin-right 16px

		> .status
			margin-top 16px
			padding-top 16px
			border-top solid 1px var(--faceDivider)
			font-size 80%

			> *
				display inline-block
				padding-right 16px
				margin-right 16px
				color inherit

				&:not(:last-child)
					border-right solid 1px var(--faceDivider)

				&.clickable
					cursor pointer

					&:hover
						color var(--faceTextButtonHover)

				> b
					margin-right 4px
					font-size 1rem
					font-weight bold
					color var(--primary)

</style>
