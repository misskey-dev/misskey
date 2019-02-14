<template>
<div class="account" v-hotkey.global="keymap">
	<button class="header" :data-active="isOpen" @click="toggle">
		<span class="username">{{ $store.state.i.username }}<template v-if="!isOpen"><fa icon="angle-down"/></template><template v-if="isOpen"><fa icon="angle-up"/></template></span>
		<mk-avatar class="avatar" :user="$store.state.i"/>
	</button>
	<transition name="zoom-in-top">
		<div class="menu" v-if="isOpen">
			<ul>
				<li>
					<router-link :to="`/@${ $store.state.i.username }`">
						<i><fa icon="user"/></i>
						<span>{{ $t('profile') }}</span>
						<i><fa icon="angle-right"/></i>
					</router-link>
				</li>
				<li @click="drive">
					<p>
						<i><fa icon="cloud"/></i>
						<span>{{ $t('@.drive') }}</span>
						<i><fa icon="angle-right"/></i>
					</p>
				</li>
				<li>
					<router-link to="/i/favorites">
						<i><fa icon="star"/></i>
						<span>{{ $t('favorites') }}</span>
						<i><fa icon="angle-right"/></i>
					</router-link>
				</li>
				<li @click="list">
					<p>
						<i><fa icon="list"/></i>
						<span>{{ $t('lists') }}</span>
						<i><fa icon="angle-right"/></i>
					</p>
				</li>
				<li @click="followRequests" v-if="($store.state.i.isLocked || $store.state.i.carefulBot)">
					<p>
						<i><fa :icon="['far', 'envelope']"/></i>
						<span>{{ $t('follow-requests') }}<i v-if="$store.state.i.pendingReceivedFollowRequestsCount">{{ $store.state.i.pendingReceivedFollowRequestsCount }}</i></span>
						<i><fa icon="angle-right"/></i>
					</p>
				</li>
			</ul>
			<ul>
				<li>
					<router-link to="/i/settings">
						<i><fa icon="cog"/></i>
						<span>{{ $t('settings') }}</span>
						<i><fa icon="angle-right"/></i>
					</router-link>
				</li>
				<li v-if="$store.state.i.isAdmin || $store.state.i.isModerator">
					<a href="/admin">
						<i><fa icon="terminal"/></i>
						<span>{{ $t('admin') }}</span>
						<i><fa icon="angle-right"/></i>
					</a>
				</li>
			</ul>
			<ul>
				<li @click="dark">
					<p>
						<span>{{ $t('dark') }}</span>
						<template v-if="$store.state.device.darkmode"><i><fa icon="moon"/></i></template>
						<template v-else><i><fa :icon="['far', 'moon']"/></i></template>
					</p>
				</li>
			</ul>
			<ul>
				<li @click="signout">
					<p class="signout">
						<i><fa icon="power-off"/></i>
						<span>{{ $t('signout') }}</span>
					</p>
				</li>
			</ul>
		</div>
	</transition>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';
import MkUserListsWindow from './user-lists-window.vue';
import MkUserListWindow from './user-list-window.vue';
import MkFollowRequestsWindow from './received-follow-requests-window.vue';
import MkSettingsWindow from './settings-window.vue';
import MkDriveWindow from './drive-window.vue';
import contains from '../../../common/scripts/contains';

export default Vue.extend({
	i18n: i18n('desktop/views/components/ui.header.account.vue'),
	data() {
		return {
			isOpen: false
		};
	},
	computed: {
		keymap(): any {
			return {
				'a|m': this.toggle
			};
		}
	},
	beforeDestroy() {
		this.close();
	},
	methods: {
		toggle() {
			this.isOpen ? this.close() : this.open();
		},
		open() {
			this.isOpen = true;
			for (const el of Array.from(document.querySelectorAll('body *'))) {
				el.addEventListener('mousedown', this.onMousedown);
			}
		},
		close() {
			this.isOpen = false;
			for (const el of Array.from(document.querySelectorAll('body *'))) {
				el.removeEventListener('mousedown', this.onMousedown);
			}
		},
		onMousedown(e) {
			e.preventDefault();
			if (!contains(this.$el, e.target) && this.$el != e.target) this.close();
			return false;
		},
		drive() {
			this.close();
			this.$root.new(MkDriveWindow);
		},
		list() {
			this.close();
			const w = this.$root.new(MkUserListsWindow);
			w.$once('choosen', list => {
				this.$root.new(MkUserListWindow, {
					list
				});
			});
		},
		followRequests() {
			this.close();
			this.$root.new(MkFollowRequestsWindow);
		},
		signout() {
			this.$root.signout();
		},
		dark() {
			this.$store.commit('device/set', {
				key: 'darkmode',
				value: !this.$store.state.device.darkmode
			});
		}
	}
});
</script>

<style lang="stylus" scoped>
.account
	> .header
		display block
		margin 0
		padding 0
		color var(--desktopHeaderFg)
		border none
		background transparent
		cursor pointer

		*
			pointer-events none

		&:hover
		&[data-active='true']
			color var(--desktopHeaderHoverFg)

			> .avatar
				filter saturate(150%)

		> .username
			display block
			float left
			margin 0 12px 0 16px
			max-width 16em
			line-height 48px
			font-weight bold
			font-family Meiryo, sans-serif
			text-decoration none

			@media (max-width 1100px)
				display none

			[data-icon]
				margin-left 8px

		> .avatar
			display block
			float left
			min-width 32px
			max-width 32px
			min-height 32px
			max-height 32px
			margin 8px 8px 8px 0
			border-radius 4px
			transition filter 100ms ease

			@media (max-width 1100px)
				margin-left 8px

	> .menu
		$bgcolor = var(--face)
		display block
		position absolute
		top 56px
		right -2px
		width 230px
		font-size 0.8em
		background $bgcolor
		border-radius 4px
		box-shadow 0 var(--lineWidth) 4px rgba(#000, 0.25)

		&:before
			content ""
			pointer-events none
			display block
			position absolute
			top -28px
			right 12px
			border-top solid 14px transparent
			border-right solid 14px transparent
			border-bottom solid 14px rgba(#000, 0.1)
			border-left solid 14px transparent

		&:after
			content ""
			pointer-events none
			display block
			position absolute
			top -27px
			right 12px
			border-top solid 14px transparent
			border-right solid 14px transparent
			border-bottom solid 14px $bgcolor
			border-left solid 14px transparent

		ul
			display block
			margin 10px 0
			padding 0
			list-style none

			& + ul
				padding-top 10px
				border-top solid var(--lineWidth) var(--faceDivider)

			> li
				display block
				margin 0
				padding 0

				> a
				> p
					display block
					z-index 1
					padding 0 28px
					margin 0
					line-height 40px
					color var(--text)
					cursor pointer

					*
						pointer-events none

					> span:first-child
						padding-left 22px

					> span:nth-child(2)
						> i
							margin-left 4px
							padding 2px 8px
							font-size 90%
							font-style normal
							background var(--primary)
							color var(--primaryForeground)
							border-radius 8px

					> i:first-child
						margin-right 6px
						width 16px

					> i:last-child
						display block
						position absolute
						top 0
						right 8px
						z-index 1
						padding 0 20px
						font-size 1.2em
						line-height 40px

					&:hover, &:active
						text-decoration none
						background var(--primary)
						color var(--primaryForeground)

					&:active
						background var(--primaryDarken10)

					&.signout
						$color = #e64137

						&:hover, &:active
							background $color
							color #fff

						&:active
							background darken($color, 10%)

.zoom-in-top-enter-active,
.zoom-in-top-leave-active {
	transform-origin: center -16px;
}

</style>
