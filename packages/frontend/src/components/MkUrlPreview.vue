<template>
<template v-if="player.url && playerEnabled">
	<div
		:class="$style.player"
		:style="player.width ? `padding: ${(player.height || 0) / player.width * 100}% 0 0` : `padding: ${(player.height || 0)}px 0 0`"
	>
		<iframe
			v-if="player.url.startsWith('http://') || player.url.startsWith('https://')"
			sandbox="allow-popups allow-scripts allow-storage-access-by-user-activation allow-same-origin"
			scrolling="no"
			:allow="player.allow.join(';')"
			:class="$style.playerIframe"
			:src="player.url + (player.url.match(/\?/) ? '&autoplay=1&auto_play=1' : '?autoplay=1&auto_play=1')"
			:style="{ border: 0 }"
		></iframe>
		<span v-else>invalid url</span>
	</div>
	<div :class="$style.action">
		<MkButton :small="true" inline @click="playerEnabled = false">
			<i class="ti ti-x"></i> {{ i18n.ts.disablePlayer }}
		</MkButton>
	</div>
</template>
<template v-else-if="tweetId && tweetExpanded">
	<div ref="twitter" :class="$style.twitter">
		<iframe ref="tweet" scrolling="no" frameborder="no" :style="{ position: 'relative', width: '100%', height: `${tweetHeight}px` }" :src="`https://platform.twitter.com/embed/index.html?embedId=${embedId}&amp;hideCard=false&amp;hideThread=false&amp;lang=en&amp;theme=${defaultStore.state.darkMode ? 'dark' : 'light'}&amp;id=${tweetId}`"></iframe>
	</div>
	<div :class="$style.action">
		<MkButton :small="true" inline @click="tweetExpanded = false">
			<i class="ti ti-x"></i> {{ i18n.ts.close }}
		</MkButton>
	</div>
</template>
<div v-else :class="$style.urlPreview">
	<component :is="self ? 'MkA' : 'a'" :class="[$style.link, { [$style.compact]: compact }]" :[attr]="self ? url.substr(local.length) : url" rel="nofollow noopener" :target="target" :title="url">
		<div v-if="thumbnail" :class="$style.thumbnail" :style="`background-image: url('${thumbnail}')`">
		</div>
		<article :class="$style.body">
			<header :class="$style.header">
				<h1 v-if="unknownUrl" :class="$style.title">{{ url }}</h1>
				<h1 v-else-if="fetching" :class="$style.title"><MkEllipsis/></h1>
				<h1 v-else :class="$style.title" :title="title ?? undefined">{{ title }}</h1>
			</header>
			<p v-if="unknownUrl" :class="$style.text">{{ i18n.ts.cannotLoad }}</p>
			<p v-else-if="fetching" :class="$style.text"><MkEllipsis/></p>
			<p v-else-if="description" :class="$style.text" :title="description">{{ description.length > 85 ? description.slice(0, 85) + '…' : description }}</p>
			<footer :class="$style.footer">
				<img v-if="icon" :class="$style.siteIcon" :src="icon"/>
				<p v-if="unknownUrl" :class="$style.siteName">?</p>
				<p v-else-if="fetching" :class="$style.siteName"><MkEllipsis/></p>
				<p v-else :class="$style.siteName" :title="sitename ?? undefined">{{ sitename }}</p>
			</footer>
		</article>
	</component>
	<div v-if="tweetId" :class="$style.action">
		<MkButton :small="true" inline @click="tweetExpanded = true">
			<i class="ti ti-brand-twitter"></i> {{ i18n.ts.expandTweet }}
		</MkButton>
	</div>
	<div v-if="!playerEnabled && player.url" :class="$style.action">
		<MkButton :small="true" inline @click="playerEnabled = true">
			<i class="ti ti-player-play"></i> {{ i18n.ts.enablePlayer }}
		</MkButton>
		<MkButton v-if="!isMobile" :small="true" inline @click="openPlayer()">
			<i class="ti ti-picture-in-picture"></i> {{ i18n.ts.openInWindow }}
		</MkButton>
	</div>
</div>
</template>

<script lang="ts" setup>
import { defineAsyncComponent, onUnmounted } from 'vue';
import type { summaly } from 'summaly';
import { url as local } from '@/config';
import { i18n } from '@/i18n';
import * as os from '@/os';
import { deviceKind } from '@/scripts/device-kind';
import MkButton from '@/components/MkButton.vue';
import { versatileLang } from '@/scripts/intl-const';
import { defaultStore } from '@/store';

type SummalyResult = Awaited<ReturnType<typeof summaly>>;

const props = withDefaults(defineProps<{
	url: string;
	detail?: boolean;
	compact?: boolean;
}>(), {
	detail: false,
	compact: false,
});

const MOBILE_THRESHOLD = 500;
const isMobile = $ref(deviceKind === 'smartphone' || window.innerWidth <= MOBILE_THRESHOLD);

