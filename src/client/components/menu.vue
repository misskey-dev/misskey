<template>
<x-popup :source="source" :no-center="noCenter" :fixed="fixed" :width="width" ref="popup" @closed="() => { $emit('closed'); destroyDom(); }">
	<sequential-entrance class="rrevdjwt" :delay="15">
		<template v-for="(item, i) in items.filter(item => item !== undefined)">
			<div v-if="item === null" class="divider" :key="i" :data-index="i"></div>
			<span v-else-if="item.type === 'label'" class="label item" :class="{ left: item.align === 'left' }" :key="i" :data-index="i">
				<span>{{ item.text }}</span>
			</span>
			<router-link v-else-if="item.type === 'link'" :to="item.to" @click.native="close()" :tabindex="i" class="_button item" :class="{ left: item.align === 'left' }" :key="i" :data-index="i">
				<fa v-if="item.icon" :icon="item.icon" fixed-width/>
				<mk-avatar v-if="item.avatar" :user="item.avatar" class="avatar"/>
				<span>{{ item.text }}</span>
			</router-link>
			<a v-else-if="item.type === 'a'" :href="item.href" :target="item.target" :download="item.download" @click="close()" :tabindex="i" class="_button item" :class="{ left: item.align === 'left' }" :key="i" :data-index="i">
				<fa v-if="item.icon" :icon="item.icon" fixed-width/>
				<span>{{ item.text }}</span>
			</a>
			<button v-else-if="item.type === 'user'" @click="clicked(item.action)" :tabindex="i" class="_button item" :class="{ left: item.align === 'left' }" :key="i" :data-index="i">
				<mk-avatar :user="item.user" class="avatar"/><mk-user-name :user="item.user"/>
			</button>
			<button v-else @click="clicked(item.action)" :tabindex="i" class="_button item" :class="{ left: item.align === 'left' }" :key="i" :data-index="i">
				<fa v-if="item.icon" :icon="item.icon" fixed-width/>
				<mk-avatar v-if="item.avatar" :user="item.avatar" class="avatar"/>
				<span>{{ item.text }}</span>
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
		},
		noCenter: {
			type: Boolean,
			required: false
		},
		fixed: {
			type: Boolean,
			required: false
		},
		width: {
			type: Number,
			required: false
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
.rrevdjwt {
	padding: 8px 0;

	> .item {
		display: block;
		padding: 8px 16px;
		width: 100%;
		box-sizing: border-box;
		white-space: nowrap;
		font-size: 0.9em;
		text-align: center;
		overflow: hidden;
		text-overflow: ellipsis;

		&:hover {
			color: #fff;
			background: var(--primary);
			text-decoration: none;
		}

		&:active {
			color: #fff;
			background: var(--primaryDarken);
		}

		&.label {
			pointer-events: none;
			font-size: 0.7em;
			padding-bottom: 4px;

			> span {
				opacity: 0.7;
			}
		}

		> [data-icon] {
			margin-right: 4px;
			width: 20px;
		}

		> .avatar {
			margin-right: 4px;
			width: 20px;
			height: 20px;
		}

		&.left {
			text-align: left;
		}
	}

	> .divider {
		margin: 8px 0;
		height: 1px;
		background: var(--divider);
	}
}
</style>
