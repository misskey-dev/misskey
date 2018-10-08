<template>
<div>
	<x-room v-if="!g.isStarted" :game="g" :connection="connection"/>
	<x-game v-else :init-game="g" :connection="connection" :self-nav="selfNav" @go-index="goIndex"/>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import XGame from './reversi.game.vue';
import XRoom from './reversi.room.vue';

export default Vue.extend({
	components: {
		XGame,
		XRoom
	},
	props: {
		game: {
			type: Object,
			required: true
		},
		selfNav: {
			type: Boolean,
			require: true
		}
	},
	data() {
		return {
			connection: null,
			g: null
		};
	},
	created() {
		this.g = this.game;
		this.connection = (this as any).os.stream.connectToChannel('gamesReversiGame', {
			gameId: this.game.id
		});
		this.connection.on('started', this.onStarted);
	},
	beforeDestroy() {
		this.connection.dispose();
	},
	methods: {
		onStarted(game) {
			Object.assign(this.g, game);
			this.$forceUpdate();
		},
		goIndex() {
			this.$emit('go-index');
		}
	}
});
</script>