const self = props.url.startsWith(local);
const attr = self ? 'to' : 'href';
const target = self ? null : '_blank';
let fetching = $ref(true);
let title = $ref<string | null>(null);
let description = $ref<string | null>(null);
let thumbnail = $ref<string | null>(null);
let icon = $ref<string | null>(null);
let sitename = $ref<string | null>(null);
let player = $ref({
	url: null,
	width: null,
	height: null,
} as SummalyResult['player']);
let playerEnabled = $ref(false);
let tweetId = $ref<string | null>(null);
let tweetExpanded = $ref(props.detail);
const embedId = `embed${Math.random().toString().replace(/\D/, '')}`;
let tweetHeight = $ref(150);
let unknownUrl = $ref(false);

const requestUrl = new URL(props.url);
if (!['http:', 'https:'].includes(requestUrl.protocol)) throw new Error('invalid url');

if (requestUrl.hostname === 'twitter.com' || requestUrl.hostname === 'mobile.twitter.com') {
	const m = requestUrl.pathname.match(/^\/.+\/status(?:es)?\/(\d+)/);
	if (m) tweetId = m[1];
}

if (requestUrl.hostname === 'music.youtube.com' && requestUrl.pathname.match('^/(?:watch|channel)')) {
	requestUrl.hostname = 'www.youtube.com';
}

requestUrl.hash = '';

window.fetch(`/url?url=${encodeURIComponent(requestUrl.href)}&lang=${versatileLang}`).then(res => {
	res.json().then((info: SummalyResult) => {
		title = info.title;
		description = info.description;
		thumbnail = info.thumbnail;
		icon = info.icon;
		sitename = info.sitename;
		fetching = false;
		player = info.player;
	});
});

function adjustTweetHeight(message: any) {
	if (message.origin !== 'https://platform.twitter.com') return;
	const embed = message.data?.['twttr.embed'];
	if (embed?.method !== 'twttr.private.resize') return;
	if (embed?.id !== embedId) return;
	const height = embed?.params[0]?.height;
	if (height) tweetHeight = height;
}

const openPlayer = (): void => {
	os.popup(defineAsyncComponent(() => import('@/components/MkYouTubePlayer.vue')), {
		url: requestUrl.href,
	});
};

(window as any).addEventListener('message', adjustTweetHeight);

onUnmounted(() => {
	(window as any).removeEventListener('message', adjustTweetHeight);
});
</script>

<style lang="scss" module>
.player {
	position: relative;
	width: 100%;
}

.disablePlayer {
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

.playerIframe {
	height: 100%;
	left: 0;
	position: absolute;
	top: 0;
	width: 100%;
}

.twitter {

}

.urlPreview {
}

.link {
	position: relative;
	display: block;
	font-size: 14px;
	box-shadow: 0 0 0 1px var(--divider);
	border-radius: 8px;
	overflow: clip;

	&:hover {
		text-decoration: none;
		border-color: rgba(0, 0, 0, 0.2);

		> .body > .header > .title {
			text-decoration: underline;
		}
	}

	&.compact {
		> .body {
			> .header .title, .text, .footer {
				overflow: hidden;
				white-space: nowrap;
				text-overflow: ellipsis;
			}
		}
	}
}

.thumbnail {
	position: absolute;
	width: 100px;
	height: 100%;
	background-position: center;
	background-size: cover;
	display: flex;
	justify-content: center;
	align-items: center;

	& + .body {
		left: 100px;
		width: calc(100% - 100px);
	}
}

.body {
	position: relative;
	box-sizing: border-box;
	padding: 16px;
}

.header {
	margin-bottom: 8px;
}

.title {
	margin: 0;
	font-size: 1em;
}

.text {
	margin: 0;
	font-size: 0.8em;
}

.footer {
	margin-top: 8px;
	height: 16px;
}

.siteIcon {
	display: inline-block;
	width: 16px;
	height: 16px;
	margin-right: 4px;
	vertical-align: top;
}

.siteName {
	display: inline-block;
	margin: 0;
	color: var(--urlPreviewInfo);
	font-size: 0.8em;
	line-height: 16px;
	vertical-align: top;
}

.action {
	display: flex;
	gap: 6px;
	flex-wrap: wrap;
	margin-top: 6px;
}

@container (max-width: 400px) {
	.link {
		font-size: 12px;
	}

	.thumbnail {
		height: 80px;
	}

	.body {
		padding: 12px;
	}
}

@container (max-width: 350px) {
	.link {
		font-size: 10px;

		&.compact {
			> .thumbnail {
				position: absolute;
				width: 56px;
				height: 100%;
			}

			> .body {
				left: 56px;
				width: calc(100% - 56px);
				padding: 4px;

				> .header {
					margin-bottom: 2px;
				}

				> .footer {
					margin-top: 2px;
				}
			}
		}
	}

	.thumbnail {
		height: 70px;
	}

	.body {
		padding: 8px;
	}

	.header {
		margin-bottom: 4px;
	}

	.footer {
		margin-top: 4px;
	}

	.siteIcon {
		width: 12px;
		height: 12px;
	}
}
</style>
