<template>
<x-popup :source="source" ref="popup" @closed="() => { $emit('closed'); destroyDom(); }">
	<sequential-entrance class="onchrpzrvnoruiaenfcqvccjfuupzzwv" :delay="15">
		<template v-for="(item, i) in items">
			<div v-if="item === null" :key="i" :data-index="i"></div>
			<button v-if="item" @click="clicked(item.action)" :tabindex="i" class="_button" :key="i" :data-index="i">
				<fa v-if="item.icon" :icon="item.icon"/>{{ item.text }}
			</button>
		</template>
	</sequential-entrance>
</x-popup>
</template>

<script lang="ts">
import Vue from 'vue';
import XPopup from './popup.vue';

export default Vue.extend({
	components: {
		XPopup
	},
	props: {
		source: {
			required: true
		},
		items: {
			type: Array,
			required: true
		}
	},
	methods: {
		clicked(fn) {
			fn();
			this.close();
		},
		close() {
			this.$refs.popup.close();
		}
	}
});
</script>

<style lang="scss" scoped>
@import '../theme';

.onchrpzrvnoruiaenfcqvccjfuupzzwv {
	padding: 8px 0;

	> button {
		display: block;
		padding: 8px 16px;
		width: 100%;
		white-space: nowrap;
		font-size: 14px;

		&:hover {
			color: #fff;
			background: $primary;
			text-decoration: none;
		}

		&:active {
			color: #fff;
			background: darken($primary, 10);
		}

		> [data-icon] {
			margin-right: 4px;
		}
	}

	> div {
		margin: 8px 0;
		height: 1px;
		background: var(--divider);
	}
}
</style>
