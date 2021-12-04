<template>
<div class="_formRoot">
	<FormSection>
		<template #label>{{ $ts.emailAddress }}</template>
		<FormInput v-model="emailAddress" type="email" manual-save>
			<template #prefix><i class="fas fa-envelope"></i></template>
			<template v-if="$i.email && !$i.emailVerified" #caption>{{ $ts.verificationEmailSent }}</template>
			<template v-else-if="emailAddress === $i.email && $i.emailVerified" #caption><i class="fas fa-check" style="color: var(--success);"></i> {{ $ts.emailVerified }}</template>
		</FormInput>
	</FormSection>

	<FormSection>
		<FormSwitch :value="$i.receiveAnnouncementEmail" @update:modelValue="onChangeReceiveAnnouncementEmail">
			{{ $ts.receiveAnnouncementFromInstance }}
		</FormSwitch>
	</FormSection>

	<FormSection>
		<template #label>{{ $ts.emailNotification }}</template>
		<FormSwitch v-model="emailNotification_mention" class="_formBlock">
			{{ $ts._notification._types.mention }}
		</FormSwitch>
		<FormSwitch v-model="emailNotification_reply" class="_formBlock">
			{{ $ts._notification._types.reply }}
		</FormSwitch>
		<FormSwitch v-model="emailNotification_quote" class="_formBlock">
			{{ $ts._notification._types.quote }}
		</FormSwitch>
		<FormSwitch v-model="emailNotification_follow" class="_formBlock">
			{{ $ts._notification._types.follow }}
		</FormSwitch>
		<FormSwitch v-model="emailNotification_receiveFollowRequest" class="_formBlock">
			{{ $ts._notification._types.receiveFollowRequest }}
		</FormSwitch>
		<FormSwitch v-model="emailNotification_groupInvited" class="_formBlock">
			{{ $ts._notification._types.groupInvited }}
		</FormSwitch>
	</FormSection>
</div>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref, watch } from 'vue';
import FormButton from '@/components/debobigego/button.vue';
import FormLink from '@/components/debobigego/link.vue';
import FormSection from '@/components/form/section.vue';
import FormInput from '@/components/form/input.vue';
import FormSwitch from '@/components/form/switch.vue';
import * as os from '@/os';
import * as symbols from '@/symbols';
import { $i } from '@/account';
import { i18n } from '@/i18n';

export default defineComponent({
	components: {
		FormSection,
		FormLink,
		FormButton,
		FormSwitch,
		FormInput,
	},

	emits: ['info'],

	setup(props, context) {
		const emailAddress = ref($i.email);

		const INFO = {
			title: i18n.locale.email,
			icon: 'fas fa-envelope',
			bg: 'var(--bg)',
		};

		const onChangeReceiveAnnouncementEmail = (v) => {
			os.api('i/update', {
				receiveAnnouncementEmail: v
			});
		};

		const saveEmailAddress = () => {
			os.inputText({
				title: i18n.locale.password,
				type: 'password'
			}).then(({ canceled, result: password }) => {
				if (canceled) return;
				os.apiWithDialog('i/update-email', {
					password: password,
					email: emailAddress.value,
				});
			});
		};

		const emailNotification_mention = ref($i.emailNotificationTypes.includes('mention'));
		const emailNotification_reply = ref($i.emailNotificationTypes.includes('reply'));
		const emailNotification_quote = ref($i.emailNotificationTypes.includes('quote'));
		const emailNotification_follow = ref($i.emailNotificationTypes.includes('follow'));
		const emailNotification_receiveFollowRequest = ref($i.emailNotificationTypes.includes('receiveFollowRequest'));
		const emailNotification_groupInvited = ref($i.emailNotificationTypes.includes('groupInvited'));

		const saveNotificationSettings = () => {
			os.api('i/update', {
				emailNotificationTypes: [
					...[emailNotification_mention.value ? 'mention' : null],
					...[emailNotification_reply.value ? 'reply' : null],
					...[emailNotification_quote.value ? 'quote' : null],
					...[emailNotification_follow.value ? 'follow' : null],
					...[emailNotification_receiveFollowRequest.value ? 'receiveFollowRequest' : null],
					...[emailNotification_groupInvited.value ? 'groupInvited' : null],
				].filter(x => x != null)
			});
		};

		watch([emailNotification_mention, emailNotification_reply, emailNotification_quote, emailNotification_follow, emailNotification_receiveFollowRequest, emailNotification_groupInvited], () => {
			saveNotificationSettings();
		});

		onMounted(() => {
			context.emit('info', INFO);

			watch(emailAddress, () => {
				saveEmailAddress();
			});
		});

		return {
			[symbols.PAGE_INFO]: INFO,
			emailAddress,
			onChangeReceiveAnnouncementEmail,
			emailNotification_mention, emailNotification_reply, emailNotification_quote, emailNotification_follow, emailNotification_receiveFollowRequest, emailNotification_groupInvited,
		};
	},
});
</script>
