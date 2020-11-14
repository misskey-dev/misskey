<template>
<div class="rsqzvsbo _section">
	<div class="_panel block about" v-if="meta">
		<div class="body">
			<div class="desc" v-html="meta.description || $t('introMisskey')"></div>
			<MkButton @click="signup()" style="display: inline-block; margin-right: 16px;" primary>{{ $t('signup') }}</MkButton>
			<MkButton @click="signin()" style="display: inline-block;">{{ $t('login') }}</MkButton>
		</div>
	</div>
	<XBlock class="block" initial-path="/announcements"/>
	<XBlock class="block" initial-path="/featured"/>
	<XBlock class="block" initial-path="/channels"/>
	<XBlock class="block" initial-path="/explore"/>
	<XBlock class="block" initial-path="/about-misskey"/>
	<div class="_panel block">
		test
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
import { host } from '@/config';
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
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
	grid-gap: var(--margin);

	> .block {
		height: 500px;
	}
}
</style>
