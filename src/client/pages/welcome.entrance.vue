<template>
<div class="rsqzvsbo _section">
	<div class="about" v-if="meta">
		<h1>{{ instanceName }}</h1>
		<div class="desc" v-html="meta.description || $t('introMisskey')"></div>
		<MkButton @click="signup()" style="display: inline-block; margin-right: 16px;" primary>{{ $t('signup') }}</MkButton>
		<MkButton @click="signin()" style="display: inline-block;">{{ $t('login') }}</MkButton>
	</div>
	<div class="blocks">
		<XBlock class="block" initial-path="/announcements"/>
		<XBlock class="block" initial-path="/featured"/>
		<XBlock class="block" initial-path="/channels"/>
		<XBlock class="block" initial-path="/explore"/>
		<XBlock class="block" initial-path="/about-misskey"/>
		<div class="_panel block">
			test
		</div>
	</div>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { toUnicode } from 'punycode';
import XSigninDialog from '@/components/signin-dialog.vue';
import XSignupDialog from '@/components/signup-dialog.vue';
import MkButton from '@/components/ui/button.vue';
import XNotes from '@/components/notes.vue';
import XBlock from './welcome.entrance.block.vue';
import { host, instanceName } from '@/config';
import * as os from '@/os';

export default defineComponent({
	components: {
		MkButton,
		XNotes,
		XBlock,
	},

	data() {
		return {
			host: toUnicode(host),
			instanceName,
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
			os.popup(XSigninDialog, {
				autoSet: true
			}, {}, 'closed');
		},

		signup() {
			os.popup(XSignupDialog, {
				autoSet: true
			}, {}, 'closed');
		}
	}
});
</script>

<style lang="scss" scoped>
.rsqzvsbo {
	text-align: center;

	> .about {
		display: inline-block;
		padding: 24px;
		margin-bottom: var(--margin);
		-webkit-backdrop-filter: blur(8px);
		backdrop-filter: blur(8px);
		background: rgba(0, 0, 0, 0.5);
		border-radius: var(--radius);
		text-align: center;
		box-sizing: border-box;
		min-width: 300px;
		max-width: 800px;

		&, * {
			color: #fff !important;
		}

		> h1 {
			margin: 0 0 16px 0;
		}
	}

	> .blocks {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
		grid-gap: var(--margin);
		text-align: left;

		> .block {
			height: 600px;
		}

		@media (max-width: 800px) {
			grid-template-columns: 1fr;
		}
	}
}
</style>
