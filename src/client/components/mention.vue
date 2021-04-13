<template>
<MkA class="ldlomzub" :class="{ isMe }" :to="url" v-user-preview="canonical" v-if="url.startsWith('/')">
	<span class="me" v-if="isMe">{{ $ts.you }}</span>
	<span class="main">
		<span class="username">@{{ username }}</span>
		<span class="host" v-if="(host != localHost) || $store.state.showFullAcct">@{{ toUnicode(host) }}</span>
	</span>
</MkA>
<a class="ldlomzub" :href="url" target="_blank" rel="noopener" v-else>
	<span class="main">
		<span class="username">@{{ username }}</span>
		<span class="host">@{{ toUnicode(host) }}</span>
	</span>
</a>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { toUnicode } from 'punycode/';
import { host as localHost } from '@client/config';
import { wellKnownServices } from '../../well-known-services';
import * as os from '@client/os';

export default defineComponent({
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
			const wellKnown = wellKnownServices.find(x => x[0] === this.host);
			if (wellKnown) {
				return wellKnown[1](this.username);
			} else {
				return `/${this.canonical}`;
			}
		},
		canonical(): string {
			return this.host === localHost ? `@${this.username}` : `@${this.username}@${toUnicode(this.host)}`;
		},
		isMe(): boolean {
			return this.$i && (
				`@${this.username}@${toUnicode(this.host)}` === `@${this.$i.username}@${toUnicode(localHost)}`.toLowerCase()
			);
		}
	},
	methods: {
		toUnicode
	}
});
</script>

<style lang="scss" scoped>
.ldlomzub {
	color: var(--mention);

	&.isMe {
		color: var(--mentionMe);
	}
	
	> .me {
		pointer-events: none;
		user-select: none;
		font-size: 70%;
		vertical-align: top;
	}

	> .main {
		> .host {
			opacity: 0.5;
		}
	}
}
</style>
