<template>
<FormBase>
	<FormLink @click="configure">{{ $ts.notificationSetting }}</FormLink>
	<FormGroup>
		<FormButton @click="readAllNotifications">{{ $ts.markAsReadAllNotifications }}</FormButton>
		<FormButton @click="readAllUnreadNotes">{{ $ts.markAsReadAllUnreadNotes }}</FormButton>
		<FormButton @click="readAllMessagingMessages">{{ $ts.markAsReadAllTalkMessages }}</FormButton>
	</FormGroup>
</FormBase>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import FormButton from '@client/components/debobigego/button.vue';
import FormLink from '@client/components/debobigego/link.vue';
import FormBase from '@client/components/debobigego/base.vue';
import FormGroup from '@client/components/debobigego/group.vue';
import { notificationTypes } from '@/types';
import * as os from '@client/os';
import * as symbols from '@client/symbols';

export default defineComponent({
	components: {
		FormBase,
		FormLink,
		FormButton,
		FormGroup,
	},

	emits: ['info'],
	
	data() {
		return {
			[symbols.PAGE_INFO]: {
				title: this.$ts.notifications,
				icon: 'fas fa-bell',
				bg: 'var(--bg)',
			},
		}
	},

	mounted() {
		this.$emit('info', this[symbols.PAGE_INFO]);
	},

	methods: {
		readAllUnreadNotes() {
			os.api('i/read-all-unread-notes');
		},

		readAllMessagingMessages() {
			os.api('i/read-all-messaging-messages');
		},

		readAllNotifications() {
			os.api('notifications/mark-all-as-read');
		},

		configure() {
			const includingTypes = notificationTypes.filter(x => !this.$i.mutingNotificationTypes.includes(x));
			os.popup(import('@client/components/notification-setting-window.vue'), {
				includingTypes,
				showGlobalToggle: false,
			}, {
				done: async (res) => {
					const { includingTypes: value } = res;
					await os.apiWithDialog('i/update', {
						mutingNotificationTypes: notificationTypes.filter(x => !value.includes(x)),
					}).then(i => {
						this.$i.mutingNotificationTypes = i.mutingNotificationTypes;
					});
				}
			}, 'closed');
		},
	}
});
</script>
