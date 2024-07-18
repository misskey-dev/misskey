
export type JsonValue = JsonArray | JsonObject | string | number | boolean | null;
export type JsonObject = {[K in string]?: JsonValue};
export type JsonArray = JsonValue[];
