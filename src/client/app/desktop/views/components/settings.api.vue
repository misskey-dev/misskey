<template>
<div class="root api">
	<ui-input :value="$store.state.i.token" readonly>
		<span>%i18n:@token%</span>
	</ui-input>
	<p>%i18n:@intro%</p>
	<div class="ui info warn"><p>%fa:exclamation-triangle%%i18n:@caution%</p></div>
	<p>%i18n:@regeneration-of-token%</p>
	<ui-button @click="regenerateToken">%i18n:@regenerate-token%</ui-button>
</div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
	methods: {
		regenerateToken() {
			(this as any).apis.input({
				title: '%i18n:@enter-password%',
				type: 'password'
			}).then(password => {
				(this as any).api('i/regenerate_token', {
					password: password
				});
			});
		}
	}
});
</script>

<style lang="stylus" scoped>
.root.api
	code
		display inline-block
		padding 4px 6px
		color #555
		background #eee
		border-radius 2px
</style>
