<template>
<FormBase>
	<FormLink @click="configure">{{ $t('notificationSetting') }}</FormLink>
	<FormGroup>
		<FormButton @click="readAllNotifications">{{ $t('markAsReadAllNotifications') }}</FormButton>
		<FormButton @click="readAllUnreadNotes">{{ $t('markAsReadAllUnreadNotes') }}</FormButton>
		<FormButton @click="readAllMessagingMessages">{{ $t('markAsReadAllTalkMessages') }}</FormButton>
	</FormGroup>
</FormBase>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faCog } from '@fortawesome/free-solid-svg-icons';
import { faBell } from '@fortawesome/free-regular-svg-icons';
import FormButton from '@/components/form/button.vue';
import FormLink from '@/components/form/link.vue';
import FormBase from '@/components/form/base.vue';
import FormGroup from '@/components/form/group.vue';
import { notificationTypes } from '../../../types';
import * as os from '@/os';

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
			INFO: {
				title: this.$t('notifications'),
				icon: faBell
			},
			faCog
		}
	},

	mounted() {
		this.$emit('info', this.INFO);
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
			const includingTypes = notificationTypes.filter(x => !this.$store.state.i.mutingNotificationTypes.includes(x));
			os.popup(import('@/components/notification-setting-window.vue'), {
				includingTypes,
				showGlobalToggle: false,
			}, {
				done: async (res) => {
					const { includingTypes: value } = res;
					await os.apiWithDialog('i/update', {
						mutingNotificationTypes: notificationTypes.filter(x => !value.includes(x)),
					}).then(i => {
						this.$store.state.i.mutingNotificationTypes = i.mutingNotificationTypes;
					});
				}
			}, 'closed');
		},
	}
});
</script>
