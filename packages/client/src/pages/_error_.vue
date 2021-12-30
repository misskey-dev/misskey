<template>
<MkLoading v-if="!loaded" />
<transition :name="$store.state.animation ? 'zoom' : ''" appear>
	<div v-show="loaded" class="mjndxjch">
		<img src="https://xn--931a.moe/assets/error.jpg" class="_ghost"/>
		<p><b><i class="fas fa-exclamation-triangle"></i> {{ $ts.pageLoadError }}</b></p>
		<p v-if="version === meta.version">{{ $ts.pageLoadErrorDescription }}</p>
		<p v-else-if="serverIsDead">{{ $ts.serverIsDead }}</p>
		<template v-else>
			<p>{{ $ts.newVersionOfClientAvailable }}</p>
			<p>{{ $ts.youShouldUpgradeClient }}</p>
			<MkButton class="button primary" @click="reload">{{ $ts.reload }}</MkButton>
		</template>
		<p><MkA to="/docs/general/troubleshooting" class="_link">{{ $ts.troubleshooting }}</MkA></p>
		<p v-if="error" class="error">ERROR: {{ error }}</p>
	</div>
</transition>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import MkButton from '@/components/ui/button.vue';
import * as symbols from '@/symbols';
import { version } from '@/config';
import * as os from '@/os';
import { unisonReload } from '@/scripts/unison-reload';

export default defineComponent({
	components: {
		MkButton,
	},
	props: {
		error: {
			required: false,
		}
	},
	data() {
		return {
			[symbols.PAGE_INFO]: {
				title: this.$ts.error,
				icon: 'fas fa-exclamation-triangle'
			},
			loaded: false,
			serverIsDead: false,
			meta: {} as any,
			version,
		};
	},
	created() {
		os.api('meta', {
			detail: false
		}).then(meta => {
			this.loaded = true;
			this.serverIsDead = false;
			this.meta = meta;
			localStorage.setItem('v', meta.version);
		}, () => {
			this.loaded = true;
			this.serverIsDead = true;
		});
	},
	methods: {
		reload() {
			unisonReload();
		},
	},
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
