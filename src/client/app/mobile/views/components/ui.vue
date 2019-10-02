<template>
<div class="mk-ui" :class="{ deck: $store.state.device.inDeckMode }">
	<x-header v-if="!$store.state.device.inDeckMode">
		<template #func><slot name="func"></slot></template>
		<slot name="header"></slot>
		<button class="back" v-if="displayBack" @click="$router.back()"><fa icon="arrow-left"/></button>
	</x-header>
	<x-nav :is-open="isDrawerOpening"/>
	<div class="content">
		<slot></slot>
	</div>
	<mk-stream-indicator v-if="$store.getters.isSignedIn"/>
	<button class="nav button" v-if="$store.state.device.inDeckMode" @click="isDrawerOpening = !isDrawerOpening"><fa icon="bars"/><i v-if="indicate"><fa icon="circle"/></i></button>
	<button class="post button" ref="fab" v-if="displayFab" @click="fabClicked"><fa :icon="fabIcon"/></button>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import MkNotify from './notify.vue';
import XHeader from './ui.header.vue';
import XNav from './ui.nav.vue';

export default Vue.extend({
	components: {
		XHeader,
		XNav
	},

	props: {
		title: {
			type: String,
		},
		fabClickedAction: {
			type: Function
		},
		fabIcon: {
			type: String,
			default: 'pencil-alt'
		},
		displayFab: {
			type: Boolean,
			default: true
		},
		displayBack: {
			type: Boolean,
			default: false
		}
	},

	data() {
		return {
			hasGameInvitation: false,
			isDrawerOpening: false,
			connection: null
		};
	},

	computed: {
		hasUnreadNotification(): boolean {
			return this.$store.getters.isSignedIn && this.$store.state.i.hasUnreadNotification;
		},

		hasUnreadMessagingMessage(): boolean {
			return this.$store.getters.isSignedIn && this.$store.state.i.hasUnreadMessagingMessage;
		},

		indicate(): boolean {
			return this.hasUnreadNotification || this.hasUnreadMessagingMessage || this.hasGameInvitation;
		},

		fabClicked() {
			return this.fabClickedAction || this.$post;
		}
	},

	watch: {
		'$store.state.uiHeaderHeight'() {
			this.$el.style.paddingTop = this.$store.state.uiHeaderHeight + 'px';
		}
	},

	mounted() {
		this.$el.style.paddingTop = this.$store.state.uiHeaderHeight + 'px';

		if (this.$store.getters.isSignedIn) {
			this.connection = this.$root.stream.useSharedConnection('main');

			this.connection.on('notification', this.onNotification);
			this.connection.on('reversiInvited', this.onReversiInvited);
			this.connection.on('reversiNoInvites', this.onReversiNoInvites);
		}
	},

	beforeDestroy() {
		if (this.$store.getters.isSignedIn) {
			this.connection.dispose();
		}
	},

	methods: {
		onNotification(notification) {
			// TODO: ユーザーが画面を見てないと思われるとき(ブラウザやタブがアクティブじゃないなど)は送信しない
			this.$root.stream.send('readNotification', {
				id: notification.id
			});

			this.$root.new(MkNotify, {
				notification
			});
		},

		onReversiInvited() {
			this.hasGameInvitation = true;
		},

		onReversiNoInvites() {
			this.hasGameInvitation = false;
		}
	}
});
</script>

<style lang="stylus" scoped>
.mk-ui
	&:not(.deck)
		padding-top 48px

	> .button
		position fixed
		z-index 1000
		bottom 28px
		padding 0
		width 64px
		height 64px
		border-radius 100%
		box-shadow 0 3px 5px -1px rgba(0, 0, 0, 0.2), 0 6px 10px 0 rgba(0, 0, 0, 0.14), 0 1px 18px 0 rgba(0, 0, 0, 0.12)

		> *
			font-size 24px

		&.nav
			left 28px
			background var(--secondary)
			color var(--text)

			> i
				position absolute
				top 0
				left 0
				color var(--notificationIndicator)
				font-size 16px
				animation blink 1s infinite

		&.post
			right 28px
			background var(--primary)
			color var(--primaryForeground)

.back {
	position: absolute;
	left: 0;
	top: 0;
	bottom: 0;
	font-size: 18px;
}
</style>
