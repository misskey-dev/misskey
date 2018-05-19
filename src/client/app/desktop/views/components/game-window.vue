<template>
<mk-window ref="window" width="500px" height="560px" :popout-url="popout" @closed="$destroy">
	<span slot="header" :class="$style.header">%fa:gamepad%%i18n:@game%</span>
	<mk-othello :class="$style.content" @gamed="g => game = g"/>
</mk-window>
</template>

<script lang="ts">
import Vue from 'vue';
import { url } from '../../../config';

export default Vue.extend({
	data() {
		return {
			game: null
		};
	},
	computed: {
		popout(): string {
			return this.game
				? `${url}/othello/${this.game.id}`
				: `${url}/othello`;
		}
	}
});
</script>

<style lang="stylus" module>
.header
	> [data-fa]
		margin-right 4px

.content
	height 100%
	overflow auto

</style>
