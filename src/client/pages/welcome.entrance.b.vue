<template>
<div class="rsqzvsbo" v-if="meta">
	<div class="top">
		<MkFeaturedPhotos class="bg"/>
		<XTimeline class="tl"/>
		<div class="shape"></div>
		<div class="main">
			<h1>
				<img class="logo" v-if="meta.logoImageUrl" :src="meta.logoImageUrl"><span v-else class="text">{{ instanceName }}</span>
			</h1>
			<div class="about">
				<div class="desc" v-html="meta.description || $ts.headlineMisskey"></div>
			</div>
			<div class="action">
				<MkButton class="signup" @click="signup()" inline primary>{{ $ts.signup }}</MkButton>
				<MkButton class="signin" @click="signin()" inline>{{ $ts.login }}</MkButton>
			</div>
			<div class="status" v-if="onlineUsersCount && stats">
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
		</div>
		<img src="/static-assets/client/misskey.svg" class="misskey"/>
	</div>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { toUnicode } from 'punycode/';
import XSigninDialog from '@client/components/signin-dialog.vue';
import XSignupDialog from '@client/components/signup-dialog.vue';
import MkButton from '@client/components/ui/button.vue';
import XNote from '@client/components/note.vue';
import MkFeaturedPhotos from '@client/components/featured-photos.vue';
import XTimeline from './welcome.timeline.vue';
import { host, instanceName } from '@client/config';
import * as os from '@client/os';
import number from '@client/filters/number';

export default defineComponent({
	components: {
		MkButton,
		XNote,
		XTimeline,
		MkFeaturedPhotos,
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
			os.modalMenu([{
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
					os.pageWindow('/docs');
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
		min-height: 100vh;
		box-sizing: border-box;

		> .bg {
			position: absolute;
			top: 0;
			left: 0;
			width: 100%;
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
		}

		> .shape {
			position: absolute;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			background: var(--accent);
			clip-path: polygon(0% 0%, 40% 0%, 22% 100%, 0% 100%);
		}

		> .misskey {
			position: absolute;
			bottom: 64px;
			left: 64px;
			width: 160px;
		}

		> .main {
			position: relative;
			width: min(450px, 100%);
			padding: 64px;
			color: #fff;
			font-size: 1.1em;

			@media (max-width: 1200px) {
				margin: auto;
			}

			> h1 {
				display: block;
				margin: 0 0 32px 0;
				padding: 0;

				> .logo {
					vertical-align: bottom;
					max-height: 100px;
				}
			}

			> .about {
				padding: 0;
			}

			> .action {
				margin: 32px 0;

				> * {
					line-height: 32px;
				}

				> .signup {
					background: var(--panel);
					color: var(--fg);
				}

				> .signin {
					background: var(--accent);
					color: inherit;
				}
			}

			> .status {
				margin: 32px 0;
				border-top: solid 1px rgba(255, 255, 255, 0.5);
				font-size: 90%;

				> div {
					padding: 16px 0;

					> span:not(:last-child) {
						padding-right: 1em;
						margin-right: 1em;
						border-right: solid 1px rgba(255, 255, 255, 0.5);
					}
				}
			}
		}
	}
}
</style>
