<template>
<div v-if="playerEnabled" class="player" :style="`padding: ${(player.height || 0) / (player.width || 1) * 100}% 0 0`">
	<button class="disablePlayer" @click="playerEnabled = false" :title="$t('disable-player')"><fa icon="times"/></button>
	<iframe :src="player.url + (player.url.match(/\?/) ? '&autoplay=1&auto_play=1' : '?autoplay=1&auto_play=1')" :width="player.width || '100%'" :heigth="player.height || 250" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen />
</div>
<div v-else-if="tweetUrl && detail" class="twitter">
	<blockquote ref="tweet" class="twitter-tweet" :data-theme="$store.state.device.darkmode ? 'dark' : null">
		<a :href="url"></a>
	</blockquote>
</div>
<div v-else class="mk-url-preview">
	<component :is="hasRoute ? 'router-link' : 'a'" :class="{ mini: narrow, compact }" :[attr]="hasRoute ? url.substr(local.length) : url" rel="nofollow noopener" :target="target" :title="url" v-if="!fetching">
		<div class="thumbnail" v-if="thumbnail" :style="`background-image: url('${thumbnail}')`">
			<button v-if="!playerEnabled && player.url" @click.prevent="playerEnabled = true" :title="$t('enable-player')"><fa :icon="['far', 'play-circle']"/></button>
		</div>
		<article>
			<header>
				<h1 :title="title">{{ title }}</h1>
			</header>
			<p v-if="description" :title="description">{{ description.length > 85 ? description.slice(0, 85) + '…' : description }}</p>
			<footer>
				<img class="icon" v-if="icon" :src="icon"/>
				<p :title="sitename">{{ sitename }}</p>
			</footer>
		</article>
	</component>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';
import { url as local, lang } from '../../../config';

export default Vue.extend({
	i18n: i18n('common/views/components/url-preview.vue'),

	props: {
		url: {
			type: String,
			require: true
		},

		detail: {
			type: Boolean,
			required: false,
			default: false
		},

		compact: {
			type: Boolean,
			required: false,
			default: false
		},
	},

	inject: {
		narrow: {
			default: false
		}
	},

	data() {
		const isSelf = this.url.startsWith(local);
		const hasRoute =
			(this.url.substr(local.length) === '/') ||
			this.url.substr(local.length).startsWith('/@') ||
			this.url.substr(local.length).startsWith('/notes/') ||
			this.url.substr(local.length).startsWith('/tags/') ||
			this.url.substr(local.length).startsWith('/pages/');
		return {
			local,
			fetching: true,
			title: null,
			description: null,
			thumbnail: null,
			icon: null,
			sitename: null,
			player: {
				url: null,
				width: null,
				height: null
			},
			tweetUrl: null,
			playerEnabled: false,
			self: isSelf,
			hasRoute: hasRoute,
			attr: hasRoute ? 'to' : 'href',
			target: hasRoute ? null : '_blank'
		};
	},

	created() {
		const requestUrl = new URL(this.url);

		if (this.detail && requestUrl.hostname == 'twitter.com' && /^\/.+\/status(es)?\/\d+/.test(requestUrl.pathname)) {
			this.tweetUrl = requestUrl;
			const twttr = (window as any).twttr || {};
			const loadTweet = () => twttr.widgets.load(this.$refs.tweet);

			if (twttr.widgets) {
				Vue.nextTick(loadTweet);
			} else {
				const wjsId = 'twitter-wjs';
				if (!document.getElementById(wjsId)) {
					const head = document.getElementsByTagName('head')[0];
					const script = document.createElement('script');
					script.setAttribute('id', wjsId);
					script.setAttribute('src', 'https://platform.twitter.com/widgets.js');
					head.appendChild(script);
				}
				twttr.ready = loadTweet;
				(window as any).twttr = twttr;
			}
			return;
		}

		if (requestUrl.hostname === 'music.youtube.com') {
			requestUrl.hostname = 'youtube.com';
		}

		const requestLang = (lang || 'ja-JP').replace('ja-KS', 'ja-JP');

		requestUrl.hash = '';

		fetch(`/url?url=${encodeURIComponent(requestUrl.href)}&lang=${requestLang}`).then(res => {
			res.json().then(info => {
				if (info.url == null) return;
				this.title = info.title;
				this.description = info.description;
				this.thumbnail = info.thumbnail;
				this.icon = info.icon;
				this.sitename = info.sitename;
				this.fetching = false;
				this.player = info.player;
			})
		});
	}
});
</script>

<style lang="stylus" scoped>
.player
	position relative
	width 100%

	> button
		position absolute
		top -1.5em
		right 0
		font-size 1em
		width 1.5em
		height 1.5em
		padding 0
		margin 0
		color var(--text)
		background rgba(128, 128, 128, 0.2)
		opacity 0.7

		&:hover
			opacity 0.9

	> iframe
		height 100%
		left 0
		position absolute
		top 0
		width 100%

.mk-url-preview
	> a
		display block
		font-size 14px
		border solid var(--lineWidth) var(--urlPreviewBorder)
		border-radius 4px
		overflow hidden

		&:hover
			text-decoration none
			border-color var(--urlPreviewBorderHover)

			> article > header > h1
				text-decoration underline

		> .thumbnail
			position absolute
			width 100px
			height 100%
			background-position center
			background-size cover
			display flex
			justify-content center
			align-items center

			> button
				font-size 3.5em
				opacity: 0.7

				&:hover
					font-size 4em
					opacity 0.9

			& + article
				left 100px
				width calc(100% - 100px)

		> article
			padding 16px

			> header
				margin-bottom 8px

				> h1
					margin 0
					font-size 1em
					color var(--urlPreviewTitle)

			> p
				margin 0
				color var(--urlPreviewText)
				font-size 0.8em

			> footer
				margin-top 8px
				height 16px

				> img
					display inline-block
					width 16px
					height 16px
					margin-right 4px
					vertical-align top

				> p
					display inline-block
					margin 0
					color var(--urlPreviewInfo)
					font-size 0.8em
					line-height 16px
					vertical-align top

		@media (max-width 700px)
			> .thumbnail
				position relative
				width 100%
				height 100px

				& + article
					left 0
					width 100%

		@media (max-width 550px)
			font-size 12px

			> .thumbnail
				height 80px

			> article
				padding 12px

		@media (max-width 500px)
			font-size 10px

			> .thumbnail
				height 70px

			> article
				padding 8px

				> header
					margin-bottom 4px

				> footer
					margin-top 4px

					> img
						width 12px
						height 12px

			&.compact
				> .thumbnail
					position: absolute
					width 56px
					height 100%

				> article
					left 56px
					width calc(100% - 56px)
					padding 4px

					> header
						margin-bottom 2px

					> footer
						margin-top 2px

		&.mini
			font-size 10px

			> .thumbnail
				position relative
				width 100%
				height 60px

			> article
				left 0
				width 100%
				padding 8px

				> header
					margin-bottom 4px

				> footer
					margin-top 4px

					> img
						width 12px
						height 12px

			&.compact
				> .thumbnail
					position absolute
					width 56px
					height 100%

				> article
					left 56px
					width calc(100% - 56px)
					padding 4px

					> header
						margin-bottom 2px

					> footer
						margin-top 2px

		&.compact
			> article
				> header h1, p, footer
					overflow hidden
					white-space nowrap
					text-overflow ellipsis
</style>
