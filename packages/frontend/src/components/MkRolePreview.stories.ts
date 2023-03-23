/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import MkRolePreview from './MkRolePreview.vue';
const meta = {
	title: 'components/MkRolePreview',
	component: MkRolePreview,
} satisfies Meta<typeof MkRolePreview>;
export const Default = {
	render(args) {
		return {
			components: {
				MkRolePreview,
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
			template: '<MkRolePreview v-bind="props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkRolePreview>;
export default meta;
