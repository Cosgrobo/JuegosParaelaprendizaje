# API multijugador

El backend crea las tablas de salas, partidas, participantes, acciones y sesiones al iniciar. El juego y su contenido siguen en el catálogo existente; cada sala genera una partida aislada, por lo que reutilizar un juego no comparte resultados.

Todas las rutas `/api/salas` requieren `Authorization: Bearer <token>`. `/api/login` y `/api/registro` entregan el token de sesión (30 días). El servidor determina el usuario desde ese token.

## Flujo

1. `POST /api/salas` con `{ "id_juego": 1, "limite_segundos": 300 }`. La persona autenticada crea una sala para el juego seleccionado y queda como anfitriona. El cupo se fija en 30 participantes y la modalidad competitiva; el único ajuste de la sala es su duración, entre 30 y 7200 segundos.
2. `POST /api/salas/:codigo/unirse` con `{}`. Un participante puede volver a unirse con el mismo usuario y código, incluso después de iniciar.
3. Consultar `GET /api/salas/:codigo` periódicamente para ver participantes conectados, turno, actividad, puntuaciones, pregunta de ruleta actual, cronómetro y resultado de partida.
4. El anfitrión inicia con `POST /api/salas/:codigo/iniciar` y `{}`. Se requieren al menos dos personas conectadas y contenido configurado para el juego.
5. Enviar acciones a `POST /api/salas/:codigo/acciones` con `{ "clave_accion": "uuid-por-intento", "tipo_accion": "responder", "objetivo": 12, "respuesta": "..." }`. Para memorama, enviar `{ "clave_accion": "uuid-por-intento", "tipo_accion": "seleccionar", "selecciones": [{"id_pareja": 1, "lado": "A"}, {"id_pareja": 1, "lado": "B"}] }`. La clave debe ser única (8–80 caracteres). El servidor valida pertenencia, turno, contenido y respuesta, y registra cada intento una sola vez.

Para juegos tipo ruleta, el jugador del turno gira con `POST /api/salas/:codigo/girar` y `{ "clave_accion": "uuid-por-giro" }`. El servidor elige una pregunta disponible y la asigna al jugador; el resto de participantes ve la misma pregunta al consultar el estado. Después se responde con `/acciones`, usando el id de la pregunta como `objetivo` y la opción A, B, C o D.

Tipos cubiertos en acciones compartidas: sopa de letras (selección de palabra), crucigrama (respuesta por palabra), Detective (respuesta por enigma), memorama (dos cartas) y ruleta/preguntas de opción múltiple. Las acciones correctas suman 10 puntos. Cada intento cuenta como acierto o error y pasa el turno en modalidad competitiva. En colaborativo cualquier participante puede actuar; el turno se informa para coordinar acciones. En memorama, las cartas fallidas se muestran durante cinco segundos a todos los participantes.

La actividad acaba cuando se resuelven todos los elementos o al vencer el límite. Se guardan hora de inicio, hora de fin, duración, estado y resultado general en `partidas`; las estadísticas individuales se guardan en `sala_participantes` y el historial completo en `partida_acciones`. Las acciones concurrentes se serializan por sala; un elemento resuelto no puede adjudicarse dos veces. Al desconectarse se conserva el puesto y avance; reingresar con la misma cuenta y código restaura la presencia.

## Crear contenido

Se conservan las rutas de administración ya existentes: `POST /api/juegos`, `PUT /api/juegos/:id/palabras-sopa`, `PUT /api/juegos/:id/crucigrama`, `PUT /api/juegos/:id/enigmas` y `PUT /api/juegos/:id/memorama`. El contenido vive en tablas de base de datos asociado al juego, no se incluye en el código de las partidas.

La interfaz web está en `public/` y la sirve Express en la raíz (`/`). También se puede consumir el API con otro cliente.

El estado se consulta cada 1.6 segundos y se mantiene consistente en la base de datos. Si un participante deja de enviar presencia durante 8 segundos, aparece desconectado; en modo competitivo el turno pasa al siguiente conectado. El cronómetro sigue corriendo y se puede regresar con el mismo usuario y código mientras haya cupo reservado.
