/* eslint-disable import/no-extraneous-dependencies */
import jsonPlugin from 'rollup-plugin-json';
import commonjsPlugin from 'rollup-plugin-commonjs';
import typescriptPlugin from 'rollup-plugin-typescript2';
import nodeResolvePlugin from 'rollup-plugin-node-resolve';
/* eslint-enable import/no-extraneous-dependencies */

import { tmpdir } from 'os';
// @ts-ignore
import { builtinModules } from 'module';
import { join as pathJoin } from 'path';

const coreModules = builtinModules.filter(name => (
	!/(^_|\/)/.test(name)
));

const cacheRoot = pathJoin(tmpdir(), '.rpt2_cache');


export default async function () {
    const modulePkg = await import(pathJoin(__dirname, 'package.json'));

    return {
        input: pathJoin('src', 'index.ts'),
        plugins: [
            nodeResolvePlugin(),
            commonjsPlugin(),
            jsonPlugin(),
            typescriptPlugin({
                cacheRoot,

                rollupCommonJSResolveHack: true,
                useTsconfigDeclarationDir: false,

                tsconfigOverride: {
                    outDir: 'lib',
                    rootDir: 'src',
                    include: ['src']
                }
            })
        ],
        external: [
            ...Object.keys(modulePkg.dependencies || {}),
            ...coreModules
        ],
        output: [
            {
                file: pathJoin(__dirname, `${modulePkg.main}.js`),
                format: 'cjs',
                exports: 'named'
            },
            {
                file: pathJoin(__dirname, `${modulePkg.main}.mjs`),
                format: 'esm'
            }
        ]
    };
}
