<template>
<div class="mk-notes" v-size="[{ max: 500 }]">
	<div class="empty" v-if="empty">
		<img src="https://xn--931a.moe/assets/info.png" class="_ghost"/>
		<div>{{ $t('noNotes') }}</div>
	</div>

	<mk-error v-if="error" @retry="init()"/>

	<div class="more" v-if="more && reversed" style="margin-bottom: var(--margin);">
		<mk-button class="button" :disabled="moreFetching" :style="{ cursor: moreFetching ? 'wait' : 'pointer' }" @click="fetchMore()" primary>
			<template v-if="!moreFetching">{{ $t('loadMore') }}</template>
			<template v-if="moreFetching"><mk-loading inline/></template>
		</mk-button>
	</div>

	<x-list ref="notes" class="notes" :items="notes" v-slot="{ item: note }" :direction="reversed ? 'up' : 'down'" :reversed="reversed">
		<x-note :note="note" :detail="detail" :key="note._featuredId_ || note._prId_ || note.id"/>
	</x-list>

	<div class="more" v-if="more && !reversed" style="margin-top: var(--margin);">
		<mk-button class="button" :disabled="moreFetching" :style="{ cursor: moreFetching ? 'wait' : 'pointer' }" @click="fetchMore()" primary>
			<template v-if="!moreFetching">{{ $t('loadMore') }}</template>
			<template v-if="moreFetching"><mk-loading inline/></template>
		</mk-button>
	</div>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../i18n';
import paging from '../scripts/paging';
import XNote from './note.vue';
import XList from './date-separated-list.vue';
import MkButton from './ui/button.vue';

export default Vue.extend({
	i18n,

	components: {
		XNote, XList, MkButton
	},

	mixins: [
		paging({
			before: (self) => {
				self.$emit('before');
			},

			after: (self, e) => {
				self.$emit('after', e);
			}
		}),
	],

	props: {
		pagination: {
			required: true
		},

		detail: {
			type: Boolean,
			required: false,
			default: false
		},

		extract: {
			required: false
		}
	},

	computed: {
		notes(): any[] {
			return this.extract ? this.extract(this.items) : this.items;
		},

		reversed(): boolean {
			return this.pagination.reversed;
		}
	},

	methods: {
		focus() {
			this.$refs.notes.focus();
		}
	}
});
</script>

<style lang="scss" scoped>
.mk-notes {
	> .empty {
		padding: 32px;
		text-align: center;

		> img {
			vertical-align: bottom;
			height: 128px;
			margin-bottom: 16px;
			border-radius: 16px;
		}
	}

	> .notes {
		> ::v-deep *:not(:last-child) {
			margin-bottom: var(--marginFull);
		}
	}

	&.max-width_500px {
		> .notes {
			> ::v-deep *:not(:last-child) {
				margin-bottom: var(--marginHalf);
			}
		}
	}

	> .more > .button {
		margin-left: auto;
		margin-right: auto;
		height: 48px;
		width: 100%;
	}
}
</style>
