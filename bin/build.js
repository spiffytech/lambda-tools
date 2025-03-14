#!/usr/bin/env node
const path = require('path');
const chalk = require('chalk');

const { build } = require('../src/lambda');

const epilog = `
Each entrypoint is a single source file that represents the top-level module for
the bundle being produced. By default, the resulting bundle will use the
basename of the entrypoint as the bundle name. If a :name suffix is provided
then the name value will be used as the bundle name instead. For example,
src/app.js:lambda.js would use src/app.js as the entrypoint and produce a bundle
named lambda.js in the output directory.
`;

const argv = require('yargs')
  .usage('$0 [<options>] <entrypoint[:name]>...')
  .option('d', {
    alias: 'dns-retry',
    describe: 'enable automatic retries for DNS lookups',
    type: 'boolean'
  })
  .option('n', {
    alias: 'node-version',
    describe: 'the version of node that the bundle should be optimized for (default 6.10)',
    type: 'string'
  })
  .option('disable-runtime-source-maps', {
    describe: 'disable support for runtime source maps but still generate source maps',
    type: 'boolean',
    default: false
  })
  .option('o', {
    alias: 'output-directory',
    describe: 'the path where the bundle will be produced (default: cwd)',
    type: 'string'
  })
  .option('s', {
    alias: 'service-name',
    describe: 'the name of the service the bundle is for',
    type: 'string'
  })
  .option('skip-minification', {
    describe: 'disable minification of bundled code',
    type: 'boolean',
    default: false
  })
  .option('w', {
    alias: 'webpack-transform',
    describe: 'a module that exports a function to transform the webpack configuration',
    type: 'string'
  })
  .option('z', {
    alias: 'zip',
    describe: 'zip the JS bundle (default false)',
    type: 'boolean'
  })
  .option('t', {
    alias: 'tsconfig',
    describe: 'relative path to a tsconfig.json file to compile typescript',
    type: 'string'
  })
  .demandCommand(1)
  .epilog(epilog)
  .argv;

const buildOptions = {
  enableDnsRetry: argv.d,
  entrypoint: argv._,
  nodeVersion: argv.n,
  outputPath: argv.o,
  skipMinification: argv['skip-minification'],
  serviceName: argv.s,
  zip: argv.z,
  tsconfig: argv.t,
  enableRuntimeSourceMaps: !argv['disable-runtime-source-maps']
};

if (argv.t) {
  // assert typescript and ts-loader are installed
  ['typescript', 'ts-loader'].forEach(dependency => {
    try {
      require.resolve(dependency);
    } catch (_) {
      console.error(chalk.bold.red(`It looks like you're trying to use TypeScript but do not have '${chalk.bold(
        dependency
      )}' installed. Please install it or remove the tsconfig flag.`));
      process.exit(1);
    }
  });
}

if (argv.w) {
  // Ignore the non-literal module require because the module to load is
  // expected to come from the caller of the command
  // eslint-disable-next-line security/detect-non-literal-require
  const transformFunction = require(path.join(process.cwd(), argv.w));
  const transformType = typeof transformFunction;
  if (transformType !== 'function') {
    throw new Error(`The webpack transform module should export a function, but the exported type was ${transformType}`);
  }
  buildOptions.configTransformer = transformFunction;
}

build(buildOptions)
  .catch((error) => {
    if (error.message === 'compilation_error') {
      console.error('An error occurred during compilation. See output above for more details.');
    } else {
      console.error('Failed to build lambda package:', error);
    }
    process.exitCode = 1;
  });
