<template>
<router-link class="ldlomzub" :to="url" v-user-preview="canonical" v-if="url.startsWith('/')">
	<span class="me" v-if="isMe">{{ $t('@.you') }}</span>
	<span class="main">
		<span class="username">@{{ username }}</span>
		<span class="host" :class="{ fade: $store.state.settings.contrastedAcct }" v-if="(host != localHost) || $store.state.settings.showFullAcct">@{{ toUnicode(host) }}</span>
	</span>
</router-link>
<a class="ldlomzub" :href="url" target="_blank" rel="noopener" v-else>
	<span class="main">
		<span class="username">@{{ username }}</span>
		<span class="host" :class="{ fade: $store.state.settings.contrastedAcct }">@{{ toUnicode(host) }}</span>
	</span>
</a>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';
import { toUnicode } from 'punycode';
import { host as localHost } from '../../../config';

export default Vue.extend({
	i18n: i18n(),
	props: {
		username: {
			type: String,
			required: true
		},
		host: {
			type: String,
			required: true
		}
	},
	data() {
		return {
			localHost
		};
	},
	computed: {
		url(): string {
			switch (this.host) {
				case 'twitter.com':
				case 'github.com':
					return `https://${this.host}/${this.username}`;
				default:
					return `/${this.canonical}`;
			}
		},
		canonical(): string {
			return this.host === localHost ? `@${this.username}` : `@${this.username}@${toUnicode(this.host)}`;
		},
		isMe(): boolean {
			return this.$store.getters.isSignedIn && (
				`@${this.username}@${toUnicode(this.host)}` === `@${this.$store.state.i.username}@${toUnicode(localHost)}`.toLowerCase()
			);
		}
	},
	methods: {
		toUnicode
	}
});
</script>

<style lang="stylus" scoped>
.ldlomzub
	color var(--mfmMention)

	> .me
		pointer-events none
		user-select none
		padding 0 4px
		background var(--mfmMention)
		border solid var(--lineWidth) var(--mfmMention)
		border-radius 4px 0 0 4px
		color var(--mfmMentionForeground)

		& + .main
			padding 0 4px
			border solid var(--lineWidth) var(--mfmMention)
			border-radius 0 4px 4px 0

	> .main
		> .host.fade
			opacity 0.5

</style>
