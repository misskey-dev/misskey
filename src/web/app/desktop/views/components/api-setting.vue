<template>
<div class="mk-api-setting">
	<p>Token: <code>{{ $root.$data.os.i.token }}</code></p>
	<p>%i18n:desktop.tags.mk-api-info.intro%</p>
	<div class="ui info warn"><p>%fa:exclamation-triangle%%i18n:desktop.tags.mk-api-info.caution%</p></div>
	<p>%i18n:desktop.tags.mk-api-info.regeneration-of-token%</p>
	<button class="ui" @click="regenerateToken">%i18n:desktop.tags.mk-api-info.regenerate-token%</button>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import passwordDialog from '../../scripts/password-dialog';

export default Vue.extend({
	methods: {
		regenerateToken() {
			passwordDialog('%i18n:desktop.tags.mk-api-info.enter-password%', password => {
				this.$root.$data.os.api('i/regenerate_token', {
					password: password
				});
			});
		}
	}
});
</script>

<style lang="stylus" scoped>
.mk-api-setting
	color #4a535a

	code
		display inline-block
		padding 4px 6px
		color #555
		background #eee
		border-radius 2px
</style>
