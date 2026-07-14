import { Client } from 'ssh2';
import { readFileSync } from 'fs';
import { join } from 'path';

const VPS_HOST = '31.97.67.131';
const VPS_USER = 'root';
const VPS_PASSWORD = 'Zevorik@2024';
const REMOTE_DIR = '/root/zevorik-trading';

const commands = [
  // Pull latest code from GitHub
  `cd ${REMOTE_DIR} && git pull origin main`,
  
  // Install dependencies
  `cd ${REMOTE_DIR} && npm install`,
  
  // Push database schema
  `cd ${REMOTE_DIR} && npx prisma db push`,
  
  // Build the project
  `cd ${REMOTE_DIR} && npm run build`,
  
  // Restart the service
  `cd ${REMOTE_DIR} && pm2 restart zevorik || pm2 start npm --name zevorik -- start`,
  
  // Save pm2 config
  `pm2 save`,
];

const conn = new Client();

conn.on('ready', () => {
  console.log('✅ Connected to VPS!');
  
  let commandIndex = 0;
  
  const runNextCommand = () => {
    if (commandIndex >= commands.length) {
      console.log('\n✅ Deployment complete!');
      conn.end();
      return;
    }
    
    const cmd = commands[commandIndex];
    console.log(`\n▶ Running [${commandIndex + 1}/${commands.length}]: ${cmd}`);
    
    conn.exec(cmd, (err, stream) => {
      if (err) {
        console.error(`❌ Error: ${err.message}`);
        commandIndex++;
        runNextCommand();
        return;
      }
      
      let output = '';
      stream.on('data', (data) => {
        output += data.toString();
        process.stdout.write(data.toString());
      });
      
      stream.stderr.on('data', (data) => {
        process.stderr.write(data.toString());
      });
      
      stream.on('close', (code) => {
        if (code === 0) {
          console.log(`✅ Command completed successfully`);
        } else {
          console.log(`⚠️ Command exited with code ${code}`);
        }
        commandIndex++;
        runNextCommand();
      });
    });
  };
  
  runNextCommand();
});

conn.on('error', (err) => {
  console.error('❌ SSH Connection Error:', err.message);
  process.exit(1);
});

console.log(`Connecting to ${VPS_USER}@${VPS_HOST}...`);
conn.connect({
  host: VPS_HOST,
  port: 22,
  username: VPS_USER,
  password: VPS_PASSWORD,
  readyTimeout: 15000,
  connectTimeout: 15000,
});
