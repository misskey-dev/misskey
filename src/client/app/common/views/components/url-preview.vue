<template>
<div v-if="player.url" class="player" :style="`padding: ${(player.height || 0) / (player.width || 1) * 100}% 0 0`">
	<iframe :src="player.url" :width="player.width || '100%'" :heigth="player.height || 250" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen />
</div>
<div v-else-if="tweetUrl && detail" class="twitter">
	<blockquote ref="tweet" class="twitter-tweet" :data-theme="$store.state.device.darkmode ? 'dark' : null">
		<a :href="url"></a>
	</blockquote>
</div>
<div v-else class="mk-url-preview">
	<a :class="{ mini: narrow, compact }" :href="url" target="_blank" :title="url" v-if="!fetching">
		<div class="thumbnail" v-if="thumbnail" :style="`background-image: url('${thumbnail}')`"></div>
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
	</a>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import { url as misskeyUrl } from '../../../config';

// THIS IS THE WHITELIST FOR THE EMBED PLAYER
const whiteList = [
	'afreecatv.com',
	'aparat.com',
	'applemusic.com',
	'amazon.com',
	'awa.fm',
	'bandcamp.com',
	'bbc.co.uk',
	'beatport.com',
	'bilibili.com',
	'boomstream.com',
	'breakers.tv',
	'cam4.com',
	'cavelis.net',
	'chaturbate.com',
	'cnn.com',
	'cybergame.tv',
	'dailymotion.com',
	'deezer.com',
	'djlive.pl',
	'e-onkyo.com',
	'eventials.com',
	'facebook.com',
	'fc2.com',
	'gameplank.tv',
	'goodgame.ru',
	'google.com',
	'hardtunes.com',
	'instagram.com',
	'johnnylooch.com',
	'kexp.org',
	'lahzenegar.com',
	'liveedu.tv',
	'livetube.cc',
	'livestream.com',
	'meridix.com',
	'mixcloud.com',
	'mixer.com',
	'mobcrush.com',
	'mylive.in.th',
	'myspace.com',
	'netflix.com',
	'newretrowave.com',
	'nhk.or.jp',
	'nicovideo.jp',
	'nico.ms',
	'noisetrade.com',
	'nood.tv',
	'npr.org',
	'openrec.tv',
	'pandora.com',
	'pandora.tv',
	'picarto.tv',
	'pscp.tv',
	'restream.io',
	'reverbnation.com',
	'sermonaudio.com',
	'smashcast.tv',
	'songkick.com',
	'soundcloud.com',
	'spinninrecords.com',
	'spotify.com',
	'stitcher.com',
	'stream.me',
	'switchboard.live',
	'tunein.com',
	'twitcasting.tv',
	'twitch.tv',
	'twitter.com',
	'vaughnlive.tv',
	'veoh.com',
	'vimeo.com',
	'watchpeoplecode.com',
	'web.tv',
	'youtube.com',
	'youtu.be'
];

export default Vue.extend({
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
		return {
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
			misskeyUrl
		};
	},

	created() {
		const url = new URL(this.url);

		if (this.detail && url.hostname == 'twitter.com' && /^\/.+\/status(es)?\/\d+/.test(url.pathname)) {
			this.tweetUrl = url;
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

		if (url.hostname === 'music.youtube.com')
			url.hostname = 'youtube.com';

		fetch(`/url?url=${encodeURIComponent(this.url)}`).then(res => {
			res.json().then(info => {
				if (info.url == null) return;
				this.title = info.title;
				this.description = info.description;
				this.thumbnail = info.thumbnail;
				this.icon = info.icon;
				this.sitename = info.sitename;
				this.fetching = false;
				if (whiteList.some(x => x == url.hostname || url.hostname.endsWith(`.${x}`))) {
					this.player = info.player;
				}
			})
		});
	}
});
</script>

<style lang="stylus" scoped>
.player
	position relative
	width 100%

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
