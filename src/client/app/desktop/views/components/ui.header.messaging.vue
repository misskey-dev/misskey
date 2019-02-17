<template>
<div class="toltmoik">
	<button @click="open()" :title="$t('@.messaging')">
		<i class="bell"><fa :icon="faComments"/></i>
		<i class="circle" v-if="hasUnreadMessagingMessage"><fa icon="circle"/></i>
	</button>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';
import MkMessagingWindow from './messaging-window.vue';
import { faComments } from '@fortawesome/free-regular-svg-icons';

export default Vue.extend({
	i18n: i18n(),

	data() {
		return {
			faComments
		};
	},

	computed: {
		hasUnreadMessagingMessage(): boolean {
			return this.$store.getters.isSignedIn && this.$store.state.i.hasUnreadMessagingMessage;
		}
	},

	methods: {
		open() {
			this.$root.new(MkMessagingWindow);
		},
	}
});
</script>

<style lang="stylus" scoped>
.toltmoik
	> button
		display block
		margin 0
		padding 0
		width 32px
		color var(--desktopHeaderFg)
		border none
		background transparent
		cursor pointer

		*
			pointer-events none

		&:hover
		&[data-active='true']
			color var(--desktopHeaderHoverFg)

		> i.bell
			font-size 1.2em
			line-height 48px

		> i.circle
			margin-left -5px
			vertical-align super
			font-size 10px
			color var(--notificationIndicator)

</style>
