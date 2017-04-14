'use strict';

const { spawn, spawnSync } = require('child_process');

module.exports = Builder;

function Builder(env) {
  env = env || process.env;

  const jobList = [];

  const api = { run, then };

  return api;

  function run({ cwd, cmd, args, waitFor, keepalive }) {
    cwd = cwd || process.cwd();
    args = args || [];
    const close = () => {}
    jobList.push({ cwd, cmd, args, waitFor, keepalive, close });
    return api;
  };

  function then(handler) {
    let p = Promise.resolve();
    jobList.forEach(job => {
      p = p.then(() => {
        const { promise, close } = runAsync(job);
        job.close = close;
        return promise;
      });
    });
    return p
      .then(() => {
        closeAll();
      })
      .then(handler)
      .catch(err => {
        closeAll();
        return Promise.reject(err);
      });
  }

  function runAsync ({ cwd, cmd, args, waitFor, keepalive }) {
    const childProcess = spawn(cmd, args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      env,
      cwd
    });

    let exited = false;

    const promise = new Promise((resolve, reject) => {
      childProcess.on('exit', (code) => {
        exited = true;
        if (code) {
          reject(new Error(`${cmd} exited with non-zero code`));
        } else {
          resolve();
        }
      });

      childProcess.on('error', (err) => {
        reject(err);
      });

      childProcess.stdout.on('data', (chunk) => {
        if (waitFor && chunk.toString().match(waitFor)) {
          resolve();
        }
      });

      childProcess.stderr.pipe(process.stderr);
      childProcess.stdout.pipe(process.stdout);

      if (keepalive && !waitFor) {
        resolve();
      }
    });

    const close = () => {
      if (!keepalive && !exited) {
        childProcess.kill();
      }
    }

    return { promise, close };
  }

  function closeAll() {
    jobList.forEach((job) => job.close());
  }
}
