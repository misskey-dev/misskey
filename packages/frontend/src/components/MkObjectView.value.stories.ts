/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import MkObjectView_value from './MkObjectView.value.vue';
const meta = {
	title: 'components/MkObjectView.value',
	component: MkObjectView_value,
} satisfies Meta<typeof MkObjectView_value>;
export const Default = {
	render(args) {
		return {
			components: {
				MkObjectView_value,
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
			template: '<MkObjectView_value v-bind="props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkObjectView_value>;
export default meta;
