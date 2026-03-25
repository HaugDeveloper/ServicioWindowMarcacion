const fs   = require('fs');
const path = require('path');

  // Función para copiar archivos y directorios recursivamente
function copyRecursiveSync(src, dest) {
  const exists      = fs.existsSync(src);
  const stats       = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();
  
  if (isDirectory) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    fs.readdirSync(src).forEach(childItemName => {
      copyRecursiveSync(
        path.join(src, childItemName),
        path.join(dest, childItemName)
      );
    });
  } else {
    const destDir = path.dirname(dest);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    fs.copyFileSync(src, dest);
    console.log(`Copiado: ${src} -> ${dest}`);
  }
}

  // La raíz del proyecto (donde está package.json)
const projectRoot = path.join(__dirname, '..', '..');
console.log('Project Root:', projectRoot);

  // Verificar que estamos en el directorio correcto
if (!fs.existsSync(path.join(projectRoot, 'src'))) {
  console.error('Error: No se encontró el directorio src en', projectRoot);
  process.exit(1);
}

  // Copiar archivos generados por TypeScript (ya están en dist por tsc)
  // Pero necesitamos copiar archivos adicionales que no son .ts

  // 1. Copiar archivos de configuración y recursos estáticos

  // Copiar .env a dist
const envSource = path.join(projectRoot, '.env');
const envDest   = path.join(projectRoot, 'dist', '.env');
if (fs.existsSync(envSource)) {
  fs.copyFileSync(envSource, envDest);
  console.log('.env copiado a dist/.env');
}

  // Copiar package.json a dist
const packageSource = path.join(projectRoot, 'package.json');
const packageDest   = path.join(projectRoot, 'dist', 'package.json');
if (fs.existsSync(packageSource)) {
  fs.copyFileSync(packageSource, packageDest);
  console.log('package.json copiado a dist/package.json');
}

  // Copiar package-lock.json a dist
const packageLockSource = path.join(projectRoot, 'package-lock.json');
const packageLockDest   = path.join(projectRoot, 'dist', 'package-lock.json');
if (fs.existsSync(packageLockSource)) {
  fs.copyFileSync(packageLockSource, packageLockDest);
  console.log('package-lock.json copiado a dist/package-lock.json');
}

  // Copiar iisnode.yml a dist
const iisnodeSource = path.join(projectRoot, 'iisnode.yml');
const iisnodeDest   = path.join(projectRoot, 'dist', 'iisnode.yml');
if (fs.existsSync(iisnodeSource)) {
  fs.copyFileSync(iisnodeSource, iisnodeDest);
  console.log('iisnode.yml copiado a dist/iisnode.yml');
}

  // 2. Copiar directorios de recursos estáticos

  // Copiar src/assets a dist/assets
const assetsSource = path.join(projectRoot, 'src', 'assets');
const assetsDest   = path.join(projectRoot, 'dist', 'assets');
if (fs.existsSync(assetsSource)) {
  copyRecursiveSync(assetsSource, assetsDest);
  console.log('assets copiado a dist/assets');
}

  // Copiar src/public a dist/public
const publicSource = path.join(projectRoot, 'src', 'public');
const publicDest   = path.join(projectRoot, 'dist', 'public');
if (fs.existsSync(publicSource)) {
  copyRecursiveSync(publicSource, publicDest);
  console.log('public copiado a dist/public');
}

  // Copiar src/template a dist/template
const templateSource = path.join(projectRoot, 'src', 'template');
const templateDest   = path.join(projectRoot, 'dist', 'template');
if (fs.existsSync(templateSource)) {
  copyRecursiveSync(templateSource, templateDest);
  console.log('template copiado a dist/template');
}

  // Copiar src/emails a dist/emails (plantillas Pug)
const emailsSource = path.join(projectRoot, 'src', 'emails');
const emailsDest   = path.join(projectRoot, 'dist', 'emails');
if (fs.existsSync(emailsSource)) {
  copyRecursiveSync(emailsSource, emailsDest);
  console.log('emails copiado a dist/emails');
}

  // Copiar src/cert a dist/cert (certificados)
const certSource = path.join(projectRoot, 'src', 'cert');
const certDest   = path.join(projectRoot, 'dist', 'cert');
if (fs.existsSync(certSource)) {
  copyRecursiveSync(certSource, certDest);
  console.log('cert copiado a dist/cert');
}

  // Crear directorio logs en dist (para que la app pueda escribir logs)
const logsDest = path.join(projectRoot, 'dist', 'logs');
if (!fs.existsSync(logsDest)) {
  fs.mkdirSync(logsDest, { recursive: true });
  console.log('Directorio logs creado en dist/logs');
}

  // Crear subdirectorios de logs
const logsAdmsDest = path.join(logsDest, 'adms');
const logsCronDest = path.join(logsDest, 'cron');
if (!fs.existsSync(logsAdmsDest)) {
  fs.mkdirSync(logsAdmsDest, { recursive: true });
}
if (!fs.existsSync(logsCronDest)) {
  fs.mkdirSync(logsCronDest, { recursive: true });
}

  // Crear directorio temp en dist
const tempDest = path.join(projectRoot, 'dist', 'temp');
if (!fs.existsSync(tempDest)) {
  fs.mkdirSync(tempDest, { recursive: true });
  console.log('Directorio temp creado en dist/temp');
}

  // Copiar service.js a dist
const serviceSource = path.join(projectRoot, 'src', 'general');
const serviceDest   = path.join(projectRoot, 'dist');
if (fs.existsSync(serviceSource)) {
  copyRecursiveSync(serviceSource, serviceDest);
  console.log('service.js copiado a dist/service.js');
}

console.log('Proceso de copiado de assets completado');