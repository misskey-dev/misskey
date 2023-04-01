<template>
<div v-if="meta" class="rsqzvsbo">
	<div class="top">
		<MkFeaturedPhotos class="bg"/>
		<div class="fade"></div>
		<div class="emojis">
			<MkEmoji :normal="true" :no-style="true" emoji="👍"/>
			<MkEmoji :normal="true" :no-style="true" emoji="❤"/>
			<MkEmoji :normal="true" :no-style="true" emoji="😆"/>
			<MkEmoji :normal="true" :no-style="true" emoji="🎉"/>
			<MkEmoji :normal="true" :no-style="true" emoji="🍮"/>
		</div>
		<div class="main">
			<img src="/client-assets/misskey.svg" class="misskey"/>
			<div class="form _panel">
				<div class="bg">
					<div class="fade"></div>
				</div>
				<div class="fg">
					<h1>
						<img v-if="meta.logoImageUrl" class="logo" :src="meta.logoImageUrl"><span v-else class="text">{{ instanceName }}</span>
					</h1>
					<div class="about">
						<!-- eslint-disable-next-line vue/no-v-html -->
						<div class="desc" v-html="meta.description || i18n.ts.headlineMisskey"></div>
					</div>
					<div class="action">
						<MkButton inline gradate @click="signup()">{{ i18n.ts.signup }}</MkButton>
						<MkButton inline @click="signin()">{{ i18n.ts.login }}</MkButton>
					</div>
					<div v-if="onlineUsersCount && stats" class="status">
						<div>
							<I18n :src="i18n.ts.nUsers" text-tag="span" class="users">
								<template #n><b>{{ number(stats.originalUsersCount) }}</b></template>
							</I18n>
							<I18n :src="i18n.ts.nNotes" text-tag="span" class="notes">
								<template #n><b>{{ number(stats.originalNotesCount) }}</b></template>
							</I18n>
						</div>
						<I18n :src="i18n.ts.onlineUsersCount" text-tag="span" class="online">
							<template #n><b>{{ onlineUsersCount }}</b></template>
						</I18n>
					</div>
					<button class="_button _acrylic menu" @click="showMenu"><i class="ti ti-dots"></i></button>
				</div>
			</div>
			<nav class="nav">
				<MkA to="/announcements">{{ i18n.ts.announcements }}</MkA>
				<MkA to="/explore">{{ i18n.ts.explore }}</MkA>
				<MkA to="/channels">{{ i18n.ts.channel }}</MkA>
				<MkA to="/featured">{{ i18n.ts.featured }}</MkA>
			</nav>
		</div>
	</div>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { toUnicode } from 'punycode/';
import XTimeline from './welcome.timeline.vue';
import XSigninDialog from '@/components/MkSigninDialog.vue';
import XSignupDialog from '@/components/MkSignupDialog.vue';
import MkButton from '@/components/MkButton.vue';
import MkNote from '@/components/MkNote.vue';
import MkFeaturedPhotos from '@/components/MkFeaturedPhotos.vue';
import { host, instanceName } from '@/config';
import * as os from '@/os';
import number from '@/filters/number';
import { i18n } from '@/i18n';

export default defineComponent({
	components: {
		MkButton,
		MkNote,
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
			i18n,
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
			limit: 8,
		}).then(tags => {
			this.tags = tags;
		});
	},

	methods: {
		signin() {
			os.popup(XSigninDialog, {
				autoSet: true,
			}, {}, 'closed');
		},

		signup() {
			os.popup(XSignupDialog, {
				autoSet: true,
			}, {}, 'closed');
		},

		showMenu(ev) {
			os.popupMenu([{
				text: i18n.t('aboutX', { x: instanceName }),
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
		},

		number,
	},
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
			left: 0;
			width: 100%;
			height: 100%;
		}

		> .fade {
			position: absolute;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			background: rgba(0, 0, 0, 0.25);
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
			width: min(460px, 100%);
			margin: auto;

			> .misskey {
				width: 150px;
				margin-bottom: 16px;

				@media (max-width: 450px) {
					width: 130px;
				}
			}

			> .form {
				position: relative;
				box-shadow: 0 12px 32px rgb(0 0 0 / 25%);

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

						> .logo {
							vertical-align: bottom;
							max-height: 120px;
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

			> .nav {
				position: relative;
				z-index: 2;
				margin-top: 20px;
				color: #fff;
				text-shadow: 0 0 8px black;
				font-size: 0.9em;

				> *:not(:last-child) {
					margin-right: 1.5em;
				}
			}
		}
	}
}
</style>
