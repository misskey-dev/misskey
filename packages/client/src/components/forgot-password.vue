<template>
<XModalWindow ref="dialog"
	:width="370"
	:height="400"
	@close="dialog.close()"
	@closed="emit('closed')"
>
	<template #header>{{ i18n.ts.forgotPassword }}</template>

	<form v-if="instance.enableEmail" class="bafeceda" @submit.prevent="onSubmit">
		<div class="main _formRoot">
			<MkInput v-model="username" class="_formBlock" type="text" pattern="^[a-zA-Z0-9_]+$" spellcheck="false" autofocus required>
				<template #label>{{ i18n.ts.username }}</template>
				<template #prefix>@</template>
			</MkInput>

			<MkInput v-model="email" class="_formBlock" type="email" spellcheck="false" required>
				<template #label>{{ i18n.ts.emailAddress }}</template>
				<template #caption>{{ i18n.ts._forgotPassword.enterEmail }}</template>
			</MkInput>

			<MkButton class="_formBlock" type="submit" :disabled="processing" primary style="margin: 0 auto;">{{ i18n.ts.send }}</MkButton>
		</div>
		<div class="sub">
			<MkA to="/about" class="_link">{{ i18n.ts._forgotPassword.ifNoEmail }}</MkA>
		</div>
	</form>
	<div v-else class="bafecedb">
		{{ i18n.ts._forgotPassword.contactAdmin }}
	</div>
</XModalWindow>
</template>

<script lang="ts" setup>
import { } from 'vue';
import XModalWindow from '@/components/ui/modal-window.vue';
import MkButton from '@/components/ui/button.vue';
import MkInput from '@/components/form/input.vue';
import * as os from '@/os';
import { instance } from '@/instance';
import { i18n } from '@/i18n';

const emit = defineEmits<{
	(ev: 'done'): void;
	(ev: 'closed'): void;
}>();

let dialog: InstanceType<typeof XModalWindow> = $ref();

let username = $ref('');
let email = $ref('');
let processing = $ref(false);

async function onSubmit() {
	processing = true;
	await os.apiWithDialog('request-reset-password', {
		username,
		email,
	});
	emit('done');
	dialog.close();
}
</script>

<style lang="scss" scoped>
.bafeceda {
	> .main {
		padding: 24px;
	}

	> .sub {
		border-top: solid 0.5px var(--divider);
		padding: 24px;
	}
}

.bafecedb {
	padding: 24px;
}
</style>
