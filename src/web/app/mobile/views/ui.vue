<template>
<div class="mk-ui">
	<mk-ui-header/>
	<mk-ui-nav :is-open="isDrawerOpening"/>
	<div class="content">
		<slot></slot>
	</div>
	<mk-stream-indicator v-if="$root.$data.os.isSignedIn"/>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
export default Vue.extend({
	data() {
		return {
			isDrawerOpening: false,
			connection: null,
			connectionId: null
		};
	},
	mounted() {
		if (this.$root.$data.os.isSignedIn) {
			this.connection = this.$root.$data.os.stream.getConnection();
			this.connectionId = this.$root.$data.os.stream.use();

			this.connection.on('notification', this.onNotification);
		}
	},
	beforeDestroy() {
		if (this.$root.$data.os.isSignedIn) {
			this.connection.off('notification', this.onNotification);
			this.$root.$data.os.stream.dispose(this.connectionId);
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
