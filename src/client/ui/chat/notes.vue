<template>
<div class="">
	<div class="_fullinfo" v-if="empty">
		<img src="https://xn--931a.moe/assets/info.jpg" class="_ghost"/>
		<div>{{ $ts.noNotes }}</div>
	</div>

	<MkError v-if="error" @retry="init()"/>

	<div v-show="more && reversed" style="margin-bottom: var(--margin);">
		<button class="_loadMore" @click="fetchMore" :disabled="moreFetching" :style="{ cursor: moreFetching ? 'wait' : 'pointer' }">
			<template v-if="!moreFetching">{{ $ts.loadMore }}</template>
			<template v-if="moreFetching"><MkLoading inline/></template>
		</button>
	</div>

	<XList ref="notes" :items="notes" v-slot="{ item: note }" :direction="reversed ? 'up' : 'down'" :reversed="reversed">
		<XNote :note="note" @update:note="updated(note, $event)" :key="note._featuredId_ || note._prId_ || note.id"/>
	</XList>

	<div v-show="more && !reversed" style="margin-top: var(--margin);">
		<button class="_loadMore" v-appear="$store.state.enableInfiniteScroll ? fetchMore : null" @click="fetchMore" :disabled="moreFetching" :style="{ cursor: moreFetching ? 'wait' : 'pointer' }">
			<template v-if="!moreFetching">{{ $ts.loadMore }}</template>
			<template v-if="moreFetching"><MkLoading inline/></template>
		</button>
	</div>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import paging from '@/scripts/paging';
import XNote from './note.vue';
import XList from './date-separated-list.vue';

export default defineComponent({
	components: {
		XNote, XList,
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

		prop: {
			type: String,
			required: false
		}
	},

	emits: ['before', 'after'],

	computed: {
		notes(): any[] {
			return this.prop ? this.items.map(item => item[this.prop]) : this.items;
		},

		reversed(): boolean {
			return this.pagination.reversed;
		}
	},

	methods: {
		updated(oldValue, newValue) {
			const i = this.notes.findIndex(n => n === oldValue);
			if (this.prop) {
				this.items[i][this.prop] = newValue;
			} else {
				this.items[i] = newValue;
			}
		},

		focus() {
			this.$refs.notes.focus();
		}
	}
});
</script>
