<template>
<MkModal ref="modal" @click="success ? done() : () => {}" @closed="$emit('closed')">
	<div class="iuyakobc" :class="{ iconOnly: (text == null) || success }">
		<Fa class="icon success" v-if="success" :icon="faCheck"/>
		<Fa class="icon waiting" v-else :icon="faSpinner" pulse/>
		<div class="text" v-if="text && !success">{{ text }}<MkEllipsis/></div>
	</div>
</MkModal>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faCheck, faSpinner } from '@fortawesome/free-solid-svg-icons';
import MkModal from '@client/components/ui/modal.vue';

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
			faCheck, faSpinner,
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

		> .icon {
			height: 100%;
		}
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
