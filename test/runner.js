'use strict';

const sawn = require('../');
const inspect = require('util').inspect;

sawn()
.run({ label: 'command1', cmd: 'ls', args: ['-lah', '.'] })
.run({ label: 'command2', cmd: 'echo', args: ['foo'] })
.then(() => {
  console.log('Done');
})
.catch(err => {
  console.log(inspect(err));
});
