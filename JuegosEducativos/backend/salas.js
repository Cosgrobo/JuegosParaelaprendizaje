const express = require('express')
const crypto = require('crypto')

module.exports = function crearRouterSalas(db) {
  const router = express.Router()
  const normalizar = (valor) => String(valor || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/[^A-Z0-9]/g, '')
  const direccionesSopa = [[0,1],[0,-1],[1,0],[-1,0],[1,1],[1,-1],[-1,1],[-1,-1]]

  function crearTableroSopa(items) {
    const palabras = items.map(item => ({ id: String(item.id_palabra), palabra: normalizar(item.palabra) }))
      .filter(item => item.palabra)
      .sort((a,b) => b.palabra.length-a.palabra.length)
    const mayor = Math.max(0, ...palabras.map(item => item.palabra.length))
    const letrasTotales = palabras.reduce((suma,item) => suma+item.palabra.length,0)

    for (let size = Math.max(10, mayor + 1, Math.ceil(Math.sqrt(letrasTotales * 1.5))); size <= 24; size++) {
      const tablero = Array.from({length:size}, () => Array(size).fill(''))
      const colocaciones = []
      let fallo = false

      for (const item of palabras) {
        let colocada = false
        for (let intento = 0; intento < 1200 && !colocada; intento++) {
          const [df,dc] = direccionesSopa[crypto.randomInt(direccionesSopa.length)]
          const fila = crypto.randomInt(size)
          const columna = crypto.randomInt(size)
          const finFila = fila + df * (item.palabra.length - 1)
          const finColumna = columna + dc * (item.palabra.length - 1)
          if (finFila < 0 || finFila >= size || finColumna < 0 || finColumna >= size) continue
          const celdas = Array.from({length:item.palabra.length}, (_,i) => ({ fila:fila+df*i, columna:columna+dc*i }))
          if (celdas.some((celda,i) => tablero[celda.fila][celda.columna] && tablero[celda.fila][celda.columna] !== item.palabra[i])) continue
          celdas.forEach((celda,i) => { tablero[celda.fila][celda.columna] = item.palabra[i] })
          colocaciones.push({ id_palabra:item.id, celdas })
          colocada = true
        }
        if (!colocada) { fallo = true; break }
      }

      if (fallo) continue
      for (let fila=0; fila<size; fila++) for (let columna=0; columna<size; columna++) {
        if (!tablero[fila][columna]) tablero[fila][columna] = String.fromCharCode(65 + crypto.randomInt(26))
      }
      return { tablero, colocaciones }
    }
    throw new Error('No se pudo generar el tablero de sopa de letras')
  }

  router.use(async (req, res, next) => {
    try {
      const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '')
      if (!token) return res.status(401).json({ mensaje: 'Inicia sesión para participar' })
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
      const [rows] = await db.query('SELECT id_usuario FROM sesiones_usuario WHERE token_hash=? AND expira_en>NOW()', [tokenHash])
      if (!rows.length) return res.status(401).json({ mensaje: 'La sesión expiró; inicia sesión nuevamente' })
      req.usuario = rows[0]
      next()
    } catch (e) { console.error(e); res.status(500).json({ mensaje: 'No se pudo validar la sesión' }) }
  })

  async function salaPorCodigo(codigo, conn = db) {
    const [rows] = await conn.query(`
      SELECT s.*, j.nombre AS juego, t.nombre AS tipo
      FROM salas s JOIN juegos j ON j.id_juego = s.id_juego
      JOIN tipos_juego t ON t.id_tipo = j.id_tipo
      WHERE s.codigo = ?`, [String(codigo || '').toUpperCase()])
    return rows[0]
  }

  async function participantes(idSala, conn = db) {
    const [rows] = await conn.query(`
      SELECT p.id_usuario, u.nombre, p.conectado, p.aciertos, p.errores, p.puntuacion, p.resultado
      FROM sala_participantes p JOIN usuarios u ON u.id_usuario = p.id_usuario
      WHERE p.id_sala = ? ORDER BY p.unido_en`, [idSala])
    return rows
  }

  async function estadoPublico(sala, conn = db) {
    const jugadores = await participantes(sala.id_sala, conn)
    const state = typeof sala.estado_juego === 'string' ? JSON.parse(sala.estado_juego || '{}') : (sala.estado_juego || {})
    const [actions] = await conn.query(`SELECT id_accion, objetivo, id_usuario, acierto, tipo_accion, detalle, creado_en
      FROM partida_acciones WHERE id_sala = ? ORDER BY id_accion`, [sala.id_sala])
    const [[partida]] = await conn.query('SELECT * FROM partidas WHERE id_sala=?', [sala.id_sala])
    let preguntaActual = null
    if (state.pregunta_activa) {
      const [[question]] = await conn.query(`SELECT id_pregunta,pregunta,opcion_a,opcion_b,opcion_c,opcion_d
        FROM preguntas WHERE id_juego=? AND id_pregunta=?`, [sala.id_juego,state.pregunta_activa])
      preguntaActual = question || null
    }
    return {
      sala: { id: sala.id_sala, codigo: sala.codigo, juego: sala.juego, tipo: sala.tipo,
        id_anfitrion: sala.id_anfitrion,
        modalidad: sala.modalidad, estado: sala.estado, max_jugadores: sala.max_jugadores,
        turno_usuario: sala.turno_usuario, creado_en: sala.creado_en,
        inicia_en: sala.inicia_en, finaliza_en: sala.finaliza_en },
      participantes: jugadores,
      partida: partida || null,
      pregunta_actual: preguntaActual,
      avance: (() => {
        const { colocaciones, ...visibleState } = state
        return { ...visibleState, cartas: Array.isArray(state.cartas) ? state.cartas.map(({ token, posicion }) => ({ token, posicion })) : undefined }
      })(),
      acciones: actions
        .filter(a => a.tipo_accion !== 'memorama' || Date.now() - new Date(a.creado_en).getTime() <= 5000)
        .map(a => ({ ...a, detalle: typeof a.detalle === 'string' ? JSON.parse(a.detalle || '{}') : a.detalle }))
    }
  }

  // A room may have been started by a backend version that did not create
  // word-search boards yet. Build one once, under a room lock, on next visit.
  async function asegurarTableroSopa(sala) {
    if (sala.estado !== 'en_curso' || !normalizar(sala.tipo).includes('SOPA')) return
    const conn = await db.getConnection()
    try {
      await conn.beginTransaction()
      const [[locked]] = await conn.query('SELECT estado,estado_juego FROM salas WHERE id_sala=? FOR UPDATE', [sala.id_sala])
      if (!locked || locked.estado !== 'en_curso') { await conn.rollback(); return }
      const state = typeof locked.estado_juego === 'string' ? JSON.parse(locked.estado_juego || '{}') : (locked.estado_juego || {})
      if (!Array.isArray(state.tablero)) {
        const [items] = await conn.query('SELECT id_palabra,palabra FROM palabras_sopa WHERE id_juego=? ORDER BY id_palabra', [sala.id_juego])
        const board = crearTableroSopa(items)
        const [players] = await conn.query('SELECT id_usuario FROM sala_participantes WHERE id_sala=? ORDER BY unido_en,id_usuario', [sala.id_sala])
        const [previousActions] = await conn.query(`SELECT id_usuario,objetivo FROM partida_acciones WHERE id_sala=? AND tipo_accion='sopa' AND acierto=1 ORDER BY id_accion`, [sala.id_sala])
        state.tablero = board.tablero
        state.colocaciones = board.colocaciones
        state.total = board.colocaciones.length
        state.progreso_por_usuario = Object.fromEntries(players.map(player => [String(player.id_usuario), []]))
        state.primer_descubridor = {}
        for (const action of previousActions) {
          const key = String(action.id_usuario)
          const target = String(action.objetivo)
          if (!board.colocaciones.some(item => item.id_palabra === target)) continue
          if (!state.progreso_por_usuario[key].includes(target)) state.progreso_por_usuario[key].push(target)
          if (!state.primer_descubridor[target]) state.primer_descubridor[target] = action.id_usuario
        }
      } else if (!state.progreso_por_usuario) {
        const [players] = await conn.query('SELECT id_usuario FROM sala_participantes WHERE id_sala=?', [sala.id_sala])
        state.progreso_por_usuario = Object.fromEntries(players.map(player => [String(player.id_usuario), []]))
        state.primer_descubridor ||= {}
      }
      await conn.query('UPDATE salas SET estado_juego=? WHERE id_sala=?', [JSON.stringify(state),sala.id_sala])
      await conn.commit()
      sala.estado_juego = state
    } catch (error) {
      await conn.rollback()
      throw error
    } finally { conn.release() }
  }

  router.get('/historial/usuario', async (req, res) => {
    try {
      const [rows] = await db.query(`SELECT p.id_partida,p.id_sala,p.id_juego,p.tipo_juego,
        t.nombre AS tipo,j.nombre AS juego,j.id_unidad,u.nombre AS unidad,
        s.codigo AS codigo_sala,s.modalidad AS modalidad_partida,
        p.fecha,p.hora_inicio,p.hora_fin,p.tiempo_transcurrido,p.estado AS estado_partida,
        p.resultado_general,sp.id_usuario,sp.aciertos,sp.errores,sp.puntuacion,sp.resultado AS resultado_individual
        FROM partidas p JOIN salas s ON s.id_sala=p.id_sala JOIN juegos j ON j.id_juego=p.id_juego
        JOIN tipos_juego t ON t.id_tipo=j.id_tipo LEFT JOIN unidades u ON u.id_unidad=j.id_unidad
        JOIN sala_participantes sp ON sp.id_sala=p.id_sala
        WHERE sp.id_usuario=? AND p.estado <> 'en_curso' ORDER BY p.id_partida DESC`,
      [req.usuario.id_usuario])
      res.json(rows)
    } catch (e) { console.error(e); res.status(500).json({ mensaje: 'No se pudo consultar el historial multijugador' }) }
  })

  router.get('/:codigo/contenido', async (req, res) => {
    try {
      const sala = await salaPorCodigo(req.params.codigo)
      if (!sala) return res.status(404).json({ mensaje: 'Sala no encontrada' })
      const [membership] = await db.query('SELECT id_usuario FROM sala_participantes WHERE id_sala=? AND id_usuario=?', [sala.id_sala,req.usuario.id_usuario])
      if (!membership.length) return res.status(403).json({ mensaje: 'Únete a la sala para ver el juego' })
      const tipo = normalizar(sala.tipo)
      let contenido = []
      if (tipo.includes('SOPA')) {
        const [items] = await db.query('SELECT id_palabra,palabra,pista FROM palabras_sopa WHERE id_juego=? ORDER BY id_palabra', [sala.id_juego])
        contenido = items
      } else if (tipo.includes('CRUCIGRAMA')) {
        const [items] = await db.query('SELECT id_palabra,pista,CHAR_LENGTH(palabra) AS longitud,fila,columna,direccion FROM palabras_crucigrama WHERE id_juego=? ORDER BY id_palabra', [sala.id_juego])
        contenido = items
      } else if (tipo.includes('DETECTIVE')) {
        const [items] = await db.query('SELECT id_enigma,materia,titulo,pista_1,pista_2,pista_3 FROM enigmas_detective WHERE id_juego=? ORDER BY id_enigma', [sala.id_juego])
        contenido = items
      } else if (tipo.includes('RULETA') || tipo.includes('PREGUNTA') || tipo.includes('QUIZ')) {
        const [items] = await db.query('SELECT id_pregunta,pregunta,opcion_a,opcion_b,opcion_c,opcion_d FROM preguntas WHERE id_juego=? ORDER BY id_pregunta', [sala.id_juego])
        contenido = items
      } else if (tipo.includes('MEMORAMA')) {
        contenido = []
      }
      res.json({ tipo: sala.tipo, contenido })
    } catch (e) { console.error(e); res.status(500).json({ mensaje: 'No se pudo cargar el contenido del juego' }) }
  })

  router.post('/', async (req, res) => {
    const id_juego = Number(req.body.id_juego)
    const limite_segundos = Number(req.body.limite_segundos ?? 300)
    const max_jugadores = 30
    const modalidad = 'competitiva'
    const id_usuario = req.usuario.id_usuario
    if (!Number.isInteger(Number(id_juego)) ||
        !Number.isInteger(limite_segundos) || limite_segundos < 30 || limite_segundos > 7200) {
      return res.status(400).json({ mensaje: 'Selecciona un juego y una duración entre 30 segundos y 2 horas' })
    }
    const conn = await db.getConnection()
    try {
      await conn.beginTransaction()
      const [[user]] = await conn.query('SELECT id_usuario FROM usuarios WHERE id_usuario = ?', [id_usuario])
      const [[game]] = await conn.query(`SELECT j.id_juego,t.nombre AS tipo FROM juegos j JOIN tipos_juego t ON t.id_tipo=j.id_tipo WHERE j.id_juego=? AND j.activo=TRUE`, [id_juego])
      if (!user || !game) { await conn.rollback(); return res.status(404).json({ mensaje: 'Usuario o juego activo no encontrado' }) }
      let codigo
      for (let i = 0; i < 5; i++) {
        codigo = crypto.randomBytes(4).toString('hex').toUpperCase()
        const [exists] = await conn.query('SELECT id_sala FROM salas WHERE codigo = ?', [codigo])
        if (!exists.length) break
      }
      const [created] = await conn.query(`INSERT INTO salas (codigo,id_juego,id_anfitrion,max_jugadores,limite_segundos,modalidad)
        VALUES (?,?,?,?,?,?)`, [codigo, id_juego, id_usuario, max_jugadores, limite_segundos, modalidad])
      await conn.query('INSERT INTO sala_participantes (id_sala,id_usuario) VALUES (?,?)', [created.insertId, id_usuario])
      await conn.commit()
      res.status(201).json({ mensaje: 'Sala creada', codigo, id_sala: created.insertId })
    } catch (e) { await conn.rollback(); console.error(e); res.status(500).json({ mensaje: 'No se pudo crear la sala' }) }
    finally { conn.release() }
  })

  router.post('/:codigo/unirse', async (req, res) => {
    const id_usuario = req.usuario.id_usuario
    const conn = await db.getConnection()
    try {
      await conn.beginTransaction()
      const sala = await salaPorCodigo(req.params.codigo, conn)
      if (!sala) { await conn.rollback(); return res.status(404).json({ mensaje: 'Sala no encontrada' }) }
      await conn.query('SELECT id_sala FROM salas WHERE id_sala=? FOR UPDATE', [sala.id_sala])
      const [user] = await conn.query('SELECT id_usuario FROM usuarios WHERE id_usuario = ?', [id_usuario])
      const [member] = await conn.query('SELECT id_usuario FROM sala_participantes WHERE id_sala = ? AND id_usuario = ?', [sala.id_sala, id_usuario])
      const [count] = await conn.query('SELECT COUNT(*) AS total FROM sala_participantes WHERE id_sala = ?', [sala.id_sala])
      if (!user.length) { await conn.rollback(); return res.status(404).json({ mensaje: 'Usuario no encontrado' }) }
      if (sala.estado !== 'esperando' && !member.length) { await conn.rollback(); return res.status(409).json({ mensaje: 'La partida ya inició' }) }
      if (!member.length && count[0].total >= sala.max_jugadores) { await conn.rollback(); return res.status(409).json({ mensaje: 'La sala está llena' }) }
      if (member.length) await conn.query('UPDATE sala_participantes SET conectado=1, desconectado_en=NULL, ultimo_visto=NOW() WHERE id_sala=? AND id_usuario=?', [sala.id_sala,id_usuario])
      else await conn.query('INSERT INTO sala_participantes (id_sala,id_usuario) VALUES (?,?)', [sala.id_sala,id_usuario])
      await conn.commit()
      res.json({ mensaje: 'Ingresaste a la sala', codigo: sala.codigo })
    } catch (e) { await conn.rollback(); console.error(e); res.status(500).json({ mensaje: 'No se pudo ingresar a la sala' }) }
    finally { conn.release() }
  })

  router.get('/:codigo', async (req, res) => {
    try {
      const sala = await salaPorCodigo(req.params.codigo)
      if (!sala) return res.status(404).json({ mensaje: 'Sala no encontrada' })
      const [membership] = await db.query('SELECT id_usuario FROM sala_participantes WHERE id_sala=? AND id_usuario=?', [sala.id_sala,req.usuario.id_usuario])
      if (!membership.length) return res.status(403).json({ mensaje: 'Únete a la sala para ver su estado' })
      await db.query('UPDATE sala_participantes SET conectado=1, ultimo_visto=NOW() WHERE id_sala=? AND id_usuario=?', [sala.id_sala,req.usuario.id_usuario])
      await asegurarTableroSopa(sala)
      await db.query(`UPDATE sala_participantes SET conectado=0,desconectado_en=NOW()
        WHERE id_sala=? AND conectado=1 AND ultimo_visto < DATE_SUB(NOW(), INTERVAL 8 SECOND)`, [sala.id_sala])
      if (sala.estado === 'en_curso' && sala.modalidad === 'competitiva' && normalizar(sala.tipo).includes('CRUCIGRAMA') && !sala.turno_usuario) {
        const [[firstPlayer]] = await db.query('SELECT id_usuario FROM sala_participantes WHERE id_sala=? ORDER BY unido_en,id_usuario LIMIT 1', [sala.id_sala])
        if (firstPlayer) {
          sala.turno_usuario = firstPlayer.id_usuario
          await db.query('UPDATE salas SET turno_usuario=? WHERE id_sala=? AND estado=? AND turno_usuario IS NULL', [sala.turno_usuario,sala.id_sala,'en_curso'])
        }
      }
      if (sala.estado === 'en_curso' && sala.modalidad === 'competitiva' && sala.turno_usuario) {
        const [[turnPlayer]] = await db.query('SELECT conectado FROM sala_participantes WHERE id_sala=? AND id_usuario=?', [sala.id_sala,sala.turno_usuario])
        if (turnPlayer && !turnPlayer.conectado) {
          const [ordered] = await db.query('SELECT id_usuario,conectado FROM sala_participantes WHERE id_sala=? ORDER BY unido_en,id_usuario', [sala.id_sala])
          const currentIndex = ordered.findIndex(player => Number(player.id_usuario) === Number(sala.turno_usuario))
          const next = [...ordered.slice(currentIndex + 1), ...ordered.slice(0, currentIndex + 1)].find(player => player.conectado)
          if (next) {
            await db.query('UPDATE salas SET turno_usuario=? WHERE id_sala=? AND estado=?', [next.id_usuario,sala.id_sala,'en_curso'])
            sala.turno_usuario = next.id_usuario
          }
        }
      }
      const [[clock]] = await db.query(`SELECT TIMESTAMPDIFF(SECOND, inicia_en, NOW()) AS transcurrido
        FROM salas WHERE id_sala=?`, [sala.id_sala])
      if (sala.estado === 'en_curso' && Number(clock.transcurrido) >= sala.limite_segundos) {
        await db.query("UPDATE salas SET estado='finalizada', finaliza_en=NOW() WHERE id_sala=? AND estado='en_curso'", [sala.id_sala])
        await db.query(`UPDATE partidas SET estado='tiempo_agotado',hora_fin=NOW(),tiempo_transcurrido=?,resultado_general='tiempo_agotado' WHERE id_sala=? AND estado='en_curso'`, [clock.transcurrido,sala.id_sala])
        await db.query("UPDATE sala_participantes SET resultado='tiempo_agotado' WHERE id_sala=? AND resultado IS NULL", [sala.id_sala])
        sala.estado = 'finalizada'
        sala.finaliza_en = new Date()
      }
      const payload = await estadoPublico(sala)
      payload.sala.limite_segundos = sala.limite_segundos
      payload.sala.tiempo_transcurrido = Number(clock.transcurrido || 0)
      payload.sala.tiempo_restante = Math.max(0, sala.limite_segundos - Number(clock.transcurrido || 0))
      res.json(payload)
    } catch (e) { console.error(e); res.status(500).json({ mensaje: 'No se pudo consultar la sala' }) }
  })

  router.post('/:codigo/desconectarse', async (req, res) => {
    try {
      const sala = await salaPorCodigo(req.params.codigo)
      if (!sala) return res.status(404).json({ mensaje: 'Sala no encontrada' })
      const [result] = await db.query(`UPDATE sala_participantes SET conectado=0, desconectado_en=NOW()
        WHERE id_sala=? AND id_usuario=?`, [sala.id_sala, req.usuario.id_usuario])
      if (!result.affectedRows) return res.status(404).json({ mensaje: 'Participante no encontrado' })
      res.json({ mensaje: sala.estado === 'esperando' ? 'Desconexión registrada; puede reingresar con el código' : 'Desconexión registrada; el puesto queda reservado para reingreso' })
    } catch (e) { console.error(e); res.status(500).json({ mensaje: 'No se pudo registrar la desconexión' }) }
  })

  router.post('/:codigo/iniciar', async (req, res) => {
    const conn = await db.getConnection()
    try {
      await conn.beginTransaction()
      const sala = await salaPorCodigo(req.params.codigo, conn)
      if (!sala) { await conn.rollback(); return res.status(404).json({ mensaje: 'Sala no encontrada' }) }
      const [[lockedRoom]] = await conn.query('SELECT estado,id_anfitrion FROM salas WHERE id_sala=? FOR UPDATE', [sala.id_sala])
      if (Number(req.usuario.id_usuario) !== Number(lockedRoom.id_anfitrion)) { await conn.rollback(); return res.status(403).json({ mensaje: 'Solo el anfitrión puede iniciar' }) }
      const [players] = await conn.query('SELECT id_usuario FROM sala_participantes WHERE id_sala=? AND conectado=1 ORDER BY unido_en,id_usuario', [sala.id_sala])
      if (lockedRoom.estado !== 'esperando' || players.length < 2) { await conn.rollback(); return res.status(409).json({ mensaje: 'Se requieren al menos dos participantes conectados y una sala en espera' }) }
      let state = { completados: [], total: 0 }
      const type = normalizar(sala.tipo)
      if (type.includes('SOPA')) {
        const [items] = await conn.query('SELECT id_palabra,palabra FROM palabras_sopa WHERE id_juego=?', [sala.id_juego])
        const tableroSopa = crearTableroSopa(items)
        state.total = tableroSopa.colocaciones.length
        state.tablero = tableroSopa.tablero
        state.colocaciones = tableroSopa.colocaciones
        state.progreso_por_usuario = Object.fromEntries(players.map(player => [String(player.id_usuario), []]))
        state.primer_descubridor = {}
      } else if (type.includes('CRUCIGRAMA')) {
        const [items] = await conn.query('SELECT id_palabra FROM palabras_crucigrama WHERE id_juego=?', [sala.id_juego])
        state.total = items.length
      } else if (type.includes('RULETA') || type.includes('PREGUNTA') || type.includes('QUIZ')) {
        const [items] = await conn.query('SELECT id_pregunta FROM preguntas WHERE id_juego=? ORDER BY id_pregunta', [sala.id_juego])
        state.preguntas = items.map(i => i.id_pregunta); state.total = items.length
      } else if (type.includes('DETECTIVE')) {
        const [items] = await conn.query('SELECT id_enigma FROM enigmas_detective WHERE id_juego=?', [sala.id_juego])
        state.total = items.length
      } else if (type.includes('MEMORAMA')) {
        const [items] = await conn.query('SELECT id_pareja FROM parejas_memorama WHERE id_juego=?', [sala.id_juego])
        state.total = items.length
        const [pairs] = await conn.query('SELECT id_pareja,elemento_1,elemento_2 FROM parejas_memorama WHERE id_juego=?', [sala.id_juego])
        state.cartas = pairs.flatMap(pair => [
          { token: crypto.randomUUID(), posicion: crypto.randomInt(1000000), pareja: pair.id_pareja, lado: 'A', elemento: pair.elemento_1 },
          { token: crypto.randomUUID(), posicion: crypto.randomInt(1000000), pareja: pair.id_pareja, lado: 'B', elemento: pair.elemento_2 }
        ]).sort((a, b) => a.posicion - b.posicion)
        state.cartas_resueltas = []
      }
      if (!state.total) { await conn.rollback(); return res.status(409).json({ mensaje: 'El juego todavía no tiene contenido para jugar' }) }
      await conn.query(`UPDATE salas SET estado='en_curso', estado_juego=?, turno_usuario=? , inicia_en=NOW()
        WHERE id_sala=?`, [JSON.stringify(state), type.includes('SOPA') || (type.includes('CRUCIGRAMA') && sala.modalidad === 'colaborativa') ? null : players[0].id_usuario, sala.id_sala])
      await conn.query('INSERT INTO partidas (id_sala,id_juego,tipo_juego,fecha,hora_inicio) VALUES (?,?,?,CURDATE(),NOW())', [sala.id_sala,sala.id_juego,sala.tipo])
      await conn.commit()
      res.json({ mensaje: 'Partida iniciada' })
    } catch (e) { await conn.rollback(); console.error(e); res.status(500).json({ mensaje: 'No se pudo iniciar la partida' }) }
    finally { conn.release() }
  })

  router.post('/:codigo/girar', async (req, res) => {
    const { clave_accion } = req.body
    if (!/^[\w-]{8,80}$/.test(String(clave_accion || ''))) return res.status(400).json({ mensaje: 'La acción requiere una clave única' })
    const conn = await db.getConnection()
    try {
      await conn.beginTransaction()
      const sala = await salaPorCodigo(req.params.codigo, conn)
      if (!sala) { await conn.rollback(); return res.status(404).json({ mensaje: 'Sala no encontrada' }) }
      const idUsuario = req.usuario.id_usuario
      const [[member]] = await conn.query('SELECT id_usuario FROM sala_participantes WHERE id_sala=? AND id_usuario=? FOR UPDATE', [sala.id_sala,idUsuario])
      const [[locked]] = await conn.query('SELECT * FROM salas WHERE id_sala=? FOR UPDATE', [sala.id_sala])
      if (!member || locked.estado !== 'en_curso' || !normalizar(sala.tipo).includes('RULETA')) { await conn.rollback(); return res.status(409).json({ mensaje: 'La ruleta no está disponible en esta partida' }) }
      const [[clock]] = await conn.query('SELECT TIMESTAMPDIFF(SECOND,inicia_en,NOW()) AS transcurrido FROM salas WHERE id_sala=?', [sala.id_sala])
      if (Number(clock.transcurrido) >= locked.limite_segundos) {
        await conn.query("UPDATE salas SET estado='finalizada',finaliza_en=NOW() WHERE id_sala=?", [sala.id_sala])
        await conn.query(`UPDATE partidas SET estado='tiempo_agotado',hora_fin=NOW(),tiempo_transcurrido=?,resultado_general='tiempo_agotado' WHERE id_sala=? AND estado='en_curso'`, [clock.transcurrido,sala.id_sala])
        await conn.query("UPDATE sala_participantes SET resultado='tiempo_agotado' WHERE id_sala=? AND resultado IS NULL", [sala.id_sala])
        await conn.commit()
        return res.status(409).json({ mensaje: 'Se agotó el tiempo de la partida' })
      }
      const [duplicate] = await conn.query('SELECT detalle FROM partida_acciones WHERE id_sala=? AND id_usuario=? AND clave_accion=?', [sala.id_sala,idUsuario,clave_accion])
      if (duplicate.length) { await conn.commit(); return res.json({ mensaje: 'Giro ya registrado', duplicada: true }) }
      if (sala.modalidad === 'competitiva' && Number(locked.turno_usuario) !== Number(idUsuario)) { await conn.rollback(); return res.status(403).json({ mensaje: 'No es tu turno para girar' }) }
      const state = typeof locked.estado_juego === 'string' ? JSON.parse(locked.estado_juego || '{}') : (locked.estado_juego || {})
      if (state.pregunta_activa) { await conn.rollback(); return res.status(409).json({ mensaje: 'Responde la pregunta actual antes de girar de nuevo' }) }
      const disponibles = (state.preguntas || []).filter(id => !state.completados.includes(String(id)))
      if (!disponibles.length) { await conn.rollback(); return res.status(409).json({ mensaje: 'Ya no quedan preguntas' }) }
      const pregunta = disponibles[crypto.randomInt(disponibles.length)]
      const segmento = state.preguntas.findIndex(id => Number(id) === Number(pregunta))
      const totalSegmentos = state.preguntas.length
      state.pregunta_activa = pregunta
      await conn.query('UPDATE salas SET estado_juego=? WHERE id_sala=?', [JSON.stringify(state),sala.id_sala])
      await conn.query(`INSERT INTO partida_acciones (id_sala,id_usuario,clave_accion,tipo_accion,objetivo,acierto,detalle)
        VALUES (?,?,?,'girar',?,1,?)`, [sala.id_sala,idUsuario,clave_accion,`giro-${pregunta}`,JSON.stringify({ id_pregunta: pregunta, segmento, total_segmentos: totalSegmentos })])
      const [[question]] = await conn.query('SELECT id_pregunta,pregunta,opcion_a,opcion_b,opcion_c,opcion_d FROM preguntas WHERE id_pregunta=?', [pregunta])
      await conn.commit()
      res.json({ mensaje: 'Ruleta girada', pregunta: question, segmento, total_segmentos: totalSegmentos })
    } catch (e) { await conn.rollback(); if (e.code === 'ER_DUP_ENTRY') return res.status(409).json({ mensaje: 'Giro duplicado' }); console.error(e); res.status(500).json({ mensaje: 'No se pudo girar la ruleta' }) }
    finally { conn.release() }
  })

  router.post('/:codigo/acciones', async (req, res) => {
    const { clave_accion, tipo_accion, objetivo, respuesta, selecciones } = req.body
    const id_usuario = req.usuario.id_usuario
    if (!id_usuario || !/^[\w-]{8,80}$/.test(String(clave_accion || '')) || !tipo_accion || (!objetivo && !Array.isArray(selecciones))) return res.status(400).json({ mensaje: 'Faltan datos de la acción o su clave única' })
    const conn = await db.getConnection()
    try {
      await conn.beginTransaction()
      const sala = await salaPorCodigo(req.params.codigo, conn)
      if (!sala) { await conn.rollback(); return res.status(404).json({ mensaje: 'Sala no encontrada' }) }
      const [[locked]] = await conn.query('SELECT * FROM salas WHERE id_sala=? FOR UPDATE', [sala.id_sala])
      const [[member]] = await conn.query('SELECT * FROM sala_participantes WHERE id_sala=? AND id_usuario=? FOR UPDATE', [sala.id_sala, id_usuario])
      if (!member || locked.estado !== 'en_curso') { await conn.rollback(); return res.status(409).json({ mensaje: 'No puedes actuar en esta partida' }) }
      const [[clock]] = await conn.query('SELECT TIMESTAMPDIFF(SECOND,inicia_en,NOW()) AS transcurrido FROM salas WHERE id_sala=?', [sala.id_sala])
      if (Number(clock.transcurrido) >= locked.limite_segundos) {
        await conn.query("UPDATE salas SET estado='finalizada',finaliza_en=NOW() WHERE id_sala=?", [sala.id_sala])
        await conn.query(`UPDATE partidas SET estado='tiempo_agotado',hora_fin=NOW(),tiempo_transcurrido=?,resultado_general='tiempo_agotado' WHERE id_sala=? AND estado='en_curso'`, [clock.transcurrido,sala.id_sala])
        await conn.query("UPDATE sala_participantes SET resultado='tiempo_agotado' WHERE id_sala=? AND resultado IS NULL", [sala.id_sala])
        await conn.commit()
        return res.status(409).json({ mensaje: 'Se agotó el tiempo de la partida' })
      }
      const type = normalizar(sala.tipo)
      const state = typeof locked.estado_juego === 'string' ? JSON.parse(locked.estado_juego || '{}') : (locked.estado_juego || {})
      const [duplicate] = await conn.query('SELECT id_accion, acierto FROM partida_acciones WHERE id_sala=? AND id_usuario=? AND clave_accion=?', [sala.id_sala,id_usuario,clave_accion])
      if (duplicate.length) { await conn.commit(); return res.json({ mensaje: 'Acción ya registrada', acierto: Boolean(duplicate[0].acierto), duplicada: true }) }
      const esSopa = type.includes('SOPA')
      const esCrucigrama = type.includes('CRUCIGRAMA')
      const sinTurnos = esSopa || (esCrucigrama && sala.modalidad === 'colaborativa')
      if (!sinTurnos && sala.modalidad === 'competitiva' && Number(locked.turno_usuario) !== Number(id_usuario)) { await conn.rollback(); return res.status(403).json({ mensaje: 'No es tu turno' }) }
      let acierto = false
      let detalle = {}
      let target = String(objetivo || '')
      let puntosAccion = 0
      if (esSopa) {
        if (!Array.isArray(selecciones) || selecciones.length < 2 || selecciones.length > 24 || !Array.isArray(state.tablero)) {
          await conn.rollback(); return res.status(400).json({ mensaje: 'Selecciona las letras de una palabra en el tablero' })
        }
        const entrada = selecciones.map(cell => ({ fila:Number(cell?.fila), columna:Number(cell?.columna) }))
        const size = state.tablero.length
        if (entrada.some(cell => !Number.isInteger(cell.fila) || !Number.isInteger(cell.columna) || cell.fila < 0 || cell.columna < 0 || cell.fila >= size || cell.columna >= size)) {
          await conn.rollback(); return res.status(400).json({ mensaje: 'La selección sale del tablero' })
        }
        const inicio = entrada[0]
        const fin = entrada[entrada.length - 1]
        const df = fin.fila - inicio.fila
        const dc = fin.columna - inicio.columna
        const pasos = Math.max(Math.abs(df), Math.abs(dc))
        if (!pasos || (df !== 0 && dc !== 0 && Math.abs(df) !== Math.abs(dc))) {
          await conn.rollback(); return res.status(400).json({ mensaje: 'Selecciona una línea recta de letras' })
        }
        const pasoFila = Math.sign(df)
        const pasoColumna = Math.sign(dc)
        // Pointer events can skip cells during a fast drag. The endpoints define
        // the selected straight line, so rebuild every cell on the server.
        const path = Array.from({length:pasos+1}, (_,index) => ({ fila:inicio.fila+pasoFila*index, columna:inicio.columna+pasoColumna*index }))
        const palabraSeleccionada = path.map(cell => state.tablero[cell.fila][cell.columna]).join('')
        const igual = (a,b) => a.length === b.length && a.every((cell,index) => cell.fila === b[index].fila && cell.columna === b[index].columna)
        const colocacion = (state.colocaciones || []).find(item => igual(path,item.celdas) || igual(path,[...item.celdas].reverse()))
        const miProgreso = state.progreso_por_usuario?.[String(id_usuario)] || []
        if (colocacion && miProgreso.includes(String(colocacion.id_palabra))) {
          await conn.rollback(); return res.status(409).json({ mensaje: 'Ya encontraste esa palabra; busca otra' })
        }
        acierto = Boolean(colocacion)
        if (colocacion) {
          target = String(colocacion.id_palabra)
          const primero = !state.primer_descubridor[target]
          if (primero) state.primer_descubridor[target] = id_usuario
          puntosAccion = primero ? 10 : 5
          miProgreso.push(target)
          state.progreso_por_usuario[String(id_usuario)] = miProgreso
          if (!state.completados.includes(target)) state.completados.push(target)
          detalle = { palabra: palabraSeleccionada, seleccion: path, primer_descubridor: primero }
        } else {
          target = `sopa-error-${clave_accion}`
          detalle = { seleccion: path }
        }
      } else if (type.includes('CRUCIGRAMA')) {
        const [items] = await conn.query('SELECT id_palabra,palabra FROM palabras_crucigrama WHERE id_juego=? AND id_palabra=?', [sala.id_juego, objetivo])
        if (!items.length) { await conn.rollback(); return res.status(400).json({ mensaje: 'Respuesta fuera de este juego' }) }
        target = String(items[0].id_palabra)
        acierto = normalizar(respuesta) === normalizar(items[0].palabra)
        detalle = { palabra: acierto ? items[0].palabra : null }
      } else if (type.includes('RULETA') || type.includes('PREGUNTA') || type.includes('QUIZ')) {
        if (type.includes('RULETA') && String(state.pregunta_activa) !== String(objetivo)) { await conn.rollback(); return res.status(409).json({ mensaje: 'Debes responder la pregunta asignada por la ruleta' }) }
        const [items] = await conn.query('SELECT id_pregunta,respuesta_correcta FROM preguntas WHERE id_juego=? AND id_pregunta=?', [sala.id_juego, objetivo])
        if (!items.length) { await conn.rollback(); return res.status(400).json({ mensaje: 'Pregunta fuera de este juego' }) }
        target = String(items[0].id_pregunta)
        acierto = String(respuesta || '').toUpperCase() === String(items[0].respuesta_correcta).toUpperCase()
      } else if (type.includes('DETECTIVE')) {
        const [items] = await conn.query('SELECT id_enigma,respuesta FROM enigmas_detective WHERE id_juego=? AND id_enigma=?', [sala.id_juego, objetivo])
        if (!items.length) { await conn.rollback(); return res.status(400).json({ mensaje: 'Enigma fuera de este juego' }) }
        target = String(items[0].id_enigma)
        acierto = normalizar(respuesta) === normalizar(items[0].respuesta)
      } else if (type.includes('MEMORAMA')) {
        if (!Array.isArray(selecciones) || selecciones.length !== 2 ||
            selecciones.some(token => typeof token !== 'string' || token.length > 80) || selecciones[0] === selecciones[1]) {
          await conn.rollback(); return res.status(400).json({ mensaje: 'Selecciona dos cartas válidas y distintas' })
        }
        const cards = selecciones.map(token => state.cartas?.find(card => card.token === token)).filter(Boolean)
        if (cards.length !== 2) { await conn.rollback(); return res.status(400).json({ mensaje: 'Carta fuera de este memorama' }) }
        if (cards.some(card => (state.cartas_resueltas || []).some(found => found.token === card.token))) {
          await conn.rollback(); return res.status(409).json({ mensaje: 'Una de esas cartas ya pertenece a una pareja resuelta' })
        }
        acierto = Number(cards[0].pareja) === Number(cards[1].pareja)
        target = acierto ? String(cards[0].pareja) : `fallo-${selecciones.join('-')}`
        req.reveladas = cards.map(card => ({ token: card.token, elemento: card.elemento }))
        detalle = { reveladas: req.reveladas }
      } else { await conn.rollback(); return res.status(422).json({ mensaje: 'Este tipo de juego aún no tiene acciones multijugador configuradas' }) }
      if (!esSopa && state.completados.includes(target)) { await conn.rollback(); return res.status(409).json({ mensaje: 'Ese elemento ya fue resuelto' }) }
      if (!esSopa) {
        const [prior] = await conn.query('SELECT id_accion FROM partida_acciones WHERE id_sala=? AND objetivo=? AND acierto=1', [sala.id_sala,target])
        if (prior.length) { await conn.rollback(); return res.status(409).json({ mensaje: 'Otro participante ya resolvió ese elemento' }) }
      }
      const tipoRegistrado = type.includes('MEMORAMA') ? 'memorama' : tipo_accion
      await conn.query(`INSERT INTO partida_acciones (id_sala,id_usuario,clave_accion,tipo_accion,objetivo,acierto,detalle)
        VALUES (?,?,?,?,?,?,?)`, [sala.id_sala,id_usuario,clave_accion,tipoRegistrado,target,acierto,JSON.stringify(detalle)])
      if (!esSopa) puntosAccion = acierto ? 10 : 0
      await conn.query(`UPDATE sala_participantes SET aciertos=aciertos+?, errores=errores+?, puntuacion=puntuacion+?
        WHERE id_sala=? AND id_usuario=?`, [acierto ? 1 : 0, acierto ? 0 : 1, puntosAccion, sala.id_sala,id_usuario])
      if (acierto) {
        if (!esSopa) state.completados.push(target)
        if (type.includes('MEMORAMA')) state.cartas_resueltas.push(...req.reveladas)
      }
      if (type.includes('RULETA')) state.pregunta_activa = null
      const [players] = await conn.query('SELECT id_usuario FROM sala_participantes WHERE id_sala=? ORDER BY unido_en,id_usuario', [sala.id_sala])
      const idx = players.findIndex(p => Number(p.id_usuario) === Number(id_usuario))
      const turn = players[(idx + 1) % players.length].id_usuario
      const progresoJugador = esSopa ? (state.progreso_por_usuario?.[String(id_usuario)] || []).length : state.completados.length
      const done = progresoJugador >= state.total
      const siguienteTurno = sinTurnos ? null : turn
      await conn.query('UPDATE salas SET estado_juego=?, turno_usuario=?, estado=?, finaliza_en=IF(?,NOW(),finaliza_en) WHERE id_sala=?',
        [JSON.stringify(state),siguienteTurno,done ? 'finalizada' : 'en_curso',done,sala.id_sala])
      if (done) {
        let outcome
        if (esSopa) {
          outcome = 'ganador'
          await conn.query("UPDATE sala_participantes SET resultado=CASE WHEN id_usuario=? THEN 'ganador' ELSE 'participó' END WHERE id_sala=?", [id_usuario,sala.id_sala])
        } else if (sala.modalidad === 'colaborativa') {
          outcome = 'objetivo_cumplido'
          await conn.query("UPDATE sala_participantes SET resultado='objetivo_cumplido' WHERE id_sala=?", [sala.id_sala])
        } else {
          const [[score]] = await conn.query('SELECT MAX(puntuacion) AS maximo FROM sala_participantes WHERE id_sala=?', [sala.id_sala])
          const [winners] = await conn.query('SELECT id_usuario FROM sala_participantes WHERE id_sala=? AND puntuacion=?', [sala.id_sala, score.maximo])
          outcome = winners.length > 1 ? 'empate' : 'ganador'
          await conn.query("UPDATE sala_participantes SET resultado=CASE WHEN puntuacion=? THEN ? ELSE 'participó' END WHERE id_sala=?", [score.maximo, outcome, sala.id_sala])
        }
        await conn.query(`UPDATE partidas SET estado='finalizada',hora_fin=NOW(),tiempo_transcurrido=TIMESTAMPDIFF(SECOND,hora_inicio,NOW()),resultado_general=? WHERE id_sala=?`, [outcome,sala.id_sala])
      }
      await conn.commit()
      res.json({ mensaje: esSopa ? (acierto ? `¡Encontraste ${detalle.palabra}! +${puntosAccion} puntos` : 'Esa selección no forma una palabra. Sigue buscando.') : acierto ? '¡Correcto!' : 'Respuesta incorrecta', acierto, puntos: puntosAccion, reveladas: req.reveladas, turno_usuario: turn, finalizada: done, avance: progresoJugador, restantes: esSopa ? Math.max(0,state.total-progresoJugador) : undefined, total: state.total })
    } catch (e) { await conn.rollback(); if (e.code === 'ER_DUP_ENTRY') return res.status(409).json({ mensaje: 'Acción duplicada' }); console.error(e); res.status(500).json({ mensaje: 'No se pudo registrar la acción' }) }
    finally { conn.release() }
  })

  return router
}
