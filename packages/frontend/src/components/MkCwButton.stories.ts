/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import MkCwButton from './MkCwButton.vue';
const meta = {
	title: 'components/MkCwButton',
	component: MkCwButton,
} satisfies Meta<typeof MkCwButton>;
export const Default = {
	render(args) {
		return {
			components: {
				MkCwButton,
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
			template: '<MkCwButton v-bind="props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkCwButton>;
export default meta;
