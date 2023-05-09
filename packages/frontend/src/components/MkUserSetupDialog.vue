<template>
<MkModalWindow
	ref="dialog"
	:width="500"
	:height="550"
	data-cy-user-setup
	@close="close(true)"
	@closed="emit('closed')"
>
	<template #header>{{ i18n.ts.initialAccountSetting }}</template>

	<div style="overflow-x: clip;">
		<Transition
			mode="out-in"
			:enter-active-class="$style.transition_x_enterActive"
			:leave-active-class="$style.transition_x_leaveActive"
			:enter-from-class="$style.transition_x_enterFrom"
			:leave-to-class="$style.transition_x_leaveTo"
		>
			<template v-if="page === 0">
				<div :class="$style.centerPage">
					<MkSpacer :margin-min="20" :margin-max="28">
						<div class="_gaps" style="text-align: center;">
							<i class="ti ti-confetti" style="display: block; margin: auto; font-size: 3em; color: var(--accent);"></i>
							<div style="font-size: 120%;">{{ i18n.ts._initialAccountSetting.accountCreated }}</div>
							<div>{{ i18n.ts._initialAccountSetting.letsStartAccountSetup }}</div>
							<MkButton primary rounded gradate style="margin: 16px auto 0 auto;" data-cy-user-setup-continue @click="page++">{{ i18n.ts._initialAccountSetting.profileSetting }} <i class="ti ti-arrow-right"></i></MkButton>
						</div>
					</MkSpacer>
				</div>
			</template>
			<template v-else-if="page === 1">
				<div style="height: 100cqh; overflow: auto;">
					<MkSpacer :margin-min="20" :margin-max="28">
						<XProfile/>
						<MkButton primary rounded gradate style="margin: 16px auto 0 auto;" data-cy-user-setup-continue @click="page++">{{ i18n.ts.continue }} <i class="ti ti-arrow-right"></i></MkButton>
					</MkSpacer>
				</div>
			</template>
			<template v-else-if="page === 2">
				<div style="height: 100cqh; overflow: auto;">
					<MkSpacer :margin-min="20" :margin-max="28">
						<XFollow/>
						<MkButton primary rounded gradate style="margin: 16px auto 0 auto;" data-cy-user-setup-continue @click="page++">{{ i18n.ts.continue }} <i class="ti ti-arrow-right"></i></MkButton>
					</MkSpacer>
				</div>
			</template>
			<template v-else-if="page === 3">
				<div :class="$style.centerPage">
					<MkSpacer :margin-min="20" :margin-max="28">
						<div class="_gaps" style="text-align: center;">
							<i class="ti ti-bell-ringing-2" style="display: block; margin: auto; font-size: 3em; color: var(--accent);"></i>
							<div style="font-size: 120%;">{{ i18n.ts.pushNotification }}</div>
							<div style="padding: 0 16px;">{{ i18n.t('_initialAccountSetting.pushNotificationDescription', { name: instance.name ?? host }) }}</div>
							<MkPushNotificationAllowButton primary show-only-to-register style="margin: 0 auto;"/>
							<MkButton primary rounded gradate style="margin: 16px auto 0 auto;" data-cy-user-setup-continue @click="page++">{{ i18n.ts.continue }} <i class="ti ti-arrow-right"></i></MkButton>
						</div>
					</MkSpacer>
				</div>
			</template>
			<template v-else-if="page === 4">
				<div :class="$style.centerPage">
					<MkSpacer :margin-min="20" :margin-max="28">
						<div class="_gaps" style="text-align: center;">
							<i class="ti ti-check" style="display: block; margin: auto; font-size: 3em; color: var(--accent);"></i>
							<div style="font-size: 120%;">{{ i18n.ts._initialAccountSetting.initialAccountSettingCompleted }}</div>
							<I18n :src="i18n.ts._initialAccountSetting.ifYouNeedLearnMore" tag="div" style="padding: 0 16px;">
								<template #name>{{ instance.name ?? host }}</template>
								<template #link>
									<a href="https://misskey-hub.net/help.html" target="_blank" class="_link">{{ i18n.ts.help }}</a>
								</template>
							</I18n>
							<div>{{ i18n.t('_initialAccountSetting.haveFun', { name: instance.name ?? host }) }}</div>
							<MkButton primary rounded gradate style="margin: 16px auto 0 auto;" data-cy-user-setup-continue @click="close(false)">{{ i18n.ts.close }}</MkButton>
						</div>
					</MkSpacer>
				</div>
			</template>
		</Transition>
	</div>
</MkModalWindow>
</template>

<script lang="ts" setup>
import { ref, shallowRef, watch } from 'vue';
import MkModalWindow from '@/components/MkModalWindow.vue';
import MkButton from '@/components/MkButton.vue';
import XProfile from '@/components/MkUserSetupDialog.Profile.vue';
import XFollow from '@/components/MkUserSetupDialog.Follow.vue';
import { i18n } from '@/i18n';
import { instance } from '@/instance';
import { host } from '@/config';
import MkPushNotificationAllowButton from '@/components/MkPushNotificationAllowButton.vue';
import { defaultStore } from '@/store';
import * as os from '@/os';

const emit = defineEmits<{
	(ev: 'closed'): void;
}>();

const dialog = shallowRef<InstanceType<typeof MkModalWindow>>();

const page = ref(defaultStore.state.accountSetupWizard);

watch(page, () => {
	defaultStore.set('accountSetupWizard', page.value);
});

async function close(skip: boolean) {
	if (skip) {
		const { canceled } = await os.confirm({
			type: 'warning',
			text: i18n.ts._initialAccountSetting.skipAreYouSure,
		});
		if (canceled) return;
	}

	dialog.value.close();
	defaultStore.set('accountSetupWizard', -1);
}
</script>

<style lang="scss" module>
.transition_x_enterActive,
.transition_x_leaveActive {
	transition: opacity 0.3s cubic-bezier(0,0,.35,1), transform 0.3s cubic-bezier(0,0,.35,1);
}
.transition_x_enterFrom {
	opacity: 0;
	transform: translateX(50px);
}
.transition_x_leaveTo {
	opacity: 0;
	transform: translateX(-50px);
}

.centerPage {
	display: flex;
	justify-content: center;
	align-items: center;
	height: 100cqh;
	padding-bottom: 30px;
	box-sizing: border-box;
}
</style>
