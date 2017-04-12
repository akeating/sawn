'use strict';

const { spawn, spawnSync } = require('child_process');
const { Transform } = require('stream');
const inspect = require('util').inspect;

module.exports = Builder;

function Builder(env) {
  env = env || process.env;

  const jobList = [];

  const api = { run, then };

  return api;

  function run({ label, cwd, cmd, args, stream, waitFor, keepalive }) {
    cwd = cwd || process.cwd();
    args = args || [];
    stream = stream || new PassThroughTransform();
    const close = () => {}
    jobList.push({ label, cwd, cmd, args, stream, waitFor, keepalive, close });
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

  function runAsync ({ label, cwd, cmd, args, stream, waitFor, keepalive }) {
    const childProcess = spawn(cmd, args, {
      stdio: [stream.stdin, stream.stdout, stream.stderr],
      env,
      cwd
    });

    let exited = false;

    const promise = new Promise((resolve, reject) => {
      childProcess.on('exit', (code) => {
        exited = true;
        if (code) {
          reject(new Error(`${label} ${cmd} exited with non-zero code`));
        } else {
          resolve();
        }
      });

      childProcess.on('error', (err) => {
        reject(err);
      });

      childProcess.stdout.on('data', (chunk) => {
        const lines = chunk.toString().trim().split('\n');
        lines.forEach(line => {
          console.log(`${label}: ${line.trim()}`);
          if (waitFor && line.match(waitFor)) {
            resolve();
          }
        });
      });

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

class PassThroughTransform extends Transform {
  constructor() {
    super();
  }
  _transform(chunk, encoding, callback) {
    this.push(chunk);
    callback();
  };
}
