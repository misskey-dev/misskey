<template>
<transition name="fade" mode="out-in">
	<MkLoading v-if="fetching"/>

	<MkError v-else-if="error" @retry="init()"/>

	<div class="_fullinfo" v-else-if="empty">
		<img src="https://xn--931a.moe/assets/info.jpg" class="_ghost"/>
		<div>{{ $ts.noNotes }}</div>
	</div>

	<div v-else>
		<div v-show="more && reversed" style="margin-bottom: var(--margin);">
			<MkButton style="margin: 0 auto;" @click="fetchMoreFeature" :disabled="moreFetching" :style="{ cursor: moreFetching ? 'wait' : 'pointer' }">
				<template v-if="!moreFetching">{{ $ts.loadMore }}</template>
				<template v-if="moreFetching"><MkLoading inline/></template>
			</MkButton>
		</div>

		<XList ref="notes" :items="notes" v-slot="{ item: note }" :direction="reversed ? 'up' : 'down'" :reversed="reversed" :no-gap="noGap" :ad="true">
			<XNote :note="note" class="_block" @update:note="updated(note, $event)" :key="note._featuredId_ || note._prId_ || note.id"/>
		</XList>

		<div v-show="more && !reversed" style="margin-top: var(--margin);">
			<MkButton style="margin: 0 auto;" v-appear="$store.state.enableInfiniteScroll ? fetchMore : null" @click="fetchMore" :disabled="moreFetching" :style="{ cursor: moreFetching ? 'wait' : 'pointer' }">
				<template v-if="!moreFetching">{{ $ts.loadMore }}</template>
				<template v-if="moreFetching"><MkLoading inline/></template>
			</MkButton>
		</div>
	</div>
</transition>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import paging from '@client/scripts/paging';
import XNote from './note.vue';
import XList from './date-separated-list.vue';
import MkButton from '@client/components/ui/button.vue';

export default defineComponent({
	components: {
		XNote, XList, MkButton,
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
		},
		noGap: {
			type: Boolean,
			required: false,
			default: false
		},
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

<style lang="scss" scoped>
.fade-enter-active,
.fade-leave-active {
	transition: opacity 0.125s ease;
}
.fade-enter-from,
.fade-leave-to {
	opacity: 0;
}
</style>
