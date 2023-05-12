<template>
<MkModalWindow
	ref="dialog"
	:width="500"
	:height="550"
	data-cy-user-setup
	@close="close(true)"
	@closed="emit('closed')"
>
	<template v-if="page === 1" #header>{{ i18n.ts._initialAccountSetting.profileSetting }}</template>
	<template v-else-if="page === 2" #header>{{ i18n.ts._initialAccountSetting.privacySetting }}</template>
	<template v-else-if="page === 3" #header>{{ i18n.ts.follow }}</template>
	<template v-else-if="page === 4" #header>{{ i18n.ts.pushNotification }}</template>
	<template v-else-if="page === 5" #header>{{ i18n.ts.done }}</template>
	<template v-else #header>{{ i18n.ts.initialAccountSetting }}</template>

	<div style="overflow-x: clip;">
		<div :class="$style.progressBar">
			<div :class="$style.progressBarValue" :style="{ width: `${(page / 5) * 100}%` }"></div>
		</div>
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
						<XPrivacy/>
						<MkButton primary rounded gradate style="margin: 16px auto 0 auto;" data-cy-user-setup-continue @click="page++">{{ i18n.ts.continue }} <i class="ti ti-arrow-right"></i></MkButton>
					</MkSpacer>
				</div>
			</template>
			<template v-else-if="page === 3">
				<div style="height: 100cqh; overflow: auto;">
					<MkSpacer :margin-min="20" :margin-max="28">
						<XFollow/>
					</MkSpacer>
					<div :class="$style.pageFooter">
						<MkButton primary rounded gradate style="margin: 0 auto;" data-cy-user-setup-continue @click="page++">{{ i18n.ts.continue }} <i class="ti ti-arrow-right"></i></MkButton>
					</div>
				</div>
			</template>
			<template v-else-if="page === 4">
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
			<template v-else-if="page === 5">
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
import XPrivacy from '@/components/MkUserSetupDialog.Privacy.vue';
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

.progressBar {
	position: absolute;
	top: 0;
	left: 0;
	z-index: 10;
	width: 100%;
	height: 4px;
}

.progressBarValue {
	height: 100%;
	background: linear-gradient(90deg, var(--buttonGradateA), var(--buttonGradateB));
	transition: all 0.5s cubic-bezier(0,.5,.5,1);
}

.centerPage {
	display: flex;
	justify-content: center;
	align-items: center;
	height: 100cqh;
	padding-bottom: 30px;
	box-sizing: border-box;
}

.pageFooter {
	position: sticky;
	bottom: 0;
	left: 0;
	padding: 12px;
	border-top: solid 0.5px var(--divider);
	-webkit-backdrop-filter: var(--blur, blur(15px));
	backdrop-filter: var(--blur, blur(15px));
}
</style>
