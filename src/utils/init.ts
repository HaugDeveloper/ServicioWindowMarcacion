import fs from 'fs';
import path from 'path';

export const initializeApp = () => {
  console.log('======================================');
  console.log('🔧 Inicializando aplicación...');
  console.log('======================================');
  
  // Crear directorios necesarios
  const dirs = [
    path.join(__dirname, '../../logs'),
    path.join(__dirname, '../../logs/marcaciones'),
    path.join(__dirname, '../../logs/raw'),
    path.join(__dirname, '../../public')
  ];
  
  dirs.forEach(dir => {
    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`📁 Directorio creado: ${path.relative(process.cwd(), dir)}`);
      }
    } catch (error) {
      console.error(`❌ Error creando directorio ${dir}:`, error);
    }
  });
  
  // Verificar permisos de escritura
  const testFile = path.join(__dirname, '../../logs/test-write.tmp');
  try {
    fs.writeFileSync(testFile, 'test');
    fs.unlinkSync(testFile);
    console.log('✅ Permisos de escritura OK');
  } catch (error) {
    console.error('❌ Error: No hay permisos de escritura en logs/');
    console.error('   Por favor, verifica los permisos de la carpeta');
  }
  
  console.log('======================================\n');
};