<template>
<div class="">
	<div class="_panel">
		<div class="desc" v-html="description || $t('@.about')"></div>
		<x-button @click="signin()">{{ $t('login') }}</x-button>
		<x-button @click="signup()">{{ $t('signup') }}</x-button>
	</div>
	<x-notes :pagination="featuredPagination"/>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import { toUnicode } from 'punycode';
import XSigninDialog from '../components/signin-dialog.vue';
import XSignupDialog from '../components/signup-dialog.vue';
import XButton from '../components/ui/button.vue';
import XNotes from '../components/notes.vue';
import i18n from '../i18n';
import { host } from '../config';

export default Vue.extend({
	i18n,

	components: {
		XButton,
		XNotes,
	},

	data() {
		return {
			featuredPagination: {
				endpoint: 'notes/featured',
				limit: 10,
			},
			host: toUnicode(host),
			meta: null,
			description: '',
			announcements: [],
		};
	},

	created() {
		this.$root.getMeta().then(meta => {
			this.meta = meta;
			this.name = meta.name;
			this.description = meta.description;
			this.announcements = meta.announcements;
			this.banner = meta.bannerUrl;
		});

		this.$root.api('stats').then(stats => {
			this.stats = stats;
		});
	},

	methods: {
		signin() {
			this.$root.new(XSigninDialog);
		},

		signup() {
			this.$root.new(XSignupDialog);
		}
	}
});
</script>

<style lang="scss" scoped>

</style>
