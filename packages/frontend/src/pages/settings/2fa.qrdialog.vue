<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkModalWindow
	ref="dialog"
	:width="500"
	:height="550"
	@close="cancel"
	@closed="emit('closed')"
>
	<template #header>{{ i18n.ts.setupOf2fa }}</template>

	<div style="overflow-x: clip;">
		<Transition
			mode="out-in"
			:enterActiveClass="$style.transition_x_enterActive"
			:leaveActiveClass="$style.transition_x_leaveActive"
			:enterFromClass="$style.transition_x_enterFrom"
			:leaveToClass="$style.transition_x_leaveTo"
		>
			<template v-if="page === 0">
				<div style="height: 100cqh; overflow: auto; text-align: center;">
					<MkSpacer :marginMin="20" :marginMax="28">
						<div class="_gaps">
							<I18n :src="i18n.ts._2fa.step1" tag="div">
								<template #a>
									<a href="https://authy.com/" rel="noopener" target="_blank" class="_link">Authy</a>
								</template>
								<template #b>
									<a href="https://support.google.com/accounts/answer/1066447" rel="noopener" target="_blank" class="_link">Google Authenticator</a>
								</template>
							</I18n>
							<div>{{ i18n.ts._2fa.step2 }}<br>{{ i18n.ts._2fa.step2Click }}</div>
							<a :href="twoFactorData.url"><img :class="$style.qr" :src="twoFactorData.qr"></a>
							<MkKeyValue :copy="twoFactorData.url">
								<template #key>{{ i18n.ts._2fa.step2Uri }}</template>
								<template #value>{{ twoFactorData.url }}</template>
							</MkKeyValue>
						</div>
						<div class="_buttonsCenter" style="margin-top: 16px;">
							<MkButton rounded @click="cancel">{{ i18n.ts.cancel }}</MkButton>
							<MkButton primary rounded gradate @click="page++">{{ i18n.ts.continue }} <i class="ti ti-arrow-right"></i></MkButton>
						</div>
					</MkSpacer>
				</div>
			</template>
			<template v-else-if="page === 1">
				<div style="height: 100cqh; overflow: auto;">
					<MkSpacer :marginMin="20" :marginMax="28">
						<div class="_gaps">
							<div>{{ i18n.ts._2fa.step3Title }}</div>
							<MkInput v-model="token" autocomplete="one-time-code"></MkInput>
							<div>{{ i18n.ts._2fa.step3 }}</div>
						</div>
						<div class="_buttonsCenter" style="margin-top: 16px;">
							<MkButton rounded @click="page--"><i class="ti ti-arrow-left"></i> {{ i18n.ts.goBack }}</MkButton>
							<MkButton primary rounded gradate @click="tokenDone">{{ i18n.ts.continue }} <i class="ti ti-arrow-right"></i></MkButton>
						</div>
					</MkSpacer>
				</div>
			</template>
			<template v-else-if="page === 2">
				<div style="height: 100cqh; overflow: auto;">
					<MkSpacer :marginMin="20" :marginMax="28">
						<div class="_gaps">
							<div style="text-align: center;">{{ i18n.ts._2fa.setupCompleted }}🎉</div>
							<div style="text-align: center;">{{ i18n.ts._2fa.step4 }}</div>
							<div style="text-align: center; font-weight: bold;">{{ i18n.ts._2fa.checkBackupCodesBeforeCloseThisWizard }}</div>

							<MkFolder :defaultOpen="true">
								<template #icon><i class="ti ti-key"></i></template>
								<template #label>{{ i18n.ts._2fa.backupCodes }}</template>

								<div class="_gaps">
									<MkInfo warn>{{ i18n.ts._2fa.backupCodesDescription }}</MkInfo>

									<div v-for="(code, i) in backupCodes" :key="code" class="_gaps_s">
										<MkKeyValue :copy="code">
											<template #key>#{{ i + 1 }}</template>
											<template #value><code class="_monospace">{{ code }}</code></template>
										</MkKeyValue>
									</div>

									<MkButton primary rounded gradate @click="downloadBackupCodes"><i class="ti ti-download"></i> {{ i18n.ts.download }}</MkButton>
								</div>
							</MkFolder>
						</div>
						<div class="_buttonsCenter" style="margin-top: 16px;">
							<MkButton primary rounded gradate @click="allDone">{{ i18n.ts.done }}</MkButton>
						</div>
					</MkSpacer>
				</div>
			</template>
		</Transition>
	</div>
</MkModalWindow>
</template>

<script lang="ts" setup>
import { shallowRef, ref } from 'vue';
import MkButton from '@/components/MkButton.vue';
import MkModalWindow from '@/components/MkModalWindow.vue';
import MkKeyValue from '@/components/MkKeyValue.vue';
import MkInput from '@/components/MkInput.vue';
import { i18n } from '@/i18n.js';
import * as os from '@/os.js';
import MkFolder from '@/components/MkFolder.vue';
import MkInfo from '@/components/MkInfo.vue';
import { confetti } from '@/scripts/confetti.js';
import { $i } from '@/account.js';

defineProps<{
	twoFactorData: {
		qr: string;
		url: string;
	};
}>();

const emit = defineEmits<{
	(ev: 'closed'): void;
}>();

const dialog = shallowRef<InstanceType<typeof MkModalWindow>>();
const page = ref(0);
const token = ref<string | number | null>(null);
const backupCodes = ref<string[]>();

function cancel() {
	dialog.value.close();
}

async function tokenDone() {
	const res = await os.apiWithDialog('i/2fa/done', {
		token: token.value.toString(),
	});

	backupCodes.value = res.backupCodes;

	page.value++;

	confetti({
		duration: 1000 * 3,
	});
}

function downloadBackupCodes() {
	if (backupCodes.value !== undefined) {
		const txtBlob = new Blob([backupCodes.value.join('\n')], { type: 'text/plain' });
		const dummya = document.createElement('a');
		dummya.href = URL.createObjectURL(txtBlob);
		dummya.download = `${$i?.username}-2fa-backup-codes.txt`;
		dummya.click();
	}
}

function allDone() {
	dialog.value.close();
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

.qr {
	width: 200px;
	max-width: 100%;
}
</style>
