<template>
<mk-window ref="window" width="500px" height="560px" :popout-url="popout" @closed="destroyDom">
	<template #header><fa icon="gamepad"/> {{ $t('game') }}</template>
	<x-reversi :class="$style.content" @gamed="g => game = g"/>
</mk-window>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';
import { url } from '../../../config';

export default Vue.extend({
	i18n: i18n('desktop/views/components/game-window.vue'),
	components: {
		XReversi: () => import('../../../common/views/components/games/reversi/reversi.vue').then(m => m.default)
	},
	data() {
		return {
			game: null
		};
	},
	computed: {
		popout(): string {
			return this.game
				? `${url}/games/reversi/${this.game.id}`
				: `${url}/games/reversi`;
		}
	}
});
</script>

<style lang="stylus" module>
.content
	height 100%
	overflow auto

</style>
