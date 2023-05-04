import type { JSONSchema7Definition } from 'schema-type';
export const IdSchema = {
    $id: 'https://misskey-hub.net/api/schemas/Id',
    type: 'string',
    format: 'id',
    examples: 'xxxxxxxxxx',
} as const satisfies JSONSchema7Definition;
