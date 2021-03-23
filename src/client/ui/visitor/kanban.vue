<template>
<div class="rwqkcmrc" :style="{ backgroundImage: transparent ? 'none' : `url(${ $instance.backgroundImageUrl })` }">
	<div class="back" :class="{ transparent }"></div>
	<div class="contents">
		<div class="wrapper">
			<h1 v-if="meta" :class="{ full }">
				<MkA to="/" class="link"><img class="logo" v-if="meta.logoImageUrl" :src="meta.logoImageUrl"><span v-else class="text">{{ instanceName }}</span></MkA>
			</h1>
			<template v-if="full">
				<div class="about" v-if="meta">
					<div class="desc" v-html="meta.description || $ts.introMisskey"></div>
				</div>
				<div class="action">
					<button class="_buttonPrimary" @click="signup()">{{ $ts.signup }}</button>
					<button class="_button" @click="signin()">{{ $ts.login }}</button>
				</div>
				<div class="announcements panel">
					<header>{{ $ts.announcements }}</header>
					<MkPagination :pagination="announcements" #default="{items}" class="list">
						<section class="item" v-for="(announcement, i) in items" :key="announcement.id">
							<div class="title">{{ announcement.title }}</div>
							<div class="content">
								<Mfm :text="announcement.text"/>
								<img v-if="announcement.imageUrl" :src="announcement.imageUrl"/>
							</div>
						</section>
					</MkPagination>
				</div>
				<div class="powered-by" v-if="poweredBy">
					<b><MkA to="/">{{ host }}</MkA></b>
					<small>Powered by <a href="https://github.com/syuilo/misskey" target="_blank">Misskey</a></small>
				</div>
			</template>
		</div>
	</div>
</div>
</template>

<script lang="ts">
import { defineComponent, defineAsyncComponent } from 'vue';
import { } from '@fortawesome/free-solid-svg-icons';
import { host, instanceName } from '@client/config';
import * as os from '@client/os';
import MkPagination from '@client/components/ui/pagination.vue';
import XSigninDialog from '@client/components/signin-dialog.vue';
import XSignupDialog from '@client/components/signup-dialog.vue';
import MkButton from '@client/components/ui/button.vue';

export default defineComponent({
	components: {
		MkPagination,
		MkButton,
	},

	props: {
		full: {
			type: Boolean,
			required: false,
			default: false,
		},
		transparent: {
			type: Boolean,
			required: false,
			default: false,
		},
		poweredBy: {
			type: Boolean,
			required: false,
			default: false,
		},
	},

	data() {
		return {
			host,
			instanceName,
			pageInfo: null,
			meta: null,
			narrow: window.innerWidth < 1280,
			announcements: {
				endpoint: 'announcements',
				limit: 10,
			},
		};
	},

	created() {
		os.api('meta', { detail: true }).then(meta => {
			this.meta = meta;
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
		}
	}
});
</script>

<style lang="scss" scoped>
.rwqkcmrc {
	position: relative;
	text-align: center;
	background-position: center;
	background-size: cover;
	// TODO: パララックスにしたい

	> .back {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: rgba(0, 0, 0, 0.3);

		&.transparent {
			-webkit-backdrop-filter: blur(12px);
			backdrop-filter: blur(12px);
		}
	}

	> .contents {
		position: relative;
		z-index: 1;
		height: inherit;
		overflow: auto;

		> .wrapper {
			max-width: 380px;
			padding: 0 16px;
			box-sizing: border-box;
			margin: 0 auto;

			> .panel {
				-webkit-backdrop-filter: blur(8px);
				backdrop-filter: blur(8px);
				background: rgba(0, 0, 0, 0.5);
				border-radius: var(--radius);

				&, * {
					color: #fff !important;
				}
			}

			> h1 {
				display: block;
				margin: 0;
				padding: 32px 0 32px 0;
				color: #fff;

				&.full {
					padding: 64px 0 0 0;

					> .link {
						> ::v-deep(.logo) {
							max-height: 130px;
						}
					}
				}

				> .link {
					display: block;

					> ::v-deep(.logo) {
						vertical-align: bottom;
						max-height: 100px;
					}
				}
			}

			> .about {
				display: block;
				margin: 24px 0;
				text-align: center;
				box-sizing: border-box;
				text-shadow: 0 0 8px black;
				color: #fff;
			}

			> .action {
				> button {
					display: block;
					width: 100%;
					padding: 10px;
					box-sizing: border-box;
					text-align: center;
					border-radius: 999px;

					&._button {
						background: var(--panel);
					}

					&:first-child {
						margin-bottom: 16px;
					}
				}
			}

			> .announcements {
				margin: 32px 0;
				text-align: left;

				> header {
					padding: 12px 16px;
					border-bottom: solid 1px rgba(255, 255, 255, 0.5);
				}

				> .list {
					max-height: 300px;
					overflow: auto;

					> .item {
						padding: 12px 16px;

						& + .item {
							border-top: solid 1px rgba(255, 255, 255, 0.5);
						}

						> .title {
							font-weight: bold;
						}

						> .content {
							> img {
								max-width: 100%;
							}
						}
					}
				}
			}

			> .powered-by {
				padding: 28px;
				font-size: 14px;
				text-align: center;
				border-top: 1px solid rgba(255, 255, 255, 0.5);
				color: #fff;

				> small {
					display: block;
					margin-top: 8px;
					opacity: 0.5;
				}
			}
		}
	}
}
</style>
