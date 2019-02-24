<template>
<div>
	<ui-card>
		<template #title><fa icon="plus"/> {{ $t('add-moderator.title') }}</template>
		<section class="fit-top">
			<ui-input v-model="username" type="text">
				<template #prefix>@</template>
			</ui-input>
			<ui-horizon-group>
				<ui-button @click="add" :disabled="changing">{{ $t('add-moderator.add') }}</ui-button>
				<ui-button @click="remove" :disabled="changing">{{ $t('add-moderator.remove') }}</ui-button>
			</ui-horizon-group>
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
			changing: false
		};
	},

	methods: {
		async add() {
			this.changing = true;

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

			this.changing = false;
		},

		async remove() {
			this.changing = true;

			const process = async () => {
				const user = await this.$root.api('users/show', parseAcct(this.username));
				await this.$root.api('admin/moderators/remove', { userId: user.id });
				this.$root.dialog({
					type: 'success',
					text: this.$t('add-moderator.removed')
				});
			};

			await process().catch(e => {
				this.$root.dialog({
					type: 'error',
					text: e.toString()
				});
			});

			this.changing = false;
		},
	}
});
</script>
