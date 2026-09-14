import { spawn } from 'node:child_process';

// Next utilise --hostname ; les aperçus supervisés transmettent --host.
// Next refuse déjà un port occupé : --strictPort n’a pas d’équivalent nécessaire.
const args = process.argv.slice(2)
  .filter((arg) => arg !== '--strictPort')
  .map((arg) => arg === '--host' ? '--hostname' : arg);
const child = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'dev', ...args], {
  stdio: 'inherit',
  env: process.env,
});
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => child.kill(signal));
}
child.on('error', (error) => { console.error(error.message); process.exitCode = 1; });
child.on('exit', (code) => { process.exitCode = code ?? 1; });
