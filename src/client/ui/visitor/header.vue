<template>
<div class="sqxihjet">
	<div class="content">
		<MkA to="/" class="link" active-class="active">{{ $t('home') }}</MkA>
		<MkA to="/explore" class="link" active-class="active">{{ $t('explore') }}</MkA>
		<MkA to="/featured" class="link" active-class="active">{{ $t('featured') }}</MkA>
		<MkA to="/channels" class="link" active-class="active">{{ $t('channel') }}</MkA>
		<div class="page link" v-if="info">
			<div class="title">
				<Fa v-if="info.icon" :icon="info.icon" :key="info.icon" class="icon"/>
				<MkAvatar v-else-if="info.avatar" class="avatar" :user="info.avatar" :disable-preview="true"/>
				<span v-if="info.title" class="text">{{ info.title }}</span>
				<MkUserName v-else-if="info.userName" :user="info.userName" :nowrap="false" class="text"/>
			</div>
			<button class="_button action" v-if="info.action" @click.stop="info.action.handler"><Fa :icon="info.action.icon" :key="info.action.icon"/></button>
		</div>
		<div class="right">
			<button class="_button search" @click="search()"><Fa :icon="faSearch" class="icon"/><span>{{ $t('search') }}</span></button>
			<button class="_buttonPrimary signup" @click="signup()">{{ $t('signup') }}</button>
			<button class="_button login" @click="signin()">{{ $t('login') }}</button>
		</div>
	</div>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faSearch } from '@fortawesome/free-solid-svg-icons';
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
			faSearch
		};
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
	line-height: $height;
	background: var(--panel);

	> .content {
		max-width: 1400px;
		margin: 0 auto;
		display: flex;
		align-items: center;

		> .link {
			display: inline-block;
			padding: 0 16px;
			line-height: $height - 4px;
			border-top: solid 2px transparent;
			border-bottom: solid 2px transparent;

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

				> .indicator {
					position: absolute;
					top: initial;
					right: 8px;
					top: 8px;
					color: var(--indicator);
					font-size: 12px;
					animation: blink 1s infinite;
				}

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
</style>
