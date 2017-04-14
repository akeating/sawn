'use strict';

const sawn = require('../');
const inspect = require('util').inspect;

sawn()
.run({ cmd: 'ls', args: ['-lah', '.'] })
.run({ cmd: 'echo', args: ['foo'] })
.then(() => {
  console.log('test/runner.js completed');
})
.catch(err => {
  console.log(inspect(err));
  process.exit(1);
});
