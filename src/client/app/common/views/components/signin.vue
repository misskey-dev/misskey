<template>
<form class="mk-signin" :class="{ signing }" @submit.prevent="onSubmit">
	<ui-button type="submit" :disabled="signing">{{ signing ? $t('signing-in') : $t('@.signin') }}</ui-button>
</form>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';
import { apiUrl, host, instanceHost } from '../../../config';
import { toUnicode } from 'punycode';
import { hexifyAB } from '../../scripts/2fa';

export default Vue.extend({
	i18n: i18n('common/views/components/signin.vue'),

	props: {
		withAvatar: {
			type: Boolean,
			required: false,
			default: true
		}
	},

	data() {
		return {
			signing: false,
		};
	},

	methods: {
		async onSubmit() {
			this.signing = true;
			try {
				const res: {secret: string, id: string} = await this.$root.api("app/create", {
					name: "misskey-v11-front",
					description: "Misskey v11のフロントだけ切り出したやつ",
					permission: [
						'read:account',
						'write:account',
						'read:blocks',
						'write:blocks',
						'read:drive',
						'write:drive',
						'read:favorites',
						'write:favorites',
						'read:following',
						'write:following',
						'read:messaging',
						'write:messaging',
						'read:mutes',
						'write:mutes',
						'write:notes',
						'read:notifications',
						'write:notifications',
						'read:reactions',
						'write:reactions',
						'write:votes',
						'read:pages',
						'write:pages',
						'write:page-likes',
						'read:page-likes',
						'read:user-groups',
						'write:user-groups',
					],
					callbackUrl: `${location.origin}/callback.html#domain=${instanceHost}`
				})
				localStorage.setItem(`appSecret:${instanceHost}`, res.secret)
				const session = await this.$root.api("auth/session/generate", {
					appSecret: res.secret,
				})
				location.href = session.url
			} catch(e) {
				this.$root.dialog({
					type: 'error',
					text: `${e}`
				});
			} finally {
				this.signing = false;
			}
		}
	}
});
</script>

<style lang="stylus" scoped>
.mk-signin
	color #555

	.tap-group > button
		margin-bottom 1em

	&.signing
		&, *
			cursor wait !important
</style>
