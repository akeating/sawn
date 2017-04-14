# sawn

Sawn makes it easy to write `node` scripts with promises. The initial use case was inspired by a devops need to run end-to-end tests in a more concise manner, but it would be possible to utilize sawn in other ways. The api is not yet stable, but seems to work well for the devops use cases I needed it for.

```
npm install --save-dev sawn
```
#### Example: simple
```
const sawn = require('sawn');

sawn()
.run({ label: 'echo-command', cmd: 'echo', args: ['foo'] })
.then(() => {
  // console.log('Done');
})
.catch(err => {
  console.log(err);
});
```

```
echo-command: foo
```

#### Example: run e2e tests in your project

```
const sawn = require('sawn');

const env = process.env;
env.MIX_ENV = 'teste2e';

console.log('e2e-begin');

sawn(env)
.run({ label: 'seed-database', cwd: 'apps/domain', cmd: 'mix', args: ['ecto.reset'] })
.run({ label: 'compile-javascript', cwd: 'apps/interface', cmd: 'npm', args: ['run', 'webpack-test-e2e'] })
.run({ label: 'start-test-server', cwd: 'apps/interface', cmd: 'mix', args: ['s'], waitFor: /Running/ })
.run({ label: 'start-protractor', cwd: 'apps/interface', cmd: 'node_modules/.bin/protractor', args: [] })
.then(() => {
  console.log('e2e-complete');
})
.catch(err => {
  console.log(err);
});
```

#### Example: run client unit tests in your project

Save the following to `runner.js`:
```
const sawn = require('sawn');

const args = process.argv.slice(2);
const env = process.env;

console.log('client-unit-begin');

const karma = { label: 'karma', cwd: '.', cmd: 'node_modules/.bin/karma', args: ['start', '--single-run'] };
const karmaWatch = { label: 'karma-watch', cwd: '.', cmd: 'node_modules/.bin/karma', args: ['start'] };

let selection = karma;
if (args.length && args[0] === '--watch') {
  selection = karmaWatch;
}

sawn(env)
.run(selection)
.then(() => {
  console.log('client-unit-complete');
})
.catch(err => {
  console.log(err);
});

```
