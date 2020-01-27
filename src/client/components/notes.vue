<template>
<div class="mk-notes" v-size="[{ max: 500 }]">
	<div class="empty" v-if="empty">{{ $t('noNotes') }}</div>

	<mk-error v-if="error" @retry="init()"/>

	<x-list ref="notes" class="notes" :items="notes" v-slot="{ item: note, i }">
		<x-note :note="note" :detail="detail" :key="note.id" :data-index="i"/>
	</x-list>

	<footer v-if="more">
		<button @click="fetchMore()" :disabled="moreFetching" :style="{ cursor: moreFetching ? 'wait' : 'pointer' }" class="_buttonPrimary">
			<template v-if="!moreFetching">{{ $t('loadMore') }}</template>
			<template v-if="moreFetching"><fa :icon="faSpinner" pulse fixed-width/></template>
		</button>
	</footer>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import i18n from '../i18n';
import paging from '../scripts/paging';
import XNote from './note.vue';
import XList from './date-separated-list.vue';
import getUserName from '../../misc/get-user-name';
import getNoteSummary from '../../misc/get-note-summary';

export default Vue.extend({
	i18n,

	components: {
		XNote, XList
	},

	mixins: [
		paging({
			onPrepend: (self, note) => {
				// タブが非表示なら通知
				if (document.hidden) {
					if ('Notification' in window && Notification.permission === 'granted') {
						new Notification(getUserName(note.user), {
							body: getNoteSummary(note),
							icon: note.user.avatarUrl,
							tag: 'newNote'
						});
					}
				}
			},

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

	data() {
		return {
			faSpinner
		};
	},

	computed: {
		notes(): any[] {
			return this.extract ? this.extract(this.items) : this.items;
		},
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
		margin: 0 auto;
		padding: 32px;
		text-align: center;
		background: rgba(0, 0, 0, 0.3);
		color: #fff;
		-webkit-backdrop-filter: blur(16px);
		backdrop-filter: blur(16px);
		border-radius: 6px;
	}

	> .notes {
		> ::v-deep * {
			margin-bottom: var(--marginFull);
		}
	}

	&.max-width_500px {
		> .notes {
			> ::v-deep * {
				margin-bottom: var(--marginHalf);
			}
		}
	}

	> footer {
		text-align: center;

		&:empty {
			display: none;
		}

		> button {
			margin: 0;
			padding: 16px;
			width: 100%;
			border-radius: var(--radius);

			&:disabled {
				opacity: 0.7;
			}
		}
	}
}
</style>
