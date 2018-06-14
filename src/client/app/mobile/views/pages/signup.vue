<template>
<div class="signup">
	<h1>Misskeyをはじめる</h1>
	<mk-signup/>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
export default Vue.extend({});
</script>

<style lang="stylus" scoped>
.signup
	padding 32px
	margin 0 auto
	max-width 500px

	h1
		margin 0
		padding 8px 0 0 0
		font-size 1.5em
		font-weight bold
		color #444

</style>
