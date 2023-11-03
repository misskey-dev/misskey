<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div v-if="meta" class="rsqzvsbo">
	<MkFeaturedPhotos class="bg"/>
	<XTimeline class="tl"/>
	<div class="shape1"></div>
	<div class="shape2"></div>
	<img src="/client-assets/misskey.svg" class="misskey"/>
	<div class="emojis">
		<MkEmoji :normal="true" :noStyle="true" emoji="👍"/>
		<MkEmoji :normal="true" :noStyle="true" emoji="❤"/>
		<MkEmoji :normal="true" :noStyle="true" emoji="😆"/>
		<MkEmoji :normal="true" :noStyle="true" emoji="🎉"/>
		<MkEmoji :normal="true" :noStyle="true" emoji="🍮"/>
	</div>
	<div class="contents">
		<MkVisitorDashboard/>
	</div>
	<div v-if="instances && instances.length > 0" class="federation">
		<MarqueeText :duration="40">
			<MkA v-for="instance in instances" :key="instance.id" :class="$style.federationInstance" :to="`/instance-info/${instance.host}`" behavior="window">
				<!--<MkInstanceCardMini :instance="instance"/>-->
				<img v-if="instance.iconUrl" class="icon" :src="getInstanceIcon(instance)" alt=""/>
				<span class="name _monospace">{{ instance.host }}</span>
			</MkA>
		</MarqueeText>
	</div>
</div>
</template>

<script lang="ts" setup>
import { } from 'vue';
import * as Misskey from 'misskey-js';
import XTimeline from './welcome.timeline.vue';
import MarqueeText from '@/components/MkMarquee.vue';
import MkFeaturedPhotos from '@/components/MkFeaturedPhotos.vue';
import MkInfo from '@/components/MkInfo.vue';
import { instanceName } from '@/config.js';
import * as os from '@/os.js';
import { i18n } from '@/i18n.js';
import { instance } from '@/instance.js';
import number from '@/filters/number.js';
import MkNumber from '@/components/MkNumber.vue';
import MkVisitorDashboard from '@/components/MkVisitorDashboard.vue';
import { getProxiedImageUrl } from '@/scripts/media-proxy.js';

let meta = $ref<Misskey.entities.Instance>();
let instances = $ref<any[]>();

function getInstanceIcon(instance): string {
  return getProxiedImageUrl(instance.iconUrl, 'preview');
}

os.api('meta', { detail: true }).then(_meta => {
	meta = _meta;
});

os.apiGet('federation/instances', {
	sort: '+pubSub',
	limit: 20,
}).then(_instances => {
	instances = _instances;
});
</script>

<style lang="scss" scoped>
.rsqzvsbo {
	> .bg {
		position: fixed;
		top: 0;
		right: 0;
		width: 80vw; // 100%からshapeの幅を引いている
		height: 100vh;
	}

	> .tl {
		position: fixed;
		top: 0;
		bottom: 0;
		right: 64px;
		margin: auto;
		padding: 128px 0;
		width: 500px;
		height: calc(100% - 256px);
		overflow: hidden;
		-webkit-mask-image: linear-gradient(0deg, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 128px, rgba(0,0,0,1) calc(100% - 128px), rgba(0,0,0,0) 100%);
		mask-image: linear-gradient(0deg, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 128px, rgba(0,0,0,1) calc(100% - 128px), rgba(0,0,0,0) 100%);

		@media (max-width: 1200px) {
			display: none;
		}
	}

	> .shape1 {
		position: fixed;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
    background: linear-gradient(270deg, #e7a2a2, #e3cfa2, #ebefa1, #b3e7a6, #a6ebe7, #aec5e3, #cabded, #e0b9e3, #f4bddd);    background-size: 1800% 1800%;
    -webkit-animation: AnimationLight 45s cubic-bezier(0, 0.25, 0.75, 1)  infinite;
    -moz-animation: AnimationLight 45s cubic-bezier(0, 0.25, 0.75, 1)  infinite;
    animation: AnimationLight 45s cubic-bezier(0, 0.25, 0.75, 1)  infinite;
		clip-path: polygon(0% 0%, 45% 0%, 20% 100%, 0% 100%);
	}
	> .shape2 {
		position: fixed;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
    background: linear-gradient(270deg, #e7a2a2, #e3cfa2, #ebefa1, #b3e7a6, #a6ebe7, #aec5e3, #cabded, #e0b9e3, #f4bddd);    background-size: 1800% 1800%;
    -webkit-animation: AnimationLight 45s cubic-bezier(0, 0.25, 0.75, 1)  infinite;
    -moz-animation: AnimationLight 45s cubic-bezier(0, 0.25, 0.75, 1)  infinite;
    animation: AnimationLight 45s cubic-bezier(0, 0.25, 0.75, 1)  infinite;
		clip-path: polygon(0% 0%, 25% 0%, 35% 100%, 0% 100%);
		opacity: 0.5;
	}

	> .misskey {
		position: fixed;
		top: 42px;
		left: 42px;
		width: 140px;

		@media (max-width: 450px) {
			width: 130px;
		}
	}

	> .emojis {
		position: fixed;
		bottom: 32px;
		left: 35px;

		> * {
			margin-right: 8px;
		}

		@media (max-width: 1200px) {
			display: none;
		}
	}

	> .contents {
		position: relative;
		width: min(430px, calc(100% - 32px));
		margin-left: 128px;
		padding: 100px 0 100px 0;

		@media (max-width: 1200px) {
			margin: auto;
		}
	}

	> .federation {
		position: fixed;
		bottom: 16px;
		left: 0;
		right: 0;
		margin: auto;
		background: var(--acrylicPanel);
		-webkit-backdrop-filter: var(--blur, blur(15px));
		backdrop-filter: var(--blur, blur(15px));
		border-radius: 999px;
		overflow: clip;
		width: 800px;
		padding: 8px 0;

		@media (max-width: 900px) {
			display: none;
		}
	}
}
@-webkit-keyframes AnimationLight {
  0% {
    background-position: 0% 50%
  }
  50% {
    background-position: 100% 50%
  }
  100% {
    background-position: 0% 50%
  }
}
@-moz-keyframes AnimationLight {
  0% {
    background-position: 0% 50%
  }
  50% {
    background-position: 100% 50%
  }
  100% {
    background-position: 0% 50%
  }
}  @keyframes AnimationLight {
     0% {
       background-position: 0% 50%
     }
     50% {
       background-position: 100% 50%
     }
     100% {
       background-position: 0% 50%
     }
   }
@-webkit-keyframes AnimationDark {
  0% {
    background-position: 0% 50%
  }
  50% {
    background-position: 100% 50%
  }
  100% {
    background-position: 0% 50%
  }
}
@-moz-keyframes AnimationDark {
  0% {
    background-position: 0% 50%
  }
  50% {
    background-position: 100% 50%
  }
  100% {
    background-position: 0% 50%
  }
}
@keyframes AnimationDark {
  0% {
    background-position: 0% 50%
  }
  50% {
    background-position: 100% 50%
  }
  100% {
    background-position: 0% 50%
  }
}
</style>

<style lang="scss" module>
.federationInstance {
	display: inline-flex;
	align-items: center;
	vertical-align: bottom;
	padding: 6px 12px 6px 6px;
	margin: 0 10px 0 0;
	background: var(--panel);
	border-radius: 999px;

	> :global(.icon) {
		display: inline-block;
		width: 20px;
		height: 20px;
		margin-right: 5px;
		border-radius: 999px;
	}
}
</style>
