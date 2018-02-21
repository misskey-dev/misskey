<template>
<div class="mk-ui">
	<x-header :func="func">
		<template slot="funcIcon"><slot name="funcIcon"></slot></template>
		<slot name="header"></slot>
	</x-header>
	<x-nav :is-open="isDrawerOpening"/>
	<div class="content">
		<slot></slot>
	</div>
	<mk-stream-indicator v-if="os.isSignedIn"/>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import XHeader from './ui.header.vue';
import XNav from './ui.nav.vue';

export default Vue.extend({
	components: {
		XHeader,
		XNav
	},
	props: ['title', 'func'],
	data() {
		return {
			isDrawerOpening: false,
			connection: null,
			connectionId: null
		};
	},
	mounted() {
		if ((this as any).os.isSignedIn) {
			this.connection = (this as any).os.stream.getConnection();
			this.connectionId = (this as any).os.stream.use();

			this.connection.on('notification', this.onNotification);
		}
	},
	beforeDestroy() {
		if ((this as any).os.isSignedIn) {
			this.connection.off('notification', this.onNotification);
			(this as any).os.stream.dispose(this.connectionId);
		}
	},
	methods: {
		onNotification(notification) {
			// TODO: ユーザーが画面を見てないと思われるとき(ブラウザやタブがアクティブじゃないなど)は送信しない
			this.connection.send({
				type: 'read_notification',
				id: notification.id
			});

			document.body.appendChild(new MkNotify({
				propsData: {
					notification
				}
			}).$mount().$el);
		}
	}
});
</script>

<style lang="stylus" scoped>
.mk-ui
	padding-top 48px
</style>
