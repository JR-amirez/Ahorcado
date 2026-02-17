# AhorcadoMv

Juego del ahorcado desarrollado con **Ionic + React + Capacitor** para plataformas móviles (Android).

## Requisitos previos

- [Node.js](https://nodejs.org/) (v18 o superior)
- npm (incluido con Node.js)

## Instalación

```bash
npm install
```

## Desarrollo local

```bash
npm run dev
```

Abre el navegador en la dirección que indique Vite (por defecto `http://localhost:5173`).

---

## Construcción del ZIP (build)

El proyecto incluye un script unificado que genera un archivo **`android-base.zip`** listo para importar en Android Studio. Para ejecutarlo:

```bash
npm run build
```

### Etapas del proceso

El comando `npm run build` ejecuta secuencialmente las siguientes etapas:

| #   | Script               | Descripción                                                                                                                             |
| --- | -------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `build:web`          | Compila la aplicación web con Vite a través de Ionic CLI. Genera los bundles optimizados en la carpeta `dist/`.                         |
| 2   | `build:android`      | Agrega la plataforma Android mediante Capacitor (solo si la carpeta `android/` no existe).                                              |
| 3   | `build:android:sync` | Copia el contenido de `dist/` dentro de los assets nativos de Android (`android/app/src/main/assets/public/`).                          |
| 4   | `patch:capacitor`    | Ejecuta `scripts/patch-capacitor-gradle.cjs` para ajustar los archivos Gradle de Capacitor con las versiones correctas de dependencias. |
| 5   | `clean:assets`       | **Elimina archivos innecesarios** del proyecto Android para reducir el tamaño del ZIP (ver detalle abajo).                              |
| 6   | `zip:android`        | Comprime la carpeta `android/` en **`android-base.zip`** usando PowerShell.                                                             |

### Archivos eliminados en `clean:assets`

Para optimizar el tamaño del archivo ZIP resultante, se borran los siguientes archivos y directorios que **no son necesarios** para compilar el proyecto en Android Studio:

- `android/.gradle/` — Caché de Gradle
- `android/.gitignore`
- `android/.idea/` — Archivos de configuración del IDE (caches, XML de configuración)
- `android/app/build/` — Artefactos de compilación previos
- `android/build/` — Artefactos de compilación raíz
- `android/capacitor-cordova-android-plugins/build/` — Build de plugins
- `android/local.properties` — Configuración local de rutas del SDK
- `android/app/src/androidTest/` — Tests de instrumentación
- `android/app/src/test/` — Tests unitarios

> Todos estos archivos se regeneran automáticamente al abrir el proyecto en Android Studio o al ejecutar Gradle.

---

## Archivo de configuración (`ahorcado-config.json`)

La aplicación carga su configuración en tiempo de ejecución desde:

```
public/config/ahorcado-config.json
```

Este archivo permite personalizar el comportamiento del juego **sin modificar el código fuente**. Si el archivo no existe o no se puede leer, la aplicación funciona con los valores por defecto.

### Ejemplo completo

```json
{
    "nombreApp": "STEAM-G",
    "version": "1.0",
    "fecha": "2025-12-02",
    "descripcion": "Juego para el desarrollo de habilidades matemáticas",
    "plataformas": ["android"],
    "nivel": "avanzado",
    "palabras": [
        { "word": "CELULA", "clue": "Unidad básica de la vida" },
        { "word": "FOTOSINTESIS", "clue": "Proceso por el cual las plantas producen su alimento" }
    ]
}
```

### Opciones disponibles

Todas las propiedades son **opcionales**. Si se omiten, se usan los valores por defecto.

| Propiedad     | Tipo       | Valor por defecto                                       | Descripción                                                                                            |
| ------------- | ---------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `nombreApp`   | `string`   | `"STEAM-G"`                                             | Nombre de la aplicación mostrado en pantalla.                                                          |
| `version`     | `string`   | `"1.0"`                                                 | Versión de la aplicación.                                                                              |
| `fecha`       | `string`   | `"2025-12-02"`                                          | Fecha de creación en formato ISO (`YYYY-MM-DD`). Se muestra formateada como "2 de diciembre del 2025". |
| `descripcion` | `string`   | `"Juego para el desarrollo de habilidades matemáticas"` | Descripción breve del juego.                                                                           |
| `plataformas` | `string[]` | `["android"]`                                           | Lista de plataformas soportadas. Valores reconocidos: `"android"`, `"ios"`, `"web"`.                   |
| `nivel`       | `string`   | `"advanced"`                                            | Nivel de dificultad inicial.                                                                           |
| `palabras`    | `array`    | `[]`                                                    | Lista personalizada de palabras y pistas (ver formato abajo).                                          |

### Niveles disponibles

| Valor                             | Palabras por partida | Puntos por palabra | Tiempo por palabra (s) |
| --------------------------------- | -------------------- | ------------------ | ---------------------- |
| `"basico"` / `"basic"`            | 3                    | 10                 | 20                     |
| `"intermedio"` / `"intermediate"` | 4                    | 15                 | 30                     |
| `"avanzado"` / `"advanced"`       | 5                    | 20                 | 40                     |

### Formato de `palabras`

```json
{
  "palabras": [{ "word": "PALABRA", "clue": "Pista para el jugador" }]
}
```

- **`word`**: La palabra a adivinar (en mayúsculas, sin acentos).
- **`clue`**: Pista que se muestra al jugador durante la partida.
