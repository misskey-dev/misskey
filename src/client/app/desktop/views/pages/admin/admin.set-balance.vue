<template>
<div class="mk-admin-card">
	<header>Set balance</header>
	<input v-model="username" type="text" class="ui"/>
	<input v-model="amount" type="text" class="ui"/>
	<button class="ui" @click="setBalance" :disabled="processing">Set</button>
</div>
</template>

<script lang="ts">
import Vue from "vue";
import parseAcct from "../../../../../../misc/acct/parse";

export default Vue.extend({
	data() {
		return {
			username: null,
			amount: 0,
			processing: false
		};
	},
	methods: {
		async setBalance() {
			this.processing = true;

			const user = await (this as any).os.api(
				"users/show",
				parseAcct(this.username)
			);

			await (this as any).os.api("admin/set-balance", {
				userId: user.id,
				balance: parseInt(this.amount, 10)
			});

			this.processing = false;

			(this as any).os.apis.dialog({ text: "Done!" });
		}
	}
});
</script>

<style lang="stylus" scoped>
header
	margin 10px 0

button
	margin 16px 0

</style>
