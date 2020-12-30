<template>
<div class="rsqzvsbo" v-if="meta">
	<div class="top">
		<div class="shape"></div>
		<img src="/assets/misskey.svg" class="misskey"/>
		<div class="main _panel">
			<div class="bg" :style="{ backgroundImage: `url(${ meta.bannerUrl })` }">
				<div class="fade"></div>
			</div>
			<div class="fg">
				<h1>
					<img class="logo" v-if="meta.logoImageUrl" :src="meta.logoImageUrl"><span v-else class="text">{{ instanceName }}</span>
				</h1>
				<div class="about">
					<div class="desc" v-html="meta.description || $ts.introMisskey"></div>
				</div>
				<div class="action">
					<MkButton @click="signup()" inline primary>{{ $ts.signup }}</MkButton>
					<MkButton @click="signin()" inline>{{ $ts.login }}</MkButton>
				</div>
				<div class="status" v-if="onlineUsersCount">
					<I18n :src="$ts.onlineUsersCount" text-tag="span" class="online">
						<template #n><b>{{ onlineUsersCount }}</b></template>
					</I18n>
				</div>
				<button class="_button _acrylic menu" @click="showMenu"><Fa :icon="faEllipsisH"/></button>
			</div>
		</div>
	</div>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faEllipsisH, faInfoCircle, faQuestionCircle } from '@fortawesome/free-solid-svg-icons';
import { toUnicode } from 'punycode';
import XSigninDialog from '@/components/signin-dialog.vue';
import XSignupDialog from '@/components/signup-dialog.vue';
import MkButton from '@/components/ui/button.vue';
import XNote from '@/components/note.vue';
import MkPagination from '@/components/ui/pagination.vue';
import { host, instanceName } from '@/config';
import * as os from '@/os';
import number from '@/filters/number';

export default defineComponent({
	components: {
		MkButton,
		XNote,
		MkPagination,
	},

	data() {
		return {
			host: toUnicode(host),
			instanceName,
			meta: null,
			stats: null,
			tags: [],
			onlineUsersCount: null,
			clipPagination: {
				endpoint: 'clips/notes',
				limit: 10,
				params: () => ({
					clipId: this.meta.pinnedClipId,
				})
			},
			featuredPagination: {
				endpoint: 'notes/featured',
				limit: 10,
				offsetMode: true
			},
			faEllipsisH
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
				icon: faInfoCircle,
				action: () => {
					os.pageWindow('/about');
				}
			}, {
				text: this.$ts.aboutMisskey,
				icon: faInfoCircle,
				action: () => {
					os.pageWindow('/about-misskey');
				}
			}, null, {
				text: this.$ts.help,
				icon: faQuestionCircle,
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
		display: flex;
		text-align: center;
		min-height: 100vh;
		box-sizing: border-box;
		padding: 16px;

		> .shape {
			position: absolute;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			background: var(--accent);
			clip-path: polygon(0% 0%, 50% 0%, 15% 100%, 0% 100%);
		}

		> .misskey {
			position: absolute;
			top: 24px;
			left: 24px;
			width: 160px;
		}

		> .main {
			position: relative;
			width: min(490px, 100%);
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
				}

				> .status {
					border-top: solid 1px var(--divider);
					padding: 32px;

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
