<template>
<FormBase>
	<FormGroup>
		<FormSwitch v-model:value="mention">
			{{ $ts._notification._types.mention }}
		</FormSwitch>
		<FormSwitch v-model:value="reply">
			{{ $ts._notification._types.reply }}
		</FormSwitch>
		<FormSwitch v-model:value="quote">
			{{ $ts._notification._types.quote }}
		</FormSwitch>
		<FormSwitch v-model:value="follow">
			{{ $ts._notification._types.follow }}
		</FormSwitch>
		<FormSwitch v-model:value="receiveFollowRequest">
			{{ $ts._notification._types.receiveFollowRequest }}
		</FormSwitch>
		<FormSwitch v-model:value="groupInvited">
			{{ $ts._notification._types.groupInvited }}
		</FormSwitch>
	</FormGroup>
</FormBase>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import FormButton from '@client/components/form/button.vue';
import FormSwitch from '@client/components/form/switch.vue';
import FormBase from '@client/components/form/base.vue';
import FormGroup from '@client/components/form/group.vue';
import * as os from '@client/os';
import * as symbols from '@client/symbols';
import * as symbols from '@client/symbols';

export default defineComponent({
	components: {
		FormBase,
		FormSwitch,
		FormButton,
		FormGroup,
	},

	emits: ['info'],
	
	data() {
		return {
			[symbols.PAGE_INFO]: {
				title: this.$ts.emailNotification,
				icon: 'fas fa-envelope'
			},

			mention: this.$i.emailNotificationTypes.includes('mention'),
			reply: this.$i.emailNotificationTypes.includes('reply'),
			quote: this.$i.emailNotificationTypes.includes('quote'),
			follow: this.$i.emailNotificationTypes.includes('follow'),
			receiveFollowRequest: this.$i.emailNotificationTypes.includes('receiveFollowRequest'),
			groupInvited: this.$i.emailNotificationTypes.includes('groupInvited'),
		}
	},

	created() {
		this.$watch('mention', this.save);
		this.$watch('reply', this.save);
		this.$watch('quote', this.save);
		this.$watch('follow', this.save);
		this.$watch('receiveFollowRequest', this.save);
		this.$watch('groupInvited', this.save);
	},

	mounted() {
		this.$emit('info', this[symbols.PAGE_INFO]);
	},

	methods: {
		save() {
			os.api('i/update', {
				emailNotificationTypes: [
					...[this.mention ? 'mention' : null],
					...[this.reply ? 'reply' : null],
					...[this.quote ? 'quote' : null],
					...[this.follow ? 'follow' : null],
					...[this.receiveFollowRequest ? 'receiveFollowRequest' : null],
					...[this.groupInvited ? 'groupInvited' : null],
				].filter(x => x != null)
			});
		}
	}
});
</script>
