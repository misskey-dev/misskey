<template>
<div class="_formRoot">
	<FormSection>
		<template #label>{{ i18n.ts.password }}</template>
		<FormButton primary @click="change()">{{ i18n.ts.changePassword }}</FormButton>
	</FormSection>

	<FormSection>
		<template #label>{{ i18n.ts.twoStepAuthentication }}</template>
		<X2fa/>
	</FormSection>
	
	<FormSection>
		<template #label>{{ i18n.ts.signinHistory }}</template>
		<MkPagination :pagination="pagination">
			<template v-slot="{items}">
				<div>
					<div v-for="item in items" :key="item.id" v-panel class="timnmucd">
						<header>
							<i v-if="item.success" class="fas fa-check icon succ"></i>
							<i v-else class="fas fa-times-circle icon fail"></i>
							<code class="ip _monospace">{{ item.ip }}</code>
							<MkTime :time="item.createdAt" class="time"/>
						</header>
					</div>
				</div>
			</template>
		</MkPagination>
	</FormSection>

	<FormSection>
		<FormSlot>
			<FormButton danger @click="regenerateToken"><i class="fas fa-sync-alt"></i> {{ i18n.ts.regenerateLoginToken }}</FormButton>
			<template #caption>{{ i18n.ts.regenerateLoginTokenDescription }}</template>
		</FormSlot>
	</FormSection>
</div>
</template>

<script lang="ts" setup>
import { defineExpose } from 'vue';
import FormSection from '@/components/form/section.vue';
import FormSlot from '@/components/form/slot.vue';
import FormButton from '@/components/ui/button.vue';
import MkPagination from '@/components/ui/pagination.vue';
import X2fa from './2fa.vue';
import * as os from '@/os';
import * as symbols from '@/symbols';
import { i18n } from '@/i18n';

const pagination = {
	endpoint: 'i/signin-history' as const,
	limit: 5,
};

async function change() {
	const { canceled: canceled1, result: currentPassword } = await os.inputText({
		title: i18n.ts.currentPassword,
		type: 'password'
	});
	if (canceled1) return;

	const { canceled: canceled2, result: newPassword } = await os.inputText({
		title: i18n.ts.newPassword,
		type: 'password'
	});
	if (canceled2) return;

	const { canceled: canceled3, result: newPassword2 } = await os.inputText({
		title: i18n.ts.newPasswordRetype,
		type: 'password'
	});
	if (canceled3) return;

	if (newPassword !== newPassword2) {
		os.alert({
			type: 'error',
			text: i18n.ts.retypedNotMatch
		});
		return;
	}
	
	os.apiWithDialog('i/change-password', {
		currentPassword,
		newPassword
	});
}

function regenerateToken() {
	os.inputText({
		title: i18n.ts.password,
		type: 'password'
	}).then(({ canceled, result: password }) => {
		if (canceled) return;
		os.api('i/regenerate_token', {
			password: password
		});
	});
}

defineExpose({
	[symbols.PAGE_INFO]: {
		title: i18n.ts.security,
		icon: 'fas fa-lock',
		bg: 'var(--bg)',
	}
});
</script>

<style lang="scss" scoped>
.timnmucd {
	padding: 16px;

	&:first-child {
		border-top-left-radius: 6px;
		border-top-right-radius: 6px;
	}

	&:last-child {
		border-bottom-left-radius: 6px;
		border-bottom-right-radius: 6px;
	}

	&:not(:last-child) {
		border-bottom: solid 0.5px var(--divider);
	}

	> header {
		display: flex;
		align-items: center;

		> .icon {
			width: 1em;
			margin-right: 0.75em;

			&.succ {
				color: var(--success);
			}

			&.fail {
				color: var(--error);
			}
		}

		> .ip {
			flex: 1;
			min-width: 0;
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
			margin-right: 12px;
		}

		> .time {
			margin-left: auto;
			opacity: 0.7;
		}
	}
}
</style>
