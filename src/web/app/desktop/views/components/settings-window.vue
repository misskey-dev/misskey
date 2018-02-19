<template>
<mk-window is-modal width='700px' height='550px' @closed="$destroy">
	<span slot="header" :class="$style.header">%fa:cog%設定</span>
	<mk-settings/>
</mk-window>
</template>

<script lang="ts">
import Vue from 'vue';
export default Vue.extend({});
</script>

<style lang="stylus" module>
.header
	> [data-fa]
		margin-right 4px

</style>
