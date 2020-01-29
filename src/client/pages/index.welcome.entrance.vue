<template>
<div class="rsqzvsbo">
	<div class="_panel about">
		<div class="banner" :style="{ backgroundImage: `url(${ banner })` }"></div>
		<div class="body">
			<h1 class="name" v-html="name || host"></h1>
			<div class="desc" v-html="description || $t('introMisskey')"></div>
			<mk-button @click="signup()" style="display: inline-block; margin-right: 16px;" primary>{{ $t('signup') }}</mk-button>
			<mk-button @click="signin()" style="display: inline-block;">{{ $t('login') }}</mk-button>
		</div>
	</div>
	<x-notes :pagination="featuredPagination"/>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import { toUnicode } from 'punycode';
import XSigninDialog from '../components/signin-dialog.vue';
import XSignupDialog from '../components/signup-dialog.vue';
import MkButton from '../components/ui/button.vue';
import XNotes from '../components/notes.vue';
import i18n from '../i18n';
import { host } from '../config';

export default Vue.extend({
	i18n,

	components: {
		MkButton,
		XNotes,
	},

	data() {
		return {
			featuredPagination: {
				endpoint: 'notes/featured',
				limit: 10,
				noPaging: true,
			},
			host: toUnicode(host),
			meta: null,
			name: null,
			description: null,
			banner: null,
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
			this.$root.new(XSigninDialog, {
				autoSet: true
			});
		},

		signup() {
			this.$root.new(XSignupDialog);
		}
	}
});
</script>

<style lang="scss" scoped>
.rsqzvsbo {
	> .about {
		overflow: hidden;
		margin-bottom: var(--margin);

		> .banner {
			height: 170px;
			background-size: cover;
			background-position: center center;
		}

		> .body {
			padding: 32px;

			@media (max-width: 500px) {
				padding: 16px;
			}

			> .name {
				margin: 0 0 0.5em 0;
			}
		}
	}
}
</style>
