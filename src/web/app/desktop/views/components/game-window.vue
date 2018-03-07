<template>
<mk-window ref="window" width="500px" height="560px" @closed="$destroy">
	<span slot="header" :class="$style.header">%fa:gamepad%オセロ</span>
	<mk-othello :class="$style.content"/>
</mk-window>
</template>

<script lang="ts">
import Vue from 'vue';
export default Vue.extend({

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
