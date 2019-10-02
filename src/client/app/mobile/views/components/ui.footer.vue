<template>
<div class="footer" :class="{ shadow: $store.state.device.useShadow }">
	<div class="main" ref="main">
		<div class="backdrop"></div>
		<div class="content">
			<div class="tab">
				<router-link :class="{ active: $route.name == 'index' }" to="/">
					<fa :icon="$store.getters.isSignedIn ? 'home' : 'arrow-left'"/>
				</router-link>
				<router-link :class="{ active: $route.name == 'explore' }" to="/explore">
					<fa icon="hashtag"/>
				</router-link>
				<router-link :class="{ active: $route.name == 'notifications' }" to="/i/notifications">
					<fa :icon="['far', 'bell']"/>
					<i v-if="$parent.hasUnreadNotification" class="circle"><fa icon="circle"/></i>
				</router-link>
				<router-link :class="{ active: $route.name == 'messaging' }" to="/i/messaging">
					<fa :icon="['far', 'comments']"/>
					<i v-if="$parent.hasUnreadMessagingMessage" class="circle"><fa icon="circle"/></i>
				</router-link>
			</div>
		</div>
	</div>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';
import { env } from '../../../config';

export default Vue.extend({
	i18n: i18n(),
	props: ['func'],

	data() {
		return {
			env: env
		};
	},

	computed: {
		hasUnreadNotification(): boolean {
			return this.$store.getters.isSignedIn && this.$store.state.i.hasUnreadNotification;
		},

		hasUnreadMessagingMessage(): boolean {
			return this.$store.getters.isSignedIn && this.$store.state.i.hasUnreadMessagingMessage;
		}
	}

	mounted() {
	},
});
</script>

<style lang="stylus" scoped>
.footer
	$height = 48px

	position fixed
	bottom 0
	left -8px
	z-index 1024
	width calc(100% + 16px)
	padding 0 8px

	&.shadow
		box-shadow 0 0 8px rgba(0, 0, 0, 0.25)

	&, *
		user-select none

	> .indicator
		height 3px
		background var(--primary)

	> .warn
		display block
		margin 0
		padding 4px
		text-align center
		font-size 12px
		background #f00
		color #fff

	> .main
		color var(--mobileHeaderFg)

		> .backdrop
			position absolute
			bottom 0
			z-index 1000
			width 100%
			height $height
			-webkit-backdrop-filter blur(12px)
			backdrop-filter blur(12px)
			background-color var(--mobileHeaderBg)

		> .content
			z-index 1001

			.tab
				display grid
				height $height
				grid-template-columns 1fr 1fr 1fr 1fr
				padding 0 16px

				> a
					display flex
					align-items center
					justify-content center
					font-size 16px
					color var(--faceText)

					&.active
						border-top 3px solid var(--primary)
						background var(--secondary)


				i.circle
					position absolute
					top 8px
					right 24px
					pointer-events none
					font-size 8px
					color var(--notificationIndicator)



</style>
