// Ejecuta varios espacios de trabajo sin dependencias externas.
import { spawn } from 'node:child_process';

const action = process.argv[2] === 'start' ? 'start' : 'dev';
const target = process.argv[3] || 'all';
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const services = [
  ['gateway', '@miaservicios/api-gateway'],
  ['auth', '@miaservicios/auth-service'],
  ['ai', '@miaservicios/ai-service'],
  ['history', '@miaservicios/history-service']
];
const commands = [];

if (['all', 'backend', 'local'].includes(target)) {
  services.forEach(([name, workspace]) => commands.push({
    name,
    command: npmCommand,
    args: ['run', action, `--workspace=${workspace}`]
  }));
}

if (target === 'all') {
  commands.push({
    name: 'web',
    command: npmCommand,
    args: ['run', 'dev', '--workspace=@miaservicios/frontend']
  });
}

if (target === 'local') {
  commands.push({
    name: 'web',
    command: npmCommand,
    args: ['run', 'serve:docs']
  });
}

if (!commands.length) {
  console.error('No se encontraron procesos para iniciar.');
  process.exit(1);
}

const children = new Set();
let stopping = false;

const stopAll = (signal = 'SIGTERM', exitCode = 0) => {
  if (stopping) return;
  stopping = true;
  for (const child of children) {
    if (!child.killed) child.kill(signal);
  }
  setTimeout(() => process.exit(exitCode), 1200).unref();
};

for (const item of commands) {
  const child = spawn(item.command, item.args, {
    cwd: process.cwd(),
    env: process.env,
    stdio: ['inherit', 'pipe', 'pipe'],
    windowsHide: false
  });
  children.add(child);

  const write = (stream, chunk) => {
    const lines = String(chunk).split(/\r?\n/);
    lines.forEach((line, index) => {
      if (line || index < lines.length - 1) stream.write(`[${item.name}] ${line}\n`);
    });
  };

  child.stdout.on('data', (chunk) => write(process.stdout, chunk));
  child.stderr.on('data', (chunk) => write(process.stderr, chunk));
  child.on('error', (error) => {
    console.error(`[${item.name}] ${error.message}`);
    stopAll('SIGTERM', 1);
  });
  child.on('exit', (code, signal) => {
    children.delete(child);
    if (!stopping && code !== 0) {
      console.error(`[${item.name}] finalizo con codigo ${code ?? signal}.`);
      stopAll('SIGTERM', code || 1);
    }
  });
}

process.on('SIGINT', () => stopAll('SIGINT'));
process.on('SIGTERM', () => stopAll('SIGTERM'));
