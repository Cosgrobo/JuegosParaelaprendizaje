# Aula Lúdica

Aplicación web de juegos educativos con cuentas, catálogo editable y partidas multijugador. El servidor Express también sirve la interfaz desde `public/`.

## Iniciar en Windows

1. Instala Node.js y MySQL Server.
2. En MySQL crea la base una vez: `CREATE DATABASE juegos_educativos CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
3. Copia `.env.example` a `.env` y coloca el usuario/contraseña de MySQL.
4. Abre PowerShell en `backend/` y ejecuta `npm install` (si no están instaladas las dependencias) y luego `npm start`.
5. Abre [http://localhost:3000](http://localhost:3000). El backend crea las tablas de la aplicación al arrancar.

Para probar multijugador, abre la dirección en dos navegadores o una ventana normal y otra privada. Crea dos cuentas, inicia sesión en ambas, crea una sala en una y escribe el código en la otra.

La plataforma incluye modalidades competitiva y colaborativa, cupo configurable, turnos, cronómetro, respuesta sincronizada por consulta, puntuaciones e historial. La identidad se deriva de sesiones tokenizadas. El contenido creado se persiste en las tablas asociadas a cada juego.

Los detalles de rutas y acciones están en [MULTIJUGADOR.md](./MULTIJUGADOR.md).
