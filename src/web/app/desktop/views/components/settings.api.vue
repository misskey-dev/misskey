<template>
<div class="root api">
	<p>Token: <code>{{ os.i.token }}</code></p>
	<p>%i18n:desktop.tags.mk-api-info.intro%</p>
	<div class="ui info warn"><p>%fa:exclamation-triangle%%i18n:desktop.tags.mk-api-info.caution%</p></div>
	<p>%i18n:desktop.tags.mk-api-info.regeneration-of-token%</p>
	<button class="ui" @click="regenerateToken">%i18n:desktop.tags.mk-api-info.regenerate-token%</button>
</div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
	methods: {
		regenerateToken() {
			(this as any).apis.input({
				title: '%i18n:desktop.tags.mk-api-info.enter-password%',
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
	color #4a535a

	code
		display inline-block
		padding 4px 6px
		color #555
		background #eee
		border-radius 2px
</style>
