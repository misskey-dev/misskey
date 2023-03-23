/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import MkModal from './MkModal.vue';
const meta = {
	title: 'components/MkModal',
	component: MkModal,
} satisfies Meta<typeof MkModal>;
export const Default = {
	render(args) {
		return {
			components: {
				MkModal,
			},
			setup() {
				return {
					args,
				};
			},
			computed: {
				props() {
					return {
						...args,
					};
				},
			},
			template: '<MkModal v-bind="props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkModal>;
export default meta;
