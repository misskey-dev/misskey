/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import MkContainer from './MkContainer.vue';
const meta = {
	title: 'components/MkContainer',
	component: MkContainer,
} satisfies Meta<typeof MkContainer>;
export const Default = {
	render(args) {
		return {
			components: {
				MkContainer,
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
			template: '<MkContainer v-bind="props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkContainer>;
export default meta;
