<template>
<div class="ui-card">
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

.ui-card
	margin 16px 0
	padding 32px
	background #fff
	//box-shadow 0 3px 1px -2px rgba(#000, 0.2), 0 2px 2px 0 rgba(#000, 0.14), 0 1px 5px 0 rgba(#000, 0.12)

	> header
		font-weight bold
		font-size 28px
		color #444

</style>
