<template>
<div class="mk-notes">
	<div class="empty" v-if="empty">{{ $t('noNotes') }}</div>

	<mk-error v-if="error" @retry="init()"/>

	<sequential-entrance class="notes">
		<template v-for="(note, i) in _notes">
			<x-note :note="note" :key="note.id" :data-index="i" :detail="detail"/>
			<x-date-separator :key="note.id + '_date'" :data-index="i" v-if="i != items.length - 1 && note._date != _notes[i + 1]._date" :newer="note.createdAt" :older="_notes[i + 1].createdAt"/>
		</template>
	</sequential-entrance>

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
import XDateSeparator from './date-separator.vue';
import getUserName from '../../misc/get-user-name';
import getNoteSummary from '../../misc/get-note-summary';

export default Vue.extend({
	i18n,

	components: {
		XNote, XDateSeparator
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

		_notes(): any[] {
			return (this.notes as any).map(item => {
				const date = new Date(item.createdAt).getDate();
				item._date = date;
				return item;
			});
		}
	},
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
		> * {
			margin-bottom: 16px;

			@media (max-width: 500px) {
				margin-bottom: 8px;
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

			&:disabled {
				opacity: 0.7;
			}
		}
	}
}
</style>
