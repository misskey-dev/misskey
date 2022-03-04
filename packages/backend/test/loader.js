import path from 'path'
import typescript from 'typescript'
import { createMatchPath } from 'tsconfig-paths'
import { resolve as BaseResolve, getFormat, transformSource } from 'ts-node/esm'

const { readConfigFile, parseJsonConfigFileContent, sys } = typescript

const __dirname = path.dirname(new URL(import.meta.url).pathname)

const configFile = readConfigFile('./test/tsconfig.json', sys.readFile)
if (typeof configFile.error !== 'undefined') {
  throw new Error(`Failed to load tsconfig: ${configFile.error}`)
}

const { options } = parseJsonConfigFileContent(
  configFile.config,
  {
    fileExists: sys.fileExists,
    readFile: sys.readFile,
    readDirectory: sys.readDirectory,
    useCaseSensitiveFileNames: true,
  },
  __dirname
)

export { getFormat, transformSource }  // こいつらはそのまま使ってほしいので re-export する

const matchPath = createMatchPath(options.baseUrl, options.paths)

export async function resolve(specifier, context, defaultResolve) {
  const matchedSpecifier = matchPath(specifier.replace('.js', '.ts'))
  return BaseResolve(  // ts-node/esm の resolve に tsconfig-paths で解決したパスを渡す
    matchedSpecifier ? `${matchedSpecifier}.ts` : specifier,
    context,
    defaultResolve
  )
}
