const { Service } = require('node-windows');
const fs          = require('fs');
const path        = require('path');
const { execSync } = require('child_process');

const SERVICE_NAME = 'HaugMarcacionesServiceWindows';
const BASE_PATH    = 'C:\\inetpub\\wwwroot\\HaugMarcacionesServiceWindows';
const SCRIPT_PATH  = path.join(BASE_PATH, 'app.js');
const LOG_DIR      = path.join(BASE_PATH, 'logs');
const LOG_FILE     = path.join(LOG_DIR, 'servicio.txt');

// Crear carpeta logs
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

// Logger
function log(msg) {
  const fecha = new Date().toLocaleString(); // hora local
  fs.appendFileSync(LOG_FILE, `[${fecha}] ${msg}\n`);
}

// LIMPIAR PROCESOS ZOMBIE
function killProcesses() {
  try {
    execSync(`taskkill /F /IM ${SERVICE_NAME}.exe`, { stdio: 'ignore' });
  } catch {}

  try {
    execSync(`taskkill /F /IM node.exe`, { stdio: 'ignore' });
  } catch {}
}

// ELIMINAR SERVICIO FORZADO
function forceDeleteService() {
  try {
    execSync(`sc stop ${SERVICE_NAME}`, { stdio: 'ignore' });
  } catch {}

  try {
    execSync(`sc delete ${SERVICE_NAME}`, { stdio: 'ignore' });
  } catch {}
}

// Crear servicio
const svc = new Service({
  name       : SERVICE_NAME,
  description: 'Servicio de marcaciones Haug en Node.js',
  script     : SCRIPT_PATH,

  startType: 'delayed-auto',

  nodeOptions: [
    '--max_old_space_size=4096'
  ],

  wait      : 2,
  grow      : 0.5,
  maxRetries: 999,

  // IMPORTANTE
  stopparentfirst: true
});

// Eventos
svc.on('install', () => {
  log('Servicio instalado');
  console.log('Servicio instalado');
  svc.start();
});

svc.on('start', () => {
  log('Servicio iniciado');
  console.log('Servicio iniciado');
});

svc.on('stop', () => {
  log('Servicio detenido');
  console.log('Servicio detenido');
});

svc.on('uninstall', () => {
  log('Servicio desinstalado');
  console.log('Servicio desinstalado');
});

svc.on('alreadyinstalled', () => {
  log('Ya estaba instalado');
  console.log('Ya está instalado');
});

svc.on('invalidinstallation', () => {
  log('Instalación inválida');
  console.log('Instalación inválida');
});

process.on('uncaughtException', (err) => {

  if (err.code === 'EBUSY') {
    log('Detectado EBUSY → aplicando limpieza forzada...');

    try {
      execSync(`taskkill /F /IM ${SERVICE_NAME}.exe`, { stdio: 'ignore' });
    } catch {}

    try {
      execSync(`taskkill /F /IM node.exe`, { stdio: 'ignore' });
    } catch {}

    try {
      execSync(`sc stop ${SERVICE_NAME}`, { stdio: 'ignore' });
    } catch {}

    try {
      execSync(`sc delete ${SERVICE_NAME}`, { stdio: 'ignore' });
    } catch {}

    log('Servicio eliminado forzadamente');
    process.exit(0);
  }

  throw err;
});

// ===============================
// ACCIONES
// ===============================
const action = process.argv[2];

switch (action) {

  case 'install':
    log('Instalando servicio...');
    svc.install();
    break;

  case 'uninstall':
    log('Desinstalando servicio...');

    try {
      svc.stop();
    } catch {}

    setTimeout(() => {

      try {
        svc.uninstall();
      } catch (err) {
        log('Error normal uninstall, aplicando FORCE...');

        try {
          execSync(`taskkill /F /IM ${SERVICE_NAME}.exe`, { stdio: 'ignore' });
        } catch {}

        try {
          execSync(`taskkill /F /IM node.exe`, { stdio: 'ignore' });
        } catch {}

        try {
          execSync(`sc stop ${SERVICE_NAME}`, { stdio: 'ignore' });
        } catch {}

        try {
          execSync(`sc delete ${SERVICE_NAME}`, { stdio: 'ignore' });
        } catch {}

        log('Force remove aplicado');
      }

    }, 3000);

    break;

  case 'start':
    log('Iniciando servicio...');
    svc.start();
    break;

  case 'stop':
    log('Deteniendo servicio...');
    svc.stop();
    break;

  case 'restart':
    log('Reiniciando servicio...');
    svc.stop();
    setTimeout(() => svc.start(), 3000);
    break;

  case 'reinstall':
    log('REINSTALACIÓN COMPLETA...');

    // LIMPIEZA TOTAL
    forceDeleteService();
    killProcesses();

    setTimeout(() => {
      svc.install();
    }, 3000);

    break;

  case 'force-remove':
    log('FORCE REMOVE (nivel dios)...');

    forceDeleteService();
    killProcesses();

    break;

  default:
    console.log(`
Uso:
  node servicio.js install
  node servicio.js uninstall
  node servicio.js start
  node servicio.js stop
  node servicio.js restart
  node servicio.js reinstall
  node servicio.js force-remove
    `);
}