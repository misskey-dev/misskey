<template>
<mk-window ref="window" is-modal width="450px" height="500px" @closed="$destroy">
	<span slot="header">%fa:list% %i18n:@title%</span>
	<mk-user-lists :class="$style.content" @navigate="navigate"/>
</mk-window>
</template>

<script lang="ts">
import Vue from 'vue';
export default Vue.extend({
	methods: {
		navigate(list) {
			this.$router.push(`/i/lists/${list.id}`);
			(this as any).close(this);
		}
	}
});
</script>

<style lang="stylus" module>
.content
	height 100%
	overflow auto
</style>
