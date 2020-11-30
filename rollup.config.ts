import jsonPlugin from 'rollup-plugin-json';
import typescriptPlugin from 'rollup-plugin-typescript2';

import { tmpdir } from 'os';
import { builtinModules } from 'module';
import { join as pathJoin } from 'path';

const coreModules = builtinModules.filter((name) => !/(^_|\/)/.test(name));

const cacheRoot = pathJoin(tmpdir(), '.rpt2_cache');

export default async function () {
    const modulePkg = await import(pathJoin(__dirname, 'package.json'));

    return {
        input: pathJoin('src', 'index.ts'),
        plugins: [
            jsonPlugin(),
            typescriptPlugin({
                cacheRoot,

                useTsconfigDeclarationDir: false,

                tsconfigOverride: {
                    outDir: 'lib',
                    rootDir: 'src',
                    include: ['src'],
                },
            }),
        ],
        external: [
            ...Object.keys(modulePkg.dependencies || {}),
            ...Object.keys(modulePkg.peerDependencies || {}),
            ...coreModules,
        ],
        output: [
            {
                file: pathJoin(__dirname, `${modulePkg.main}.js`),
                format: 'cjs',
                exports: 'named',
            },
        ],
    };
}
