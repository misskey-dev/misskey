<template>
<div class="sqxihjet">
	<div v-if="narrow === false" class="wide">
		<div class="content">
			<MkA to="/" class="link" active-class="active"><i class="ti ti-home icon"></i>{{ $ts.home }}</MkA>
			<MkA v-if="isTimelineAvailable" to="/timeline" class="link" active-class="active"><i class="ti ti-message icon"></i>{{ $ts.timeline }}</MkA>
			<MkA to="/explore" class="link" active-class="active"><i class="ti ti-hash icon"></i>{{ $ts.explore }}</MkA>
			<MkA to="/channels" class="link" active-class="active"><i class="ti ti-device-tv icon"></i>{{ $ts.channel }}</MkA>
			<div class="right">
				<button class="_button search" @click="search()"><i class="ti ti-search icon"></i><span>{{ $ts.search }}</span></button>
				<button class="_buttonPrimary signup" @click="signup()">{{ $ts.signup }}</button>
				<button class="_button login" @click="signin()">{{ $ts.login }}</button>
			</div>
		</div>
	</div>
	<div v-else-if="narrow === true" class="narrow">
		<button class="menu _button" @click="$parent.showMenu = true">
			<i class="ti ti-menu-2 icon"></i>
		</button>
	</div>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import XSigninDialog from '@/components/MkSigninDialog.vue';
import XSignupDialog from '@/components/MkSignupDialog.vue';
import * as os from '@/os';
import { instance } from '@/instance';
import { mainRouter } from '@/router';

export default defineComponent({
	data() {
		return {
			narrow: null,
			showMenu: false,
			isTimelineAvailable: instance.policies.ltlAvailable || instance.policies.gtlAvailable,
		};
	},

	mounted() {
		this.narrow = this.$el.clientWidth < 1300;
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

		search() {
			mainRouter.push('/search');
		},
	},
});
</script>

<style lang="scss" scoped>
.sqxihjet {
	$height: 50px;
	position: sticky;
	width: 50px;
	top: 0;
	left: 0;
	z-index: 1000;
	line-height: $height;
	-webkit-backdrop-filter: var(--blur, blur(32px));
	backdrop-filter: var(--blur, blur(32px));
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
