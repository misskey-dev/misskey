<template>
<MkModal ref="modal" :prefer-type="'dialog'" :z-priority="'high'" @click="success ? done() : () => {}" @closed="$emit('closed')">
	<div class="iuyakobc" :class="{ iconOnly: (text == null) || success }">
		<i v-if="success" class="fas fa-check icon success"></i>
		<i v-else class="fas fa-spinner fa-pulse icon waiting"></i>
		<div v-if="text && !success" class="text">{{ text }}<MkEllipsis/></div>
	</div>
</MkModal>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import MkModal from '@/components/ui/modal.vue';

export default defineComponent({
	components: {
		MkModal,
	},

	props: {
		success: {
			type: Boolean,
			required: true,
		},
		showing: {
			type: Boolean,
			required: true,
		},
		text: {
			type: String,
			required: false,
		},
	},

	emits: ['done', 'closed'],

	data() {
		return {
		};
	},

	watch: {
		showing() {
			if (!this.showing) this.done();
		}
	},

	methods: {
		done() {
			this.$emit('done');
			this.$refs.modal.close();
		},
	}
});
</script>

<style lang="scss" scoped>
.iuyakobc {
	position: relative;
	padding: 32px;
	box-sizing: border-box;
	text-align: center;
	background: var(--panel);
	border-radius: var(--radius);
	width: 250px;

	&.iconOnly {
		padding: 0;
		width: 96px;
		height: 96px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	> .icon {
		font-size: 32px;

		&.success {
			color: var(--accent);
		}

		&.waiting {
			opacity: 0.7;
		}
	}

	> .text {
		margin-top: 16px;
	}
}
</style>
