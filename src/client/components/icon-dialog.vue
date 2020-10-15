<template>
<MkModal ref="modal" @click="type === 'success' ? done() : () => {}" @closed="$emit('closed')">
	<div class="iuyakobc" :class="type">
		<Fa class="icon" v-if="type === 'success'" :icon="faCheck"/>
		<Fa class="icon" v-else-if="type === 'waiting'" :icon="faSpinner" pulse/>
	</div>
</MkModal>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faCheck, faSpinner } from '@fortawesome/free-solid-svg-icons';
import MkModal from '@/components/ui/modal.vue';

export default defineComponent({
	components: {
		MkModal,
	},

	props: {
		type: {
			required: true
		},
		showing: {
			required: true
		}
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
	width: initial;
	font-size: 32px;

	&.success {
		color: var(--accent);
	}

	&.waiting {
		> .icon {
			opacity: 0.7;
		}
	}
}
</style>
