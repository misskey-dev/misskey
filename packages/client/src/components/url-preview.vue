<template>
<div v-if="playerEnabled" class="player" :style="`padding: ${(player.height || 0) / (player.width || 1) * 100}% 0 0`">
	<button class="disablePlayer" :title="$ts.disablePlayer" @click="playerEnabled = false"><i class="fas fa-times"></i></button>
	<iframe :src="player.url + (player.url.match(/\?/) ? '&autoplay=1&auto_play=1' : '?autoplay=1&auto_play=1')" :width="player.width || '100%'" :heigth="player.height || 250" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen />
</div>
<div v-else-if="tweetId && tweetExpanded" ref="twitter" class="twitter">
	<iframe ref="tweet" scrolling="no" frameborder="no" :style="{ position: 'relative', left: `${tweetLeft}px`, width: `${tweetLeft < 0 ? 'auto' : '100%'}`, height: `${tweetHeight}px` }" :src="`https://platform.twitter.com/embed/index.html?embedId=${embedId}&amp;hideCard=false&amp;hideThread=false&amp;lang=en&amp;theme=${$store.state.darkMode ? 'dark' : 'light'}&amp;id=${tweetId}`"></iframe>
</div>
<div v-else v-size="{ max: [400, 350] }" class="mk-url-preview">
	<transition name="zoom" mode="out-in">
		<component :is="self ? 'MkA' : 'a'" v-if="!fetching" :class="{ compact }" :[attr]="self ? url.substr(local.length) : url" rel="nofollow noopener" :target="target" :title="url">
			<div v-if="thumbnail" class="thumbnail" :style="`background-image: url('${thumbnail}')`">
				<button v-if="!playerEnabled && player.url" class="_button" :title="$ts.enablePlayer" @click.prevent="playerEnabled = true"><i class="fas fa-play-circle"></i></button>
			</div>
			<article>
				<header>
					<h1 :title="title">{{ title }}</h1>
				</header>
				<p v-if="description" :title="description">{{ description.length > 85 ? description.slice(0, 85) + '…' : description }}</p>
				<footer>
					<img v-if="icon" class="icon" :src="icon"/>
					<p :title="sitename">{{ sitename }}</p>
				</footer>
			</article>
		</component>
	</transition>
	<div v-if="tweetId" class="expandTweet">
		<a @click="tweetExpanded = true">
			<i class="fab fa-twitter"></i> {{ $ts.expandTweet }}
		</a>
	</div>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { url as local, lang } from '@/config';
import * as os from '@/os';

export default defineComponent({
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

	data() {
		const self = this.url.startsWith(local);
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
			tweetId: null,
			tweetExpanded: this.detail,
			embedId: `embed${Math.random().toString().replace(/\D/,'')}`,
			tweetHeight: 150,
 			tweetLeft: 0,
			playerEnabled: false,
			self: self,
			attr: self ? 'to' : 'href',
			target: self ? null : '_blank',
		};
	},

	created() {
		const requestUrl = new URL(this.url);

		if (requestUrl.hostname == 'twitter.com') {
			const m = requestUrl.pathname.match(/^\/.+\/status(?:es)?\/(\d+)/);
			if (m) this.tweetId = m[1];
		}

		if (requestUrl.hostname === 'music.youtube.com' && requestUrl.pathname.match('^/(?:watch|channel)')) {
			requestUrl.hostname = 'www.youtube.com';
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

		(window as any).addEventListener('message', this.adjustTweetHeight);
	},

	mounted() {
		// 300pxないと絶対右にはみ出るので左に移動してしまう
		const areaWidth = (this.$el as any)?.clientWidth;
		if (areaWidth && areaWidth < 300) this.tweetLeft = areaWidth - 241;
	},

	beforeUnmount() {
		(window as any).removeEventListener('message', this.adjustTweetHeight);
	},

	methods: {
		adjustTweetHeight(message: any) {
			if (message.origin !== 'https://platform.twitter.com') return;
			const embed = message.data?.['twttr.embed'];
			if (embed?.method !== 'twttr.private.resize') return;
			if (embed?.id !== this.embedId) return;
			const height = embed?.params[0]?.height;
			if (height) this.tweetHeight = height;
 		},
	},
});
</script>

<style lang="scss" scoped>
.player {
	position: relative;
	width: 100%;

	> button {
		position: absolute;
		top: -1.5em;
		right: 0;
		font-size: 1em;
		width: 1.5em;
		height: 1.5em;
		padding: 0;
		margin: 0;
		color: var(--fg);
		background: rgba(128, 128, 128, 0.2);
		opacity: 0.7;

		&:hover {
			opacity: 0.9;
		}
	}

	> iframe {
		height: 100%;
		left: 0;
		position: absolute;
		top: 0;
		width: 100%;
	}
}

.mk-url-preview {
	&.max-width_400px {
		> a {
			font-size: 12px;

			> .thumbnail {
				height: 80px;
			}

			> article {
				padding: 12px;
			}
		}
	}

	&.max-width_350px {
		> a {
			font-size: 10px;

			> .thumbnail {
				height: 70px;
			}

			> article {
				padding: 8px;

				> header {
					margin-bottom: 4px;
				}

				> footer {
					margin-top: 4px;

					> img {
						width: 12px;
						height: 12px;
					}
				}
			}

			&.compact {
				> .thumbnail {
					position: absolute;
					width: 56px;
					height: 100%;
				}

				> article {
					left: 56px;
					width: calc(100% - 56px);
					padding: 4px;

					> header {
						margin-bottom: 2px;
					}

					> footer {
						margin-top: 2px;
					}
				}
			}
		}
	}

	> a {
		position: relative;
		display: block;
		font-size: 14px;
		box-shadow: 0 0 0 1px var(--divider);
		border-radius: 8px;
		overflow: hidden;

		&:hover {
			text-decoration: none;
			border-color: rgba(0, 0, 0, 0.2);

			> article > header > h1 {
				text-decoration: underline;
			}
		}

		> .thumbnail {
			position: absolute;
			width: 100px;
			height: 100%;
			background-position: center;
			background-size: cover;
			display: flex;
			justify-content: center;
			align-items: center;

			> button {
				font-size: 3.5em;
				opacity: 0.7;

				&:hover {
					font-size: 4em;
					opacity: 0.9;
				}
			}

			& + article {
				left: 100px;
				width: calc(100% - 100px);
			}
		}

		> article {
			position: relative;
			box-sizing: border-box;
			padding: 16px;

			> header {
				margin-bottom: 8px;

				> h1 {
					margin: 0;
					font-size: 1em;
				}
			}

			> p {
				margin: 0;
				font-size: 0.8em;
			}

			> footer {
				margin-top: 8px;
				height: 16px;

				> img {
					display: inline-block;
					width: 16px;
					height: 16px;
					margin-right: 4px;
					vertical-align: top;
				}

				> p {
					display: inline-block;
					margin: 0;
					color: var(--urlPreviewInfo);
					font-size: 0.8em;
					line-height: 16px;
					vertical-align: top;
				}
			}
		}

		&.compact {
			> article {
				> header h1, p, footer {
					overflow: hidden;
					white-space: nowrap;
					text-overflow: ellipsis;
				}
			}
		}
	}
}
</style>
