<template>
<div class="mk-ui">
	<x-header>
		<template #func><slot name="func"></slot></template>
		<slot name="header"></slot>
	</x-header>
	<x-nav :is-open="isDrawerOpening"/>
	<div class="content">
		<slot></slot>
	</div>
	<mk-stream-indicator v-if="$store.getters.isSignedIn"/>
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

	props: ['title'],

	data() {
		return {
			isDrawerOpening: false,
			connection: null
		};
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
		}
	}
});
</script>

<style lang="stylus" scoped>
.mk-ui
	display flex
	flex 1
	flex-direction column
	padding-top 48px

	> .content
		display flex
		flex 1
		flex-direction column
</style>
