"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeApp = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const initializeApp = () => {
    console.log('======================================');
    console.log('🔧 Inicializando aplicación...');
    console.log('======================================');
    // Crear directorios necesarios
    const dirs = [
        path_1.default.join(__dirname, '../../logs'),
        path_1.default.join(__dirname, '../../logs/marcaciones'),
        path_1.default.join(__dirname, '../../logs/raw'),
        path_1.default.join(__dirname, '../../public')
    ];
    dirs.forEach(dir => {
        try {
            if (!fs_1.default.existsSync(dir)) {
                fs_1.default.mkdirSync(dir, { recursive: true });
                console.log(`📁 Directorio creado: ${path_1.default.relative(process.cwd(), dir)}`);
            }
        }
        catch (error) {
            console.error(`❌ Error creando directorio ${dir}:`, error);
        }
    });
    // Verificar permisos de escritura
    const testFile = path_1.default.join(__dirname, '../../logs/test-write.tmp');
    try {
        fs_1.default.writeFileSync(testFile, 'test');
        fs_1.default.unlinkSync(testFile);
        console.log('✅ Permisos de escritura OK');
    }
    catch (error) {
        console.error('❌ Error: No hay permisos de escritura en logs/');
        console.error('   Por favor, verifica los permisos de la carpeta');
    }
    console.log('======================================\n');
};
exports.initializeApp = initializeApp;
