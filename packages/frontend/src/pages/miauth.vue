<template>
<MkSpacer :content-max="800">
	<div v-if="$i">
		<div v-if="state == 'waiting'" class="waiting">
			<div class="">
				<MkLoading/>
			</div>
		</div>
		<div v-if="state == 'denied'" class="denied">
			<div class="">
				<p>{{ i18n.ts._auth.denied }}</p>
			</div>
		</div>
		<div v-else-if="state == 'accepted'" class="accepted">
			<div class="">
				<p v-if="callback">{{ i18n.ts._auth.callback }}<MkEllipsis/></p>
				<p v-else>{{ i18n.ts._auth.pleaseGoBack }}</p>
			</div>
		</div>
		<div v-else class="">
			<div v-if="name" class="">{{ $t('_auth.shareAccess', { name: name }) }}</div>
			<div v-else class="">{{ i18n.ts._auth.shareAccessAsk }}</div>
			<div class="">
				<p>{{ i18n.ts._auth.permissionAsk }}</p>
				<ul>
					<li v-for="p in _permissions" :key="p">{{ $t(`_permissions.${p}`) }}</li>
				</ul>
			</div>
			<div class="">
				<MkButton inline @click="deny">{{ i18n.ts.cancel }}</MkButton>
				<MkButton inline primary @click="accept">{{ i18n.ts.accept }}</MkButton>
			</div>
		</div>
	</div>
	<div v-else class="signin">
		<MkSignin @login="onLogin"/>
	</div>
</MkSpacer>
</template>

<script lang="ts" setup>
import { } from 'vue';
import MkSignin from '@/components/MkSignin.vue';
import MkButton from '@/components/MkButton.vue';
import * as os from '@/os';
import { $i, login } from '@/account';
import { i18n } from '@/i18n';

const props = defineProps<{
	session: string;
	callback?: string;
	name: string;
	icon: string;
	permission: string; // コンマ区切り
}>();

const _permissions = props.permission.split(',');

let state = $ref<string | null>(null);

async function accept(): Promise<void> {
	state = 'waiting';
	await os.api('miauth/gen-token', {
		session: props.session,
		name: props.name,
		iconUrl: props.icon,
		permission: _permissions,
	});

	state = 'accepted';
	if (props.callback) {
		const cbUrl = new URL(props.callback);
		cbUrl.searchParams.set('session', props.session);
		location.href = cbUrl.href;
	}
}

function deny(): void {
	state = 'denied';
}

function onLogin(res): void {
	login(res.i);
}
</script>

<style lang="scss" scoped>

</style>
