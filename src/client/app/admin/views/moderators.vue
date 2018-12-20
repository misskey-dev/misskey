<template>
<div class="jnhmugbb">
	<ui-card>
		<div slot="title"><fa icon="plus"/> {{ $t('add-moderator.title') }}</div>
		<section class="fit-top">
			<ui-input v-model="username" type="text">
				<span slot="prefix">@</span>
			</ui-input>
			<ui-button @click="add" :disabled="adding">{{ $t('add-moderator.add') }}</ui-button>
		</section>
	</ui-card>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../i18n';
import parseAcct from "../../../../misc/acct/parse";

export default Vue.extend({
	i18n: i18n('admin/views/moderators.vue'),

	data() {
		return {
			username: '',
			adding: false
		};
	},

	methods: {
		async add() {
			this.adding = true;

			const process = async () => {
				const user = await this.$root.api('users/show', parseAcct(this.username));
				await this.$root.api('admin/moderators/add', { userId: user.id });
				this.$root.dialog({
					type: 'success',
					text: this.$t('add-moderator.added')
				});
			};

			await process().catch(e => {
				this.$root.dialog({
					type: 'error',
					text: e.toString()
				});
			});

			this.adding = false;
		},
	}
});
</script>

<style lang="stylus" scoped>
.jnhmugbb
	@media (min-width 500px)
		padding 16px

</style>
