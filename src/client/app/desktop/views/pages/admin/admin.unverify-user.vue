<template>
<div class="mk-admin-card">
	<header>%i18n:@unverify-user%</header>
	<input v-model="username" type="text" class="ui"/>
	<button class="ui" @click="unverifyUser" :disabled="unverifying">%i18n:@unverify%</button>
</div>
</template>

<script lang="ts">
import Vue from "vue";
import parseAcct from "../../../../../../misc/acct/parse";

export default Vue.extend({
	data() {
		return {
			username: null,
			unverifying: false
		};
	},
	methods: {
		async unverifyUser() {
			this.unverifying = true;

			const user = await (this as any).os.api(
				"users/show",
				parseAcct(this.username)
			);

			await (this as any).os.api("admin/unverify-user", {
				userId: user.id
			});

			this.unverifying = false;

			(this as any).os.apis.dialog({ text: "%i18n:@unverified%" });
		}
	}
});
</script>

<style lang="stylus" scoped>
@import '~const.styl'

header
	margin 10px 0


button
	margin 16px 0

</style>
