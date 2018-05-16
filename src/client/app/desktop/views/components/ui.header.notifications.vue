<template>
<div class="notifications">
	<button :data-active="isOpen" @click="toggle" title="%i18n:@title%">
		%fa:R bell%<template v-if="hasUnreadNotifications">%fa:circle%</template>
	</button>
	<div class="pop" v-if="isOpen">
		<mk-notifications/>
	</div>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import contains from '../../../common/scripts/contains';

export default Vue.extend({
	data() {
		return {
			isOpen: false,
			hasUnreadNotifications: false,
			connection: null,
			connectionId: null
		};
	},
	mounted() {
		if ((this as any).os.isSignedIn) {
			this.connection = (this as any).os.stream.getConnection();
			this.connectionId = (this as any).os.stream.use();

			this.connection.on('read_all_notifications', this.onReadAllNotifications);
			this.connection.on('unread_notification', this.onUnreadNotification);

			// Fetch count of unread notifications
			(this as any).api('notifications/get_unread_count').then(res => {
				if (res.count > 0) {
					this.hasUnreadNotifications = true;
				}
			});
		}
	},
	beforeDestroy() {
		if ((this as any).os.isSignedIn) {
			this.connection.off('read_all_notifications', this.onReadAllNotifications);
			this.connection.off('unread_notification', this.onUnreadNotification);
			(this as any).os.stream.dispose(this.connectionId);
		}
	},
	methods: {
		onReadAllNotifications() {
			this.hasUnreadNotifications = false;
		},

		onUnreadNotification() {
			this.hasUnreadNotifications = true;
		},

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
		}
	}
});
</script>

<style lang="stylus" scoped>
@import '~const.styl'

root(isDark)

	> button
		display block
		margin 0
		padding 0
		width 32px
		color #9eaba8
		border none
		background transparent
		cursor pointer

		*
			pointer-events none

		&:hover
		&[data-active='true']
			color isDark ? #fff : darken(#9eaba8, 20%)

		&:active
			color isDark ? #fff : darken(#9eaba8, 30%)

		> [data-fa].bell
			font-size 1.2em
			line-height 48px

		> [data-fa].circle
			margin-left -5px
			vertical-align super
			font-size 10px
			color $theme-color

	> .pop
		$bgcolor = isDark ? #282c37 : #fff
		display block
		position absolute
		top 56px
		right -72px
		width 300px
		background $bgcolor
		border-radius 4px
		box-shadow 0 1px 4px rgba(#000, 0.25)

		&:before
			content ""
			pointer-events none
			display block
			position absolute
			top -28px
			right 74px
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
			right 74px
			border-top solid 14px transparent
			border-right solid 14px transparent
			border-bottom solid 14px $bgcolor
			border-left solid 14px transparent

		> .mk-notifications
			max-height 350px
			font-size 1rem
			overflow auto

.notifications[data-darkmode]
	root(true)

.notifications:not([data-darkmode])
	root(false)

</style>
