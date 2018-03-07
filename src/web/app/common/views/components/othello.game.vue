<template>
<div>
	<header>黒:{{ game.black_user.name }} 白:{{ game.white_user.name }}</header>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
export default Vue.extend({
	props: ['game'],
	data() {
		return {
			game: null,
			connection: null,
			connectionId: null
		};
	},
	mounted() {
		this.connection = (this as any).os.streams.othelloGameStream.getConnection();
		this.connectionId = (this as any).os.streams.othelloGameStream.use();

		this.connection.on('set', this.onSet);
	},
	beforeDestroy() {
		this.connection.off('set', this.onSet);
		(this as any).streams.othelloGameStream.dispose(this.connectionId);
	},
});
</script>
