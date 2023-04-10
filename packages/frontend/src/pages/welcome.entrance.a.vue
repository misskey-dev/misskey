<template>
<div v-if="meta" class="rsqzvsbo">
	<MkFeaturedPhotos class="bg"/>
	<XTimeline class="tl"/>
	<div class="shape1"></div>
	<div class="shape2"></div>
	<img src="/client-assets/misskey.svg" class="misskey"/>
	<div class="emojis">
		<MkEmoji :normal="true" :no-style="true" emoji="👍"/>
		<MkEmoji :normal="true" :no-style="true" emoji="❤"/>
		<MkEmoji :normal="true" :no-style="true" emoji="😆"/>
		<MkEmoji :normal="true" :no-style="true" emoji="🎉"/>
		<MkEmoji :normal="true" :no-style="true" emoji="🍮"/>
	</div>
	<div class="contents">
		<div class="main">
			<img :src="instance.iconUrl || instance.faviconUrl || '/favicon.ico'" alt="" class="icon"/>
			<button class="_button _acrylic menu" @click="showMenu"><i class="ti ti-dots"></i></button>
			<div class="fg">
				<h1>
					<!-- 背景色によってはロゴが見えなくなるのでとりあえず無効に -->
					<!-- <img class="logo" v-if="meta.logoImageUrl" :src="meta.logoImageUrl"><span v-else class="text">{{ instanceName }}</span> -->
					<span class="text">{{ instanceName }}</span>
				</h1>
				<div class="about">
					<!-- eslint-disable-next-line vue/no-v-html -->
					<div class="desc" v-html="meta.description || i18n.ts.headlineMisskey"></div>
				</div>
				<div v-if="instance.disableRegistration" class="warn">
					<MkInfo warn>{{ i18n.ts.invitationRequiredToRegister }}</MkInfo>
				</div>
				<div class="action _gaps_s">
					<MkButton full rounded gradate data-cy-signup style="margin-right: 12px;" @click="signup()">{{ i18n.ts.joinThisServer }}</MkButton>
					<MkButton full rounded @click="exploreOtherServers()">{{ i18n.ts.exploreOtherServers }}</MkButton>
					<MkButton full rounded data-cy-signin @click="signin()">{{ i18n.ts.login }}</MkButton>
				</div>
			</div>
		</div>
		<div v-if="instance.policies.ltlAvailable" class="tl">
			<div class="title">{{ i18n.ts.letsLookAtTimeline }}</div>
			<div class="body">
				<MkTimeline src="local"/>
			</div>
		</div>
	</div>
	<div v-if="instances && instances.length > 0" class="federation">
		<MarqueeText :duration="40">
			<MkA v-for="instance in instances" :key="instance.id" :class="$style.federationInstance" :to="`/instance-info/${instance.host}`" behavior="window">
				<!--<MkInstanceCardMini :instance="instance"/>-->
				<img v-if="instance.iconUrl" class="icon" :src="instance.iconUrl" alt=""/>
				<span class="name _monospace">{{ instance.host }}</span>
			</MkA>
		</MarqueeText>
	</div>
</div>
</template>

<script lang="ts" setup>
import { } from 'vue';
import { Instance } from 'misskey-js/built/entities';
import XTimeline from './welcome.timeline.vue';
import MarqueeText from '@/components/MkMarquee.vue';
import XSigninDialog from '@/components/MkSigninDialog.vue';
import XSignupDialog from '@/components/MkSignupDialog.vue';
import MkButton from '@/components/MkButton.vue';
import MkFeaturedPhotos from '@/components/MkFeaturedPhotos.vue';
import MkTimeline from '@/components/MkTimeline.vue';
import MkInfo from '@/components/MkInfo.vue';
import { instanceName } from '@/config';
import * as os from '@/os';
import { i18n } from '@/i18n';
import { instance } from '@/instance';

let meta = $ref<Instance>();
let instances = $ref<any[]>();

os.api('meta', { detail: true }).then(_meta => {
	meta = _meta;
});

os.apiGet('federation/instances', {
	sort: '+pubSub',
	limit: 20,
}).then(_instances => {
	instances = _instances;
});

function signin() {
	os.popup(XSigninDialog, {
		autoSet: true,
	}, {}, 'closed');
}

function signup() {
	os.popup(XSignupDialog, {
		autoSet: true,
	}, {}, 'closed');
}

function showMenu(ev) {
	os.popupMenu([{
		text: i18n.ts.instanceInfo,
		icon: 'ti ti-info-circle',
		action: () => {
			os.pageWindow('/about');
		},
	}, {
		text: i18n.ts.aboutMisskey,
		icon: 'ti ti-info-circle',
		action: () => {
			os.pageWindow('/about-misskey');
		},
	}, null, {
		text: i18n.ts.help,
		icon: 'ti ti-question-circle',
		action: () => {
			window.open('https://misskey-hub.net/help.md', '_blank');
		},
	}], ev.currentTarget ?? ev.target);
}

function exploreOtherServers() {
	// TODO: 言語をよしなに
	window.open('https://join.misskey.page/ja-JP/instances', '_blank');
}
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
		background: var(--accent);
		clip-path: polygon(0% 0%, 45% 0%, 20% 100%, 0% 100%);
	}
	> .shape2 {
		position: fixed;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
		background: var(--accent);
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
		padding: 150px 0 100px 0;

		@media (max-width: 1200px) {
			margin: auto;
		}

		> .main {
			position: relative;
			background: var(--panel);
			border-radius: var(--radius);
			box-shadow: 0 12px 32px rgb(0 0 0 / 25%);
			text-align: center;
		
			> .icon {
				width: 85px;
				margin-top: -47px;
				border-radius: 100%;
				vertical-align: bottom;
			}

			> .menu {
				position: absolute;
				top: 16px;
				right: 16px;
				width: 32px;
				height: 32px;
				border-radius: 8px;
				font-size: 18px;
			}

			> .fg {
				position: relative;
				z-index: 1;

				> h1 {
					display: block;
					margin: 0;
					padding: 16px 32px 24px 32px;
					font-size: 1.4em;

					> .logo {
						vertical-align: bottom;
						max-height: 120px;
						max-width: min(100%, 300px);
					}
				}

				> .about {
					padding: 0 32px;
				}

				> .warn {
					padding: 32px 32px 0 32px;
				}

				> .action {
					padding: 32px;

					> * {
						line-height: 28px;
					}
				}
			}
		}

		> .tl {
			position: relative;
			background: var(--panel);
			border-radius: var(--radius);
			overflow: clip;
			box-shadow: 0 12px 32px rgb(0 0 0 / 25%);
			margin-top: 16px;

			> .title {
				padding: 12px 16px;
				border-bottom: solid 1px var(--divider);
			}

			> .body {
				height: 350px;
				overflow: auto;
			}
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
