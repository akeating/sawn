# sawn

Sawn makes it easy to write `node` scripts with promises. The initial use case was inspired by a devops need to run end-to-end tests in a more concise manner, but it would be possible to utilize sawn in other ways. The api is not yet stable, but seems to work well for the devops use cases I needed it for.

```
npm install --save-dev sawn
```
#### Example: simple
```
const sawn = require('sawn');

sawn()
.run({ cmd: 'echo', args: ['foo'] })
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

// child processes execute and resolve serially
.run({ cwd: 'apps/domain', cmd: 'mix', args: ['ecto.reset'] })

// This child process will not start until the previous one is done
.run({ cwd: 'apps/interface', cmd: 'npm', args: ['run', 'webpack-test-e2e'] })

// waitFor resolves the promise early when the given regex matches a chunk on stdout. This
// way protractor has a server to query.
.run({ cwd: 'apps/interface', cmd: 'mix', args: ['s'], waitFor: /Running/ })

// Both the server and protractor will run together
.run({ cwd: 'apps/interface', cmd: 'node_modules/.bin/protractor', args: [] })

// The child processes are queued and then run serially (until configured otherwise) when
// then is called, but the then returns a promise that will not resolve until all processes have ended.
.then(() => {
  // At this point the outstanding server (mix s) child process has been killed.
  console.log('e2e-complete');
})
.catch(err => {
  console.log(err);

  // The user determines whether to exit the process here, which would make sense for a build script.
  // In other use-cases, you might decide not to exit the process but handle the error in another way.
  process.exit(1);
});
```

#### Example: run client unit tests in your project

Save the following to `runner.js`:
```
const sawn = require('sawn');

const args = process.argv.slice(2);
const env = process.env;

console.log('client-unit-begin');

const karma = { cwd: '.', cmd: 'node_modules/.bin/karma', args: ['start', '--single-run'] };
const karmaWatch = { cwd: '.', cmd: 'node_modules/.bin/karma', args: ['start'] };

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
  process.exit(1);
});

```
