// const transform = require("fuse-test-runner").wallabyFuseTestLoader;
const path = require('path');
const jsxtransform = require('jsx-controls-loader').loader;

module.exports = function(wallaby) {
  // var load = require;

  return {
    files: [
      'src/**/*.ts*',
      '!src/**/*.test.tsx',
      '!src/**/*.test.ts',
      '!src/**/*.d.ts*'
    ],
    // debug: true,
    tests: [
      'src/**/*.test.ts',
      'src/**/*.test.tsx'
    ],
    compilers: {
      '**/*.ts?(x)': wallaby.compilers.typeScript({ jsx: 'react', module: 'commonjs' })
    },
    env: {
      type: 'node'
      // runner: '/usr/local/bin/node'
    },
    workers: {
      initial: 1,
      regular: 1
    },
    /* parallelism may break some tests due to db consistency */
    // workers: {
    //   initial: 1,
    //   regular: 1,
    //   recycle: true
    // },
    delays: {
      run: 200
    },
    testFramework: 'mocha',
    setup: function(wallaby) {
      require('wafl').setup({ wallaby });
    }
  };
};
