<template>
<div>
	<x-room v-if="!g.is_started" :game="g" :connection="connection"/>
	<x-game v-else :game="g" :connection="connection"/>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import XGame from './othello.game.vue';
import XRoom from './othello.room.vue';
import { OthelloGameStream } from '../../scripts/streaming/othello-game';

export default Vue.extend({
	components: {
		XGame,
		XRoom
	},
	props: ['game'],
	data() {
		return {
			connection: null,
			g: null
		};
	},
	created() {
		this.g = this.game;
		this.connection = new OthelloGameStream((this as any).os.i, this.game);
		this.connection.on('started', this.onStarted);
	},
	beforeDestroy() {
		this.connection.off('started', this.onStarted);
		this.connection.close();
	},
	methods: {
		onStarted(game) {
			Object.assign(this.g, game);
			this.$forceUpdate();
		}
	}
});
</script>
