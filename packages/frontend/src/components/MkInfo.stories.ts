/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import MkInfo from './MkInfo.vue';
const meta = {
	title: 'components/MkInfo',
	component: MkInfo,
} satisfies Meta<typeof MkInfo>;
export const Default = {
	render(args) {
		return {
			components: {
				MkInfo,
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
			template: '<MkInfo v-bind="props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkInfo>;
export default meta;
