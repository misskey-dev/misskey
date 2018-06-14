<template>
<div class="ui-group">
	<header>
		<slot name="title"></slot>
	</header>

	<slot></slot>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
export default Vue.extend({});
</script>

<style lang="stylus" scoped>
@import '~const.styl'

.ui-group
	> header
		font-weight bold

</style>
