<template>
<x-column :menu="menu" :name="name" :column="column" :is-stacked="isStacked" :is-active="isActive">
	<span slot="header">
		<template v-if="column.type == 'home'">%fa:home%</template>
		<template v-if="column.type == 'local'">%fa:R comments%</template>
		<template v-if="column.type == 'global'">%fa:globe%</template>
		<template v-if="column.type == 'list'">%fa:list%</template>
		<span>{{ name }}</span>
	</span>

	<div class="editor" v-if="edit">
		<mk-switch v-model="column.isMediaOnly" @change="onChangeSettings" text="%i18n:@is-media-only%"/>
		<mk-switch v-model="column.isMediaView" @change="onChangeSettings" text="%i18n:@is-media-view%"/>
	</div>
	<x-list-tl v-if="column.type == 'list'" :list="column.list" :media-only="column.isMediaOnly"/>
	<x-tl v-else :src="column.type" :media-only="column.isMediaOnly"/>
</x-column>
</template>

<script lang="ts">
import Vue from 'vue';
import XColumn from './deck.column.vue';
import XTl from './deck.tl.vue';
import XListTl from './deck.list-tl.vue';

export default Vue.extend({
	components: {
		XColumn,
		XTl,
		XListTl
	},

	props: {
		column: {
			type: Object,
			required: true
		},
		isStacked: {
			type: Boolean,
			required: true
		},
		isActive: {
			type: Boolean,
			required: true
		}
	},

	data() {
		return {
			edit: false,
			menu: [{
				content: '%fa:cog% %i18n:@edit%',
				onClick: () => {
					this.edit = !this.edit;
				}
			}]
		}
	},

	computed: {
		name(): string {
			if (this.column.name) return this.column.name;

			switch (this.column.type) {
				case 'home': return '%i18n:common.deck.home%';
				case 'local': return '%i18n:common.deck.local%';
				case 'global': return '%i18n:common.deck.global%';
				case 'list': return this.column.list.title;
			}
		}
	},

	methods: {
		onChangeSettings(v) {
			this.$store.dispatch('settings/saveDeck');
		}
	}
});
</script>
