<template>
<div v-if="meta" class="rsqzvsbo">
	<div class="top">
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
		<div class="main _panel">
			<div class="bg">
				<div class="fade"></div>
			</div>
			<div class="fg">
				<h1>
					<!-- 背景色によってはロゴが見えなくなるのでとりあえず無効に -->
					<!-- <img class="logo" v-if="meta.logoImageUrl" :src="meta.logoImageUrl"><span v-else class="text">{{ instanceName }}</span> -->
					<span class="text">{{ instanceName }}</span>
				</h1>
				<div class="about">
					<div class="desc" v-html="meta.description || $ts.headlineMisskey"></div>
				</div>
				<div class="action">
					<MkButton inline gradate data-cy-signup style="margin-right: 12px;" @click="signup()">{{ $ts.signup }}</MkButton>
					<MkButton inline data-cy-signin @click="signin()">{{ $ts.login }}</MkButton>
				</div>
				<div v-if="onlineUsersCount && stats" class="status">
					<div>
						<I18n :src="$ts.nUsers" text-tag="span" class="users">
							<template #n><b>{{ number(stats.originalUsersCount) }}</b></template>
						</I18n>
						<I18n :src="$ts.nNotes" text-tag="span" class="notes">
							<template #n><b>{{ number(stats.originalNotesCount) }}</b></template>
						</I18n>
					</div>
					<I18n :src="$ts.onlineUsersCount" text-tag="span" class="online">
						<template #n><b>{{ onlineUsersCount }}</b></template>
					</I18n>
				</div>
				<button class="_button _acrylic menu" @click="showMenu"><i class="fas fa-ellipsis-h"></i></button>
			</div>
		</div>
	</div>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { toUnicode } from 'punycode/';
import XSigninDialog from '@/components/signin-dialog.vue';
import XSignupDialog from '@/components/signup-dialog.vue';
import MkButton from '@/components/ui/button.vue';
import XNote from '@/components/note.vue';
import MkFeaturedPhotos from '@/components/featured-photos.vue';
import XTimeline from './welcome.timeline.vue';
import { host, instanceName } from '@/config';
import * as os from '@/os';
import number from '@/filters/number';

export default defineComponent({
	components: {
		MkButton,
		XNote,
		MkFeaturedPhotos,
		XTimeline,
	},

	data() {
		return {
			host: toUnicode(host),
			instanceName,
			meta: null,
			stats: null,
			tags: [],
			onlineUsersCount: null,
		};
	},

	created() {
		os.api('meta', { detail: true }).then(meta => {
			this.meta = meta;
		});

		os.api('stats').then(stats => {
			this.stats = stats;
		});

		os.api('get-online-users-count').then(res => {
			this.onlineUsersCount = res.count;
		});

		os.api('hashtags/list', {
			sort: '+mentionedLocalUsers',
			limit: 8
		}).then(tags => {
			this.tags = tags;
		});
	},

	methods: {
		signin() {
			os.popup(XSigninDialog, {
				autoSet: true
			}, {}, 'closed');
		},

		signup() {
			os.popup(XSignupDialog, {
				autoSet: true
			}, {}, 'closed');
		},

		showMenu(ev) {
			os.popupMenu([{
				text: this.$t('aboutX', { x: instanceName }),
				icon: 'fas fa-info-circle',
				action: () => {
					os.pageWindow('/about');
				}
			}, {
				text: this.$ts.aboutMisskey,
				icon: 'fas fa-info-circle',
				action: () => {
					os.pageWindow('/about-misskey');
				}
			}, null, {
				text: this.$ts.help,
				icon: 'fas fa-question-circle',
				action: () => {
					window.open(`https://misskey-hub.net/help.md`, '_blank');
				}
			}], ev.currentTarget || ev.target);
		},

		number
	}
});
</script>

<style lang="scss" scoped>
.rsqzvsbo {
	> .top {
		display: flex;
		text-align: center;
		min-height: 100vh;
		box-sizing: border-box;
		padding: 16px;

		> .bg {
			position: absolute;
			top: 0;
			right: 0;
			width: 80%; // 100%からshapeの幅を引いている
			height: 100%;
		}

		> .tl {
			position: absolute;
			top: 0;
			bottom: 0;
			right: 64px;
			margin: auto;
			width: 500px;
			height: calc(100% - 128px);
			overflow: hidden;
			-webkit-mask-image: linear-gradient(0deg, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 128px, rgba(0,0,0,1) calc(100% - 128px), rgba(0,0,0,0) 100%);
			mask-image: linear-gradient(0deg, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 128px, rgba(0,0,0,1) calc(100% - 128px), rgba(0,0,0,0) 100%);

			@media (max-width: 1200px) {
				display: none;
			}
		}

		> .shape1 {
			position: absolute;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			background: var(--accent);
			clip-path: polygon(0% 0%, 45% 0%, 20% 100%, 0% 100%);
		}
		> .shape2 {
			position: absolute;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			background: var(--accent);
			clip-path: polygon(0% 0%, 25% 0%, 35% 100%, 0% 100%);
			opacity: 0.5;
		}

		> .misskey {
			position: absolute;
			top: 42px;
			left: 42px;
			width: 160px;

			@media (max-width: 450px) {
				width: 130px;
			}
		}

		> .emojis {
			position: absolute;
			bottom: 32px;
			left: 35px;

			> * {
				margin-right: 8px;
			}

			@media (max-width: 1200px) {
				display: none;
			}
		}

		> .main {
			position: relative;
			width: min(480px, 100%);
			margin: auto auto auto 128px;
			box-shadow: 0 12px 32px rgb(0 0 0 / 25%);

			@media (max-width: 1200px) {
				margin: auto;
			}

			> .bg {
				position: absolute;
				top: 0;
				left: 0;
				width: 100%;
				height: 128px;
				background-position: center;
				background-size: cover;
				opacity: 0.75;

				> .fade {
					position: absolute;
					bottom: 0;
					left: 0;
					width: 100%;
					height: 128px;
					background: linear-gradient(0deg, var(--panel), var(--X15));
				}
			}

			> .fg {
				position: relative;
				z-index: 1;

				> h1 {
					display: block;
					margin: 0;
					padding: 32px 32px 24px 32px;
					font-size: 1.5em;

					> .logo {
						vertical-align: bottom;
						max-height: 120px;
						max-width: min(100%, 300px);
					}
				}

				> .about {
					padding: 0 32px;
				}

				> .action {
					padding: 32px;

					> * {
						line-height: 28px;
					}
				}

				> .status {
					border-top: solid 0.5px var(--divider);
					padding: 32px;
					font-size: 90%;

					> div {
						> span:not(:last-child) {
							padding-right: 1em;
							margin-right: 1em;
							border-right: solid 0.5px var(--divider);
						}
					}

					> .online {
						::v-deep(b) {
							color: #41b781;
						}

						::v-deep(span) {
							opacity: 0.7;
						}
					}
				}

				> .menu {
					position: absolute;
					top: 16px;
					right: 16px;
					width: 32px;
					height: 32px;
					border-radius: 8px;
				}
			}
		}
	}
}
</style>
