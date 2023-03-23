/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import MkVisibilityPicker from './MkVisibilityPicker.vue';
const meta = {
	title: 'components/MkVisibilityPicker',
	component: MkVisibilityPicker,
} satisfies Meta<typeof MkVisibilityPicker>;
export const Default = {
	render(args) {
		return {
			components: {
				MkVisibilityPicker,
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
			template: '<MkVisibilityPicker v-bind="props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkVisibilityPicker>;
export default meta;
