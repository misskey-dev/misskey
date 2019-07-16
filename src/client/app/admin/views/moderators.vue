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

	<ui-card>
		<template #title>{{ $t('logs.title') }}</template>
		<section class="fit-top">
			<sequential-entrance animation="entranceFromTop" delay="25">
				<div v-for="log in logs" :key="log.id" class="">
					<ui-horizon-group inputs>
						<ui-input :value="log.user | acct" type="text" readonly>
							<span>{{ $t('logs.moderator') }}</span>
						</ui-input>
						<ui-input :value="log.type" type="text" readonly>
							<span>{{ $t('logs.type') }}</span>
						</ui-input>
						<ui-input :value="log.createdAt | date" type="text" readonly>
							<span>{{ $t('logs.at') }}</span>
						</ui-input>
					</ui-horizon-group>
					<ui-textarea :value="JSON.stringify(log.info, null, 4)" readonly>
						<span>{{ $t('logs.info') }}</span>
					</ui-textarea>
				</div>
			</sequential-entrance>
			<ui-button v-if="existMoreLogs" @click="fetchLogs">{{ $t('@.load-more') }}</ui-button>
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
			changing: false,
			logs: [],
			untilLogId: null,
			existMoreLogs: false
		};
	},

	created() {
		this.fetchLogs();
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

		fetchLogs() {
			this.$root.api('admin/show-moderation-logs', {
				untilId: this.untilId,
				limit: 10 + 1
			}).then(logs => {
				if (logs.length == 10 + 1) {
					logs.pop();
					this.existMoreLogs = true;
				} else {
					this.existMoreLogs = false;
				}
				this.logs = this.logs.concat(logs);
				this.untilLogId = this.logs[this.logs.length - 1].id;
			});
		},
	}
});
</script>
