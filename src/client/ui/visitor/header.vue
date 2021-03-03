<template>
<div class="sqxihjet">
	<div class="wide" v-if="narrow === false">
		<div class="content">
			<MkA to="/" class="link" active-class="active"><Fa :icon="faHome" class="icon"/>{{ $ts.home }}</MkA>
			<MkA to="/explore" class="link" active-class="active"><Fa :icon="faHashtag" class="icon"/>{{ $ts.explore }}</MkA>
			<MkA to="/featured" class="link" active-class="active"><Fa :icon="faFireAlt" class="icon"/>{{ $ts.featured }}</MkA>
			<MkA to="/channels" class="link" active-class="active"><Fa :icon="faSatelliteDish" class="icon"/>{{ $ts.channel }}</MkA>
			<div class="page active link" v-if="info">
				<div class="title">
					<Fa v-if="info.icon" :icon="info.icon" :key="info.icon" class="icon"/>
					<MkAvatar v-else-if="info.avatar" class="avatar" :user="info.avatar" :disable-preview="true"/>
					<span v-if="info.title" class="text">{{ info.title }}</span>
					<MkUserName v-else-if="info.userName" :user="info.userName" :nowrap="false" class="text"/>
				</div>
				<button class="_button action" v-if="info.action" @click.stop="info.action.handler"><Fa :icon="info.action.icon" :key="info.action.icon"/></button>
			</div>
			<div class="right">
				<button class="_button search" @click="search()"><Fa :icon="faSearch" class="icon"/><span>{{ $ts.search }}</span></button>
				<button class="_buttonPrimary signup" @click="signup()">{{ $ts.signup }}</button>
				<button class="_button login" @click="signin()">{{ $ts.login }}</button>
			</div>
		</div>
	</div>
	<div class="narrow" v-else-if="narrow === true">
		<button class="menu _button" @click="$parent.showMenu = true">
			<Fa :icon="faBars" class="icon"/>
		</button>
		<div class="title" v-if="info">
			<Fa v-if="info.icon" :icon="info.icon" :key="info.icon" class="icon"/>
			<MkAvatar v-else-if="info.avatar" class="avatar" :user="info.avatar" :disable-preview="true"/>
			<span v-if="info.title" class="text">{{ info.title }}</span>
			<MkUserName v-else-if="info.userName" :user="info.userName" :nowrap="false" class="text"/>
		</div>
		<button class="action _button" v-if="info && info.action" @click.stop="info.action.handler">
			<Fa :icon="info.action.icon" :key="info.action.icon" class="icon"/>
		</button>
	</div>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faSearch, faHome, faFireAlt, faHashtag, faSatelliteDish, faBars } from '@fortawesome/free-solid-svg-icons';
import XSigninDialog from '@/components/signin-dialog.vue';
import XSignupDialog from '@/components/signup-dialog.vue';
import * as os from '@/os';
import { search } from '@/scripts/search';

export default defineComponent({
	props: {
		info: {
			required: true
		},
	},

	data() {
		return {
			narrow: null,
			showMenu: false,
			faSearch, faHome, faFireAlt, faHashtag, faSatelliteDish, faBars,
		};
	},

	mounted() {
		this.narrow = this.$el.clientWidth < 1300;
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

		search
	}
});
</script>

<style lang="scss" scoped>
.sqxihjet {
	$height: 60px;
	position: sticky;
	top: 0;
	left: 0;
	z-index: 1000;
	line-height: $height;
	-webkit-backdrop-filter: blur(32px);
	backdrop-filter: blur(32px);
	background-color: var(--X16);

	> .wide {
		> .content {
			max-width: 1400px;
			margin: 0 auto;
			display: flex;
			align-items: center;

			> .link {
				$line: 3px;
				display: inline-block;
				padding: 0 16px;
				line-height: $height - ($line * 2);
				border-top: solid $line transparent;
				border-bottom: solid $line transparent;

				> .icon {
					margin-right: 0.5em;
				}

				&.page {
					border-bottom-color: var(--accent);
				}
			}

			> .page {
				> .title {
					display: inline-block;
					vertical-align: bottom;
					white-space: nowrap;
					overflow: hidden;
					text-overflow: ellipsis;
					position: relative;

					> .icon + .text {
						margin-left: 8px;
					}

					> .avatar {
						$size: 32px;
						display: inline-block;
						width: $size;
						height: $size;
						vertical-align: middle;
						margin-right: 8px;
						pointer-events: none;
					}

					&._button {
						&:hover {
							color: var(--fgHighlighted);
						}
					}

					&.selected {
						box-shadow: 0 -2px 0 0 var(--accent) inset;
						color: var(--fgHighlighted);
					}
				}

				> .action {
					padding: 0 0 0 16px;
				}
			}

			> .right {
				margin-left: auto;

				> .search {
					background: var(--bg);
					border-radius: 999px;
					width: 230px;
					line-height: $height - 20px;
					margin-right: 16px;
					text-align: left;

					> * {
						opacity: 0.7;
					}

					> .icon {
						padding: 0 16px;
					}
				}

				> .signup {
					border-radius: 999px;
					padding: 0 24px;
					line-height: $height - 20px;
				}

				> .login {
					padding: 0 16px;
				}
			}
		}
	}

	> .narrow {
		display: flex;

		> .menu,
		> .action {
			width: $height;
			height: $height;
			font-size: 20px;
		}

		> .title {
			flex: 1;
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
			position: relative;
			text-align: center;

			> .icon + .text {
				margin-left: 8px;
			}

			> .avatar {
				$size: 32px;
				display: inline-block;
				width: $size;
				height: $size;
				vertical-align: middle;
				margin-right: 8px;
				pointer-events: none;
			}
		}
	}
}
</style>
