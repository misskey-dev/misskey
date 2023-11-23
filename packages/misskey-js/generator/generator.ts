import SwaggerParser from "@apidevtools/swagger-parser";
import {OpenAPIV3} from "openapi-types";
import {writeFileSync} from "fs";
import {toPascal} from "ts-case-convert";
import openapiTS from "openapi-typescript";

function generateSchemaEntities(openApiDocs: OpenAPIV3.Document, outputPath: string): string[] {
	if (!openApiDocs.components?.schemas) {
		return []
	}

	const schemas = openApiDocs.components.schemas;
	const schemaNames = Object.keys(schemas)
	const typeAliasLines: string[] = []

	typeAliasLines.push(`import { components } from "./types.js";`)
	typeAliasLines.push(
		...schemaNames.map(it => `export type ${it} = components['schemas']['${it}'];`)
	)

	writeFileSync(outputPath, typeAliasLines.join('\n'))

	return schemaNames
}

function generateEndpoints(openApiDocs: OpenAPIV3.Document, entitiesOutputPath: string, endpointOutputPath: string): string[] {
	if (!openApiDocs.paths) {
		return []
	}

	const endpoints: Endpoint[] = []

	// misskey-jsはPOST固定で送っているので、こちらも決め打ちする。別メソッドに対応することがあればこちらも直す必要あり
	const paths = openApiDocs.paths
	const postPathItems = Object.keys(paths)
		.filter(it => paths[it]?.post)
		.map(it => paths[it]?.post!)

	for (const operation of postPathItems) {
		const endpoint = new Endpoint(operation.operationId!)
		endpoints.push(endpoint)

		if (isRequestBodyObject(operation?.requestBody) && operation.requestBody.content) {
			const reqContent = operation.requestBody.content
			const supportMediaTypes = Object.keys(reqContent)
			if (supportMediaTypes.length > 0) {
				// いまのところ複数のメディアタイプをとるエンドポイントは無いので決め打ちする
				endpoint.request = new OperationTypeAlias(
					operation.operationId!,
					supportMediaTypes[0],
					OperationsAliasType.REQUEST
				)
			}
		}

		if (isResponseObject(operation.responses['200']) && operation.responses['200'].content) {
			const resContent = operation.responses['200'].content
			const supportMediaTypes = Object.keys(resContent)
			if (supportMediaTypes.length > 0) {
				// いまのところ複数のメディアタイプを返すエンドポイントは無いので決め打ちする
				endpoint.response = new OperationTypeAlias(
					operation.operationId!,
					supportMediaTypes[0],
					OperationsAliasType.RESPONSE
				)
			}
		}
	}

	const entitiesOutputLine: string[] = []

	entitiesOutputLine.push(`import { operations } from "./types.js";`)
	entitiesOutputLine.push('')

	entitiesOutputLine.push(new EmptyTypeAlias(OperationsAliasType.REQUEST).toLine())
	entitiesOutputLine.push(new EmptyTypeAlias(OperationsAliasType.RESPONSE).toLine())
	entitiesOutputLine.push('')

	const entities = endpoints
		.flatMap(it => [it.request, it.response].filter(i => i))
		.map(it => it!)
	entitiesOutputLine.push(...entities.map(it => it!.toLine()))
	entitiesOutputLine.push('')

	writeFileSync(entitiesOutputPath, entitiesOutputLine.join('\n'))

	const endpointOutputLine: string[] = []

	endpointOutputLine.push('import type {')
	endpointOutputLine.push(
		...[emptyRequest, emptyResponse, ...entities].map(it => '  ' + it.generateName() + ',')
	)
	endpointOutputLine.push(`} from '${toImportPath(entitiesOutputPath)}';`)
	endpointOutputLine.push('')

	endpointOutputLine.push('export type Endpoints = {')
	endpointOutputLine.push(
		...endpoints.map(it => '  ' + it.toLine())
	)
	endpointOutputLine.push('};')
	entitiesOutputLine.push('')

	writeFileSync(endpointOutputPath, endpointOutputLine.join('\n'))

	return [
		'Endpoints',
		...entities.map(it => it.generateName())
	]
}

function isRequestBodyObject(value: unknown): value is OpenAPIV3.RequestBodyObject {
	if (!value) {
		return false
	}

	const {content} = value as Record<keyof OpenAPIV3.RequestBodyObject, unknown>
	return content !== undefined
}

function isResponseObject(value: unknown): value is OpenAPIV3.ResponseObject {
	if (!value) {
		return false
	}

	const {description} = value as Record<keyof OpenAPIV3.ResponseObject, unknown>
	return description !== undefined
}

function toImportPath(fileName: string, fromPath = '/src', toPath = ''): string {
	return fileName.replace(fromPath, toPath).replace('.ts', '.js')
}


enum OperationsAliasType {
	REQUEST = 'Request',
	RESPONSE = 'Response'
}

interface IOperationTypeAlias {
	readonly type: OperationsAliasType

	generateName(): string

	toLine(): string
}

class OperationTypeAlias implements IOperationTypeAlias {
	public readonly operationId: string
	public readonly mediaType: string
	public readonly type: OperationsAliasType

	constructor(
		operationId: string,
		mediaType: string,
		type: OperationsAliasType
	) {
		this.operationId = operationId
		this.mediaType = mediaType
		this.type = type
	}

	generateName(): string {
		const nameBase = this.operationId!.replaceAll('/', '-')
		return toPascal(nameBase + this.type)
	}

	toLine(): string {
		const name = this.generateName();
		return (this.type === OperationsAliasType.REQUEST)
			? `export type ${name} = operations['${this.operationId}']['requestBody']['content']['${this.mediaType}'];`
			: `export type ${name} = operations['${this.operationId}']['responses']['200']['content']['${this.mediaType}'];`
	}
}

class EmptyTypeAlias implements IOperationTypeAlias {
	readonly type: OperationsAliasType;

	constructor(type: OperationsAliasType) {
		this.type = type
	}


	generateName(): string {
		return "Empty" + this.type;
	}

	toLine(): string {
		const name = this.generateName();
		return `export type ${name} = Record<string, unknown>;`
	}
}

const emptyRequest = new EmptyTypeAlias(OperationsAliasType.REQUEST)
const emptyResponse = new EmptyTypeAlias(OperationsAliasType.RESPONSE)

class Endpoint {
	public readonly operationId: string
	public request?: IOperationTypeAlias
	public response?: IOperationTypeAlias

	constructor(operationId: string) {
		this.operationId = operationId
	}

	toLine(): string {
		const reqName = this.request?.generateName() ?? emptyRequest.generateName()
		const resName = this.response?.generateName() ?? emptyResponse.generateName()

		return `'${this.operationId}': { req: ${reqName}, res: ${resName} };`
	}
}

const openApiTs = await openapiTS("./api.json", {exportType: false})
writeFileSync('./src/types.ts', openApiTs)

const openApiDocs = await SwaggerParser.validate("./api.json") as OpenAPIV3.Document;

const modelFileName = './src/models.ts'
generateSchemaEntities(openApiDocs, modelFileName)

const entitiesFileName = './src/entities.ts'
const endpointFileName = './src/endpoint.ts'
generateEndpoints(openApiDocs, entitiesFileName, endpointFileName)

const indexLines: string[] = [
	`import { Endpoints } from '${toImportPath(endpointFileName)}';`,
	`import * as Entities from '${toImportPath(entitiesFileName)}';`,
	`import * as Models from '${toImportPath(modelFileName)}';`,
	'',
	'export { Endpoints, Entities, Models };'
]
writeFileSync('./src/index.ts', indexLines.join('\n'))
