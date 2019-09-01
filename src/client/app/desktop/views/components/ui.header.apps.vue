<template>
	<a @click="toggle">
		<fa icon="th"/>
		<p>{{ $t('app') }}</p>
		<transition name="zoom-in-top">
			<div class="grid" v-if="isOpen">
				<div class="item" v-for="(item, index) in items" :disabled="item.disabled" @click="launch(item.callback)" :key="index">
					<fa :icon="item.icon" class="icon fa-fw"/>
					<div class="text">{{ item.text }}</div>
					<div class="badge" v-if="item.badge()"></div>
				</div>
			</div>
		</transition>
	</a>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';
import { faGamepad, faComments, faQuestionCircle, faCloud, faStickyNote, faDoorOpen, faCrown, faMusic, faSlidersH } from '@fortawesome/free-solid-svg-icons';
import MkGameWindow from './game-window.vue';
import MkMessagingWindow from './messaging-window.vue';
import MkDriveWindow from './drive-window.vue';
import contains from '../../../common/scripts/contains';
import { url, lang } from '../../../config';

export default Vue.extend({
	i18n: i18n('desktop/views/components/ui.header.apps.vue'),
	data() {
		return {
			hasGameInvitations: false,
			connection: null,
			isOpen: false,
			items: [
				{
					text: this.$t('talk'),
					icon: faComments,
					callback: () => this.$root.new(MkMessagingWindow),
					badge: () => this.$store.getters.isSignedIn && this.$store.state.i.hasUnreadMessagingMessage,
				},
				{
					text: this.$t('drive'),
					icon: faCloud,
					callback: () => this.$root.new(MkDriveWindow),
					badge: () => false,
				},
				{
					text: this.$t('page'),
					icon: faStickyNote,
					callback: () => this.$router.push('/i/pages'),
					badge: () => false,
				},
				{
					text: this.$t('room'),
					icon: faDoorOpen,
					callback: () => this.$router.push(`/@${this.$store.state.i.username}/room`),
					badge: () => false,
				},
				{
					text: this.$t('reversi'),
					icon: faGamepad,
					callback: () => this.$root.new(MkGameWindow),
					badge: () => this.hasGameInvitations
				},
				{
					text: this.$t('mml'),
					icon: faMusic,
					badge: () => false,
					disabled: true,
				},
				{
					text: this.$t('premium'),
					icon: faCrown,
					badge: () => false,
					disabled: true,
				},
				{
					text: this.$t('customize'),
					icon: faSlidersH,
					callback: () => this.customize(),
					badge: () => false,
				},
				{
					text: this.$t('help'),
					icon: faQuestionCircle,
					callback: () => window.open(`${url}/docs/${lang}/about`, '_blank'),
					badge: () => false,
				},
			]
		};
	},
	mounted() {
		if (this.$store.getters.isSignedIn) {
			this.connection = this.$root.stream.useSharedConnection('main');

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
		toggle() {
			this.isOpen ? this.close() : this.open();
		},
		customize() {
			location.href = '/?customize';
		},
		open() {
			this.isOpen = true;
			for (const el of Array.from(document.querySelectorAll('body *'))) {
				el.addEventListener('mousedown', this.onMousedown);
			}
		},
		onMousedown(e) {
			e.preventDefault();
			if (!contains(this.$el, e.target) && this.$el != e.target) this.close();
			return false;
		},
		close() {
			this.isOpen = false;
			for (const el of Array.from(document.querySelectorAll('body *'))) {
				el.removeEventListener('mousedown', this.onMousedown);
			}
		},
		launch(callback: () => void) {
			if (callback)
				callback();
		},
		onReversiInvited() {
			this.hasGameInvitations = true;
		},

		onReversiNoInvites() {
			this.hasGameInvitations = false;
		},
	},
});
</script>

<style lang="stylus" scoped>
.zoom-in-top-enter-active,
.zoom-in-top-leave-active {
	transform-origin: center -16px;
}

a 
	*
		pointer-events none

	&:hover
		color var(--desktopHeaderHoverFg)
		text-decoration none

	> [data-icon]:first-child
		margin-right 8px

	> [data-icon]:last-child
		margin-left 5px
		font-size 10px
		color var(--notificationIndicator)

		@media (max-width 1100px)
			margin-left -5px

	> p
		display inline
		margin 0

		@media (max-width 1100px)
			display none

	@media (max-width 700px)
		padding 0 12px

.grid
	display flex
	flex-wrap wrap
	$bgcolor = var(--face)
	position absolute
	top 56px
	left -1px
	width 288px
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
		left 12px
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
		left 12px
		border-top solid 14px transparent
		border-right solid 14px transparent
		border-bottom solid 14px $bgcolor
		border-left solid 14px transparent

	.item
		width 88px
		margin 4px
		color var(--text)
		cursor pointer
		user-select none
		border-radius 4px
		pointer-events auto

		&[disabled]
			opacity 0.5
			cursor default

			&:hover
				text-decoration none
				background inherit
				color var(--text)
	
				.badge
					background var(--text)

		.icon
			display block
			margin 8px auto
			font-size 32px

		.text
			margin 8px auto
			line-height 32px
			font-size 12px
			text-align center
			display block

		.badge
			position absolute
			right 8px
			top 8px
			width 8px
			height 8px
			border-radius 4px
			background var(--primary)
			animation: blink 2.5s linear infinite;

		&:hover
			text-decoration none
			background var(--primary)
			color var(--primaryForeground)
			
			.badge
				background var(--primaryForeground)
			
@keyframes blink{
  0%, 100% { opacity: 0; }
 30%,  70% { opacity: 1; }
}
</style>
