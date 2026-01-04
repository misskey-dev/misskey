<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader :tabs="headerTabs">
	<div class="_spacer" style="--MI_SPACER-w: 700px; --MI_SPACER-min: 16px; --MI_SPACER-max: 32px;">
		<div class="_gaps_m">
			<MkFolder :defaultOpen="true">
				<template #icon><i class="ti ti-message-question"></i></template>
				<template #label>{{ i18n.ts._noq.settings }}</template>
				<template v-if="form.modified.value" #footer>
					<MkFormFooter :form="form"/>
				</template>

				<div class="_gaps">
					<MkInfo>{{ i18n.ts._noq.adminSettingsDescription }}</MkInfo>

					<MkInput v-model="form.state.noqBotAccountUsername">
						<template #label>{{ i18n.ts._noq.botAccountUsername }}<span v-if="form.modifiedStates.noqBotAccountUsername" class="_modified">{{ i18n.ts.modified }}</span></template>
						<template #caption>{{ i18n.ts._noq.botAccountUsernameDescription }}</template>
						<template #prefix>@</template>
					</MkInput>
				</div>
			</MkFolder>
		</div>
	</div>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import MkInput from '@/components/MkInput.vue';
import MkInfo from '@/components/MkInfo.vue';
import MkFolder from '@/components/MkFolder.vue';
import MkFormFooter from '@/components/MkFormFooter.vue';
import * as os from '@/os.js';
import { misskeyApi } from '@/utility/misskey-api.js';
import { i18n } from '@/i18n.js';
import { definePage } from '@/page.js';
import { useForm } from '@/composables/use-form.js';

// 管理者設定の初期データ取得
const noqSettings = await misskeyApi('admin/noq/settings');

// useFormでフォーム状態を管理
const form = useForm({
	noqBotAccountUsername: noqSettings.noqBotAccountUsername ?? '',
}, async (state) => {
	await os.apiWithDialog('admin/noq/settings/update', {
		noqBotAccountUsername: state.noqBotAccountUsername || null,
	});
});

const headerTabs = computed(() => []);

definePage(() => ({
	title: i18n.ts._noq.settings,
	icon: 'ti ti-message-question',
}));
</script>
