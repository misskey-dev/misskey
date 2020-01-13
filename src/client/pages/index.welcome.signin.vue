<template>
<div class="mk-signin">
	<div class="_panel">
		<div class="desc">
			<span class="desc" v-html="description || $t('@.about')"></span>
		</div>
	</div>
	<x-signin class="signin _panel"/>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import { toUnicode } from 'punycode';
import { faLock } from '@fortawesome/free-solid-svg-icons';
import XSignin from '../components/signin.vue';
import i18n from '../i18n';
import { host } from '../config';

export default Vue.extend({
	i18n,

	components: {
		XSignin,
	},

	data() {
		return {
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
		
	}
});
</script>

<style lang="scss" scoped>
.mk-signin {
}
</style>
