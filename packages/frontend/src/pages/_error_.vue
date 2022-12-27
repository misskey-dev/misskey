<template>
<MkLoading v-if="!loaded"/>
<transition :name="$store.state.animation ? 'zoom' : ''" appear>
	<div v-show="loaded" class="mjndxjch">
		<img src="https://xn--931a.moe/assets/error.jpg" class="_ghost"/>
		<p><b><i class="ti ti-alert-triangle"></i> {{ i18n.ts.pageLoadError }}</b></p>
		<p v-if="meta && (version === meta.version)">{{ i18n.ts.pageLoadErrorDescription }}</p>
		<p v-else-if="serverIsDead">{{ i18n.ts.serverIsDead }}</p>
		<template v-else>
			<p>{{ i18n.ts.newVersionOfClientAvailable }}</p>
			<p>{{ i18n.ts.youShouldUpgradeClient }}</p>
			<MkButton class="button primary" @click="reload">{{ i18n.ts.reload }}</MkButton>
		</template>
		<p><MkA to="/docs/general/troubleshooting" class="_link">{{ i18n.ts.troubleshooting }}</MkA></p>
		<p v-if="error" class="error">ERROR: {{ error }}</p>
	</div>
</transition>
</template>

<script lang="ts" setup>
import { } from 'vue';
import * as misskey from 'misskey-js';
import MkButton from '@/components/MkButton.vue';
import { version } from '@/config';
import * as os from '@/os';
import { unisonReload } from '@/scripts/unison-reload';
import { i18n } from '@/i18n';
import { definePageMetadata } from '@/scripts/page-metadata';

const props = withDefaults(defineProps<{
	error?: Error;
}>(), {
});

let loaded = $ref(false);
let serverIsDead = $ref(false);
let meta = $ref<misskey.entities.LiteInstanceMetadata | null>(null);

os.api('meta', {
	detail: false,
}).then(res => {
	loaded = true;
	serverIsDead = false;
	meta = res;
	localStorage.setItem('v', res.version);
}, () => {
	loaded = true;
	serverIsDead = true;
});

function reload() {
	unisonReload();
}

const headerActions = $computed(() => []);

const headerTabs = $computed(() => []);

definePageMetadata({
	title: i18n.ts.error,
	icon: 'ti ti-alert-triangle',
});
</script>

<style lang="scss" scoped>
.mjndxjch {
	padding: 32px;
	text-align: center;

	> p {
		margin: 0 0 12px 0;
	}

	> .button {
		margin: 8px auto;
	}

	> img {
		vertical-align: bottom;
		height: 128px;
		margin-bottom: 24px;
		border-radius: 16px;
	}

	> .error {
		opacity: 0.7;
	}
}
</style>
