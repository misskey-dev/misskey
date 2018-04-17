<template>
<div class="account">
	<button class="header" :data-active="isOpen" @click="toggle">
		<span class="username">{{ os.i.username }}<template v-if="!isOpen">%fa:angle-down%</template><template v-if="isOpen">%fa:angle-up%</template></span>
		<img class="avatar" :src="`${ os.i.avatarUrl }?thumbnail&size=64`" alt="avatar"/>
	</button>
	<transition name="zoom-in-top">
		<div class="menu" v-if="isOpen">
			<ul>
				<li>
					<router-link :to="`/@${ os.i.username }`">%fa:user%%i18n:@profile%%fa:angle-right%</router-link>
				</li>
				<li @click="drive">
					<p>%fa:cloud%%i18n:@drive%%fa:angle-right%</p>
				</li>
			</ul>
			<ul>
				<li>
					<a href="/i/customize-home">%fa:wrench%%i18n:@customize%%fa:angle-right%</a>
				</li>
				<li @click="settings">
					<p>%fa:cog%%i18n:@settings%%fa:angle-right%</p>
				</li>
			</ul>
			<ul>
				<li @click="signout">
					<p>%fa:power-off%%i18n:@signout%%fa:angle-right%</p>
				</li>
			</ul>
		</div>
	</transition>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import MkSettingsWindow from './settings-window.vue';
import MkDriveWindow from './drive-window.vue';
import contains from '../../../common/scripts/contains';

export default Vue.extend({
	data() {
		return {
			isOpen: false
		};
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
			Array.from(document.querySelectorAll('body *')).forEach(el => {
				el.addEventListener('mousedown', this.onMousedown);
			});
		},
		close() {
			this.isOpen = false;
			Array.from(document.querySelectorAll('body *')).forEach(el => {
				el.removeEventListener('mousedown', this.onMousedown);
			});
		},
		onMousedown(e) {
			e.preventDefault();
			if (!contains(this.$el, e.target) && this.$el != e.target) this.close();
			return false;
		},
		drive() {
			this.close();
			(this as any).os.new(MkDriveWindow);
		},
		settings() {
			this.close();
			(this as any).os.new(MkSettingsWindow);
		},
		signout() {
			(this as any).os.signout();
		}
	}
});
</script>

<style lang="stylus" scoped>
@import '~const.styl'

.account
	> .header
		display block
		margin 0
		padding 0
		color #9eaba8
		border none
		background transparent
		cursor pointer

		*
			pointer-events none

		&:hover
		&[data-active='true']
			color darken(#9eaba8, 20%)

			> .avatar
				filter saturate(150%)

		&:active
			color darken(#9eaba8, 30%)

		> .username
			display block
			float left
			margin 0 12px 0 16px
			max-width 16em
			line-height 48px
			font-weight bold
			font-family Meiryo, sans-serif
			text-decoration none

			[data-fa]
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

	> .menu
		display block
		position absolute
		top 56px
		right -2px
		width 230px
		font-size 0.8em
		background #fff
		border-radius 4px
		box-shadow 0 1px 4px rgba(0, 0, 0, 0.25)

		&:before
			content ""
			pointer-events none
			display block
			position absolute
			top -28px
			right 12px
			border-top solid 14px transparent
			border-right solid 14px transparent
			border-bottom solid 14px rgba(0, 0, 0, 0.1)
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
			border-bottom solid 14px #fff
			border-left solid 14px transparent

		ul
			display block
			margin 10px 0
			padding 0
			list-style none

			& + ul
				padding-top 10px
				border-top solid 1px #eee

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
					color #868C8C
					cursor pointer

					*
						pointer-events none

					> [data-fa]:first-of-type
						margin-right 6px

					> [data-fa]:last-of-type
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
						background $theme-color
						color $theme-color-foreground

					&:active
						background darken($theme-color, 10%)

.zoom-in-top-enter-active,
.zoom-in-top-leave-active {
	transform-origin: center -16px;
}

</style>
