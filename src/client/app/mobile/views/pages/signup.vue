<template>
<div class="signup">
	<h1>Misskeyをはじめる</h1>
	<p>いつでも、どこからでもMisskeyを利用できます。もちろん、無料です。</p>
	<div class="form">
		<p>新規登録</p>
		<div>
			<mk-signup/>
		</div>
	</div>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
export default Vue.extend({
	mounted() {
		document.documentElement.style.background = '#293946';
	}
});
</script>

<style lang="stylus" scoped>
.signup
	padding 16px
	margin 0 auto
	max-width 500px

	h1
		margin 0
		padding 8px
		font-size 1.5em
		font-weight normal
		color #c3c6ca

		& + p
			margin 0 0 16px 0
			padding 0 8px 0 8px
			color #949fa9

	.form
		background #fff
		border solid 1px rgba(0, 0, 0, 0.2)
		border-radius 8px
		overflow hidden

		> p
			margin 0
			padding 12px 20px
			color #555
			background #f5f5f5
			border-bottom solid 1px #ddd

		> div
			padding 16px

</style>
