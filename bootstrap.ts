import { spawn } from 'child_process';
import cron from 'node-cron';

let child: ReturnType<typeof spawn> | undefined;

function startChildProcess() {
  if (child) {
    child.kill();  // Kill the previous child process if it exists.
  }

  child = spawn('npm', ['start'], { shell: true });

  child.stdout.on('data', (data) => {
    console.log(data.toString());
  });

  child.stderr.on('data', (data) => {
    console.error(data.toString());
  });

  child.on('close', (code) => {
    console.log(`Child process exited with code ${code}`);
  });
}

cron.schedule('0 3 * * *', () => {
  console.log('Restarting...');
  startChildProcess();
});

startChildProcess();