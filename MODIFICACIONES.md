# Modificaciones

Fecha: 24 de mayo de 2026

## Resumen general

El cambio ajustó la configuración de tiempo disponible por palabra para cada nivel del juego Ahorcado.

Archivo modificado:

- `src/pages/Ahorcado.tsx`

## Cambios realizados

En el objeto `configuracionNiveles`, se modificó el valor `tiempoPorPalabra` de los tres niveles:

| Nivel | Tiempo anterior | Tiempo nuevo | Equivalencia nueva |
| --- | ---: | ---: | --- |
| `basico` | 20 segundos | 180 segundos | 3 minutos |
| `intermedio` | 30 segundos | 300 segundos | 5 minutos |
| `avanzado` | 40 segundos | 600 segundos | 10 minutos |

## Codigo antes del cambio

```tsx
53:   const configuracionNiveles = {
54:     basico: { numeroPalabras: 3, puntosPorPalabra: 10, tiempoPorPalabra: 180 },
55:     intermedio: { numeroPalabras: 4, puntosPorPalabra: 15, tiempoPorPalabra: 300 },
56:     avanzado: { numeroPalabras: 5, puntosPorPalabra: 20, tiempoPorPalabra: 600 },
57:   } as const;
```