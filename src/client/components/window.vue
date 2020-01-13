<template>
<x-modal ref="modal" @closed="() => { $emit('closed'); destroyDom(); }">
	<div class="ebkgoccj">
		<div class="header">
			<span class="title">
				<mk-avatar :user="avatar" v-if="avatar" class="avatar"/>
				<slot name="header"></slot>
			</span>
			<button class="_button" @click="$refs.modal.close()"><fa :icon="faTimes"/></button>
		</div>
		<div class="body">
			<slot></slot>
		</div>
	</div>
</x-modal>
</template>

<script lang="ts">
import Vue from 'vue';
import { faTimes, faCheck } from '@fortawesome/free-solid-svg-icons';
import i18n from '../i18n';
import XModal from './modal.vue';

export default Vue.extend({
	i18n,

	components: {
		XModal,
	},

	props: {
		avatar: {
			type: Object,
			required: false
		}
	},

	data() {
		return {
			faTimes, faCheck
		};
	},

	methods: {
	}
});
</script>

<style lang="scss" scoped>
@import '../theme';

.ebkgoccj {
	width: 400px;
	height: 400px;
	background: var(--bg);
	border-radius: var(--radius);
	overflow: hidden;
	display: flex;
	flex-direction: column;

	@media (max-width: 500px) {
		width: 350px;
		height: 350px;
	}

	> .header {
		$height: 58px;
		display: flex;
		flex-shrink: 0;

		> button {
			height: $height;
			width: $height;

			@media (max-width: 500px) {
				height: 42px;
				width: 42px;
			}
		}

		> .title {
			flex: 1;
			line-height: $height;
			padding-left: 32px;
			font-weight: bold;
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
			pointer-events: none;

			@media (max-width: 500px) {
				line-height: 42px;
				padding-left: 16px;
			}

			> .avatar {
				$size: 32px;
				height: $size;
				width: $size;
				margin: (($height - $size) / 2) 8px (($height - $size) / 2) 0;
			}
		}
	}

	> .body {
		overflow: auto;
	}
}
</style>
