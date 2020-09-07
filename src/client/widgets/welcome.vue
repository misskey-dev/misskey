<template>
<div class="mkw-welcome _panel" v-if="meta">
	<div class="banner" :style="{ backgroundImage: `url(${ meta.bannerUrl })` }"></div>
	<div class="body">
		<h1 class="name" v-html="meta.name || host"></h1>
		<div class="desc" v-html="meta.description || $t('introMisskey')"></div>
		<mk-button @click="signup()" style="display: inline-block; margin-right: 16px;" primary>{{ $t('signup') }}</mk-button>
		<mk-button @click="signin()" style="display: inline-block;">{{ $t('login') }}</mk-button>
	</div>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { toUnicode } from 'punycode';
import XSigninDialog from '@/components/signin-dialog.vue';
import XSignupDialog from '@/components/signup-dialog.vue';
import MkButton from '@/components/ui/button.vue';
import { host } from '@/config';
import define from './define';
import * as os from '@/os';

const widget = define({
	name: 'welcome',
	props: () => ({
	})
});

export default defineComponent({
	extends: widget,
	components: {
		MkButton
	},

	data() {
		return {
			host: toUnicode(host),
		};
	},

	computed: {
		meta() {
			return this.$store.state.instance.meta;
		},
	},

	created() {
		os.api('stats').then(stats => {
			this.stats = stats;
		});
	},

	methods: {
		signin() {
			os.modal(XSigninDialog, {
				autoSet: true
			});
		},

		signup() {
			os.modal(XSignupDialog, {
				autoSet: true
			});
		}
	}
});
</script>

<style lang="scss" scoped>
.mkw-welcome {
	overflow: hidden;

	> .banner {
		height: 90px;
		background-size: cover;
		background-position: center center;
	}

	> .body {
		padding: 16px;

		> .name {
			font-size: 1.2em;
			margin: 0 0 0.5em 0;
		}

		> .desc {
			font-size: 0.9em;
		}
	}
}
</style>
