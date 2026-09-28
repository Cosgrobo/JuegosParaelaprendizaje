
const express = require('express')
const cors = require('cors')
const conexion = require('./db')
const bcrypt = require('bcrypt')


const app = express()
const PORT = 3000


// ========================================
// MIDDLEWARES
// ========================================

app.use(cors())
app.use(express.json())


// ========================================
// RUTA PRINCIPAL
// ========================================

app.get('/', (req, res) => {
  res.json({
    mensaje: 'API de Juegos Educativos funcionando'
  })
})


// ========================================
// OBTENER TODOS LOS JUEGOS ACTIVOS
// ========================================

app.get('/api/juegos', async (req, res) => {
  try {
    const [juegos] = await conexion.query(`
      SELECT
        j.id_juego,
        j.nombre,
        j.descripcion,
        j.instrucciones,
        j.activo,
        t.nombre AS tipo
      FROM juegos j
      INNER JOIN tipos_juego t
        ON j.id_tipo = t.id_tipo
      WHERE j.activo = TRUE
      ORDER BY j.id_juego
    `)

    res.json(juegos)

  } catch (error) {
    console.error(
      'Error al obtener los juegos:',
      error.message
    )

    res.status(500).json({
      mensaje: 'Error al obtener los juegos'
    })
  }
})


// ========================================
// OBTENER UN JUEGO POR ID
// ========================================

app.get('/api/juegos/:id', async (req, res) => {
  try {
    const { id } = req.params

    const [juegos] = await conexion.query(
      `
      SELECT
        j.id_juego,
        j.nombre,
        j.descripcion,
        j.instrucciones,
        j.activo,
        j.id_tipo,
        t.nombre AS tipo
      FROM juegos j
      INNER JOIN tipos_juego t
        ON j.id_tipo = t.id_tipo
      WHERE j.id_juego = ?
      `,
      [id]
    )

    if (juegos.length === 0) {
      return res.status(404).json({
        mensaje: 'El juego no existe'
      })
    }

    res.json(juegos[0])

  } catch (error) {
    console.error(
      'Error al obtener el juego:',
      error.message
    )

    res.status(500).json({
      mensaje: 'Error al obtener el juego'
    })
  }
})


// ========================================
// OBTENER TIPOS DE JUEGO
// ========================================

app.get('/api/tipos-juego', async (req, res) => {
  try {
    const [tipos] = await conexion.query(`
      SELECT
        id_tipo,
        nombre
      FROM tipos_juego
      ORDER BY id_tipo
    `)

    res.json(tipos)

  } catch (error) {
    console.error(
      'Error al obtener los tipos de juego:',
      error.message
    )

    res.status(500).json({
      mensaje: 'Error al obtener los tipos de juego'
    })
  }
})


// ========================================
// OBTENER PALABRAS DE UNA SOPA DE LETRAS
// ========================================

app.get('/api/juegos/:id/palabras-sopa', async (req, res) => {
  try {
    const { id } = req.params

    const [palabras] = await conexion.query(
      `
      SELECT
        id_palabra,
        palabra,
        pista
      FROM palabras_sopa
      WHERE id_juego = ?
      ORDER BY id_palabra
      `,
      [id]
    )

    res.json(palabras)

  } catch (error) {
    console.error(
      'Error al obtener las palabras de la sopa:',
      error.message
    )

    res.status(500).json({
      mensaje: 'Error al obtener las palabras de la sopa'
    })
  }
})


// ========================================
// AGREGAR PALABRA A UNA SOPA DE LETRAS
// ========================================

app.post('/api/juegos/:id/palabras-sopa', async (req, res) => {
  try {
    const { id } = req.params
    const { palabra, pista } = req.body

    if (!palabra) {
      return res.status(400).json({
        mensaje: 'La palabra es obligatoria'
      })
    }

    const [juegos] = await conexion.query(
      `
      SELECT id_juego
      FROM juegos
      WHERE id_juego = ?
      `,
      [id]
    )

    if (juegos.length === 0) {
      return res.status(404).json({
        mensaje: 'El juego no existe'
      })
    }

    const [resultado] = await conexion.query(
      `
      INSERT INTO palabras_sopa
      (
        id_juego,
        palabra,
        pista
      )
      VALUES (?, ?, ?)
      `,
      [
        id,
        palabra.toUpperCase(),
        pista || null
      ]
    )

    res.status(201).json({
      mensaje: 'Palabra agregada correctamente',

      palabra: {
        id_palabra: resultado.insertId,
        id_juego: id,
        palabra: palabra.toUpperCase(),
        pista: pista || null
      }
    })

  } catch (error) {
    console.error(
      'Error al agregar palabra a la sopa:',
      error.message
    )

    res.status(500).json({
      mensaje: 'Error interno del servidor'
    })
  }
})


// Obtener palabras y posiciones de un crucigrama
app.get('/api/juegos/:id/crucigrama', async (req, res) => {
  try {
    const [palabras] = await conexion.query(`
      SELECT id_palabra, palabra, pista, fila, columna, direccion
      FROM palabras_crucigrama
      WHERE id_juego = ?
      ORDER BY id_palabra
    `, [req.params.id])

    res.json(palabras)
  } catch (error) {
    console.error('Error al obtener el crucigrama:', error.message)
    res.status(500).json({ mensaje: 'Error al obtener el crucigrama' })
  }
})

// Reemplazar las palabras de una sopa de letras
app.put('/api/juegos/:id/palabras-sopa', async (req, res) => {
  const { id } = req.params
  const palabras = req.body.palabras
  if (!Array.isArray(palabras) || palabras.length === 0) {
    return res.status(400).json({ mensaje: 'Agrega al menos una palabra a la sopa' })
  }

  const normalizadas = palabras.map((item) => ({
    palabra: String(item.palabra || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/[^A-Z]/g, ''),
    pista: String(item.pista || '').trim() || null
  }))
  if (normalizadas.some((item) => !item.palabra || item.palabra.length > 10)) {
    return res.status(400).json({ mensaje: 'Cada palabra debe tener entre 1 y 10 letras' })
  }

  let conexionBD
  try {
    const [juegos] = await conexion.query('SELECT id_juego FROM juegos WHERE id_juego = ?', [id])
    if (!juegos.length) return res.status(404).json({ mensaje: 'El juego no existe' })

    conexionBD = await conexion.getConnection()
    await conexionBD.beginTransaction()
    await conexionBD.query('DELETE FROM palabras_sopa WHERE id_juego = ?', [id])
    for (const item of normalizadas) {
      await conexionBD.query(
        'INSERT INTO palabras_sopa (id_juego, palabra, pista) VALUES (?, ?, ?)',
        [id, item.palabra, item.pista]
      )
    }
    await conexionBD.commit()
    res.json({ mensaje: 'Palabras de la sopa guardadas correctamente' })
  } catch (error) {
    if (conexionBD) await conexionBD.rollback()
    console.error('Error al guardar las palabras de la sopa:', error.message)
    res.status(500).json({ mensaje: 'Error al guardar las palabras de la sopa' })
  } finally {
    if (conexionBD) conexionBD.release()
  }
})

// Reemplazar de forma atómica el contenido de un crucigrama
app.put('/api/juegos/:id/crucigrama', async (req, res) => {
  const { id } = req.params
  const palabras = req.body.palabras
  if (!Array.isArray(palabras) || palabras.length === 0) {
    return res.status(400).json({ mensaje: 'Agrega al menos una palabra al crucigrama' })
  }

  const normalizadas = palabras.map((item) => ({
    palabra: String(item.palabra || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/[^A-Z]/g, ''),
    pista: String(item.pista || '').trim(),
    fila: Number(item.fila),
    columna: Number(item.columna),
    direccion: item.direccion
  }))
  const invalida = normalizadas.some((item) =>
    !item.palabra || !item.pista || !Number.isInteger(item.fila) ||
    !Number.isInteger(item.columna) || item.fila < 0 || item.fila > 9 ||
    item.columna < 0 || item.columna > 14 ||
    !['horizontal', 'vertical'].includes(item.direccion) ||
    (item.direccion === 'horizontal' && item.columna + item.palabra.length > 15) ||
    (item.direccion === 'vertical' && item.fila + item.palabra.length > 10)
  )
  if (invalida) {
    return res.status(400).json({ mensaje: 'Revisa palabras, pistas y posiciones: deben caber en el tablero de 10 × 15' })
  }

  const letrasEnTablero = new Map()
  for (const item of normalizadas) {
    for (let indice = 0; indice < item.palabra.length; indice++) {
      const fila = item.fila + (item.direccion === 'vertical' ? indice : 0)
      const columna = item.columna + (item.direccion === 'horizontal' ? indice : 0)
      const casilla = `${fila},${columna}`
      if (letrasEnTablero.has(casilla) && letrasEnTablero.get(casilla) !== item.palabra[indice]) {
        return res.status(400).json({ mensaje: 'Las palabras se cruzan con letras distintas. Ajusta las posiciones antes de guardar.' })
      }
      letrasEnTablero.set(casilla, item.palabra[indice])
    }
  }

  let conexionBD
  try {
    const [juegos] = await conexion.query('SELECT id_juego FROM juegos WHERE id_juego = ?', [id])
    if (!juegos.length) return res.status(404).json({ mensaje: 'El juego no existe' })

    conexionBD = await conexion.getConnection()
    await conexionBD.beginTransaction()
    await conexionBD.query('DELETE FROM palabras_crucigrama WHERE id_juego = ?', [id])
    for (const item of normalizadas) {
      await conexionBD.query(`
        INSERT INTO palabras_crucigrama (id_juego, palabra, pista, fila, columna, direccion)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [id, item.palabra, item.pista, item.fila, item.columna, item.direccion])
    }
    await conexionBD.commit()
    res.json({ mensaje: 'Crucigrama guardado correctamente' })
  } catch (error) {
    if (conexionBD) await conexionBD.rollback()
    console.error('Error al guardar el crucigrama:', error.message)
    res.status(500).json({ mensaje: 'Error al guardar el crucigrama' })
  } finally {
    if (conexionBD) conexionBD.release()
  }
})

// ========================================
// OBTENER PREGUNTAS DE UN JUEGO
// ========================================

app.get('/api/juegos/:id/preguntas', async (req, res) => {
  try {
    const { id } = req.params

    const [preguntas] = await conexion.query(
      `
      SELECT
        id_pregunta,
        id_juego,
        pregunta,
        opcion_a,
        opcion_b,
        opcion_c,
        opcion_d,
        respuesta_correcta
      FROM preguntas
      WHERE id_juego = ?
      ORDER BY id_pregunta
      `,
      [id]
    )

    res.json(preguntas)

  } catch (error) {
    console.error(
      'Error al obtener las preguntas:',
      error.message
    )

    res.status(500).json({
      mensaje: 'Error al obtener las preguntas'
    })
  }
})


// ========================================
// AGREGAR PREGUNTA A UN JUEGO
// ========================================

app.post('/api/juegos/:id/preguntas', async (req, res) => {
  try {
    const { id } = req.params

    const {
      pregunta,
      opcion_a,
      opcion_b,
      opcion_c,
      opcion_d,
      respuesta_correcta
    } = req.body

    if (
      !pregunta ||
      !opcion_a ||
      !opcion_b ||
      !opcion_c ||
      !opcion_d ||
      !respuesta_correcta
    ) {
      return res.status(400).json({
        mensaje: 'Todos los campos de la pregunta son obligatorios'
      })
    }

    const respuesta = respuesta_correcta
      .toString()
      .trim()
      .toUpperCase()

    if (!['A', 'B', 'C', 'D'].includes(respuesta)) {
      return res.status(400).json({
        mensaje: 'La respuesta correcta debe ser A, B, C o D'
      })
    }

    const [juegos] = await conexion.query(
      `
      SELECT id_juego
      FROM juegos
      WHERE id_juego = ?
      `,
      [id]
    )

    if (juegos.length === 0) {
      return res.status(404).json({
        mensaje: 'El juego no existe'
      })
    }

    const [resultado] = await conexion.query(
      `
      INSERT INTO preguntas
      (
        id_juego,
        pregunta,
        opcion_a,
        opcion_b,
        opcion_c,
        opcion_d,
        respuesta_correcta
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [
        id,
        pregunta,
        opcion_a,
        opcion_b,
        opcion_c,
        opcion_d,
        respuesta
      ]
    )

    res.status(201).json({
      mensaje: 'Pregunta agregada correctamente',

      pregunta: {
        id_pregunta: resultado.insertId,
        id_juego: Number(id),
        pregunta,
        opcion_a,
        opcion_b,
        opcion_c,
        opcion_d,
        respuesta_correcta: respuesta
      }
    })

  } catch (error) {
    console.error(
      'Error al agregar la pregunta:',
      error.message
    )

    res.status(500).json({
      mensaje: 'Error interno del servidor'
    })
  }
})


// ========================================
// CREAR UN JUEGO
// ========================================

app.post('/api/juegos', async (req, res) => {
  try {
    const {
      nombre,
      descripcion,
      instrucciones,
      id_tipo,
      activo
    } = req.body

    if (
      !nombre ||
      !descripcion ||
      !instrucciones ||
      !id_tipo
    ) {
      return res.status(400).json({
        mensaje:
          'Nombre, descripción, instrucciones y tipo de juego son obligatorios'
      })
    }

    const [tipos] = await conexion.query(
      `
      SELECT id_tipo
      FROM tipos_juego
      WHERE id_tipo = ?
      `,
      [id_tipo]
    )

    if (tipos.length === 0) {
      return res.status(404).json({
        mensaje: 'El tipo de juego no existe'
      })
    }

    const [resultado] = await conexion.query(
      `
      INSERT INTO juegos
      (
        nombre,
        descripcion,
        instrucciones,
        id_tipo,
        activo
      )
      VALUES (?, ?, ?, ?, ?)
      `,
      [
        nombre,
        descripcion,
        instrucciones,
        id_tipo,
        activo !== undefined ? activo : true
      ]
    )

    res.status(201).json({
      mensaje: 'Juego creado correctamente',

      juego: {
        id_juego: resultado.insertId,
        nombre,
        descripcion,
        instrucciones,
        id_tipo,
        activo: activo !== undefined ? activo : true
      }
    })

  } catch (error) {
    console.error(
      'Error al crear el juego:',
      error.message
    )

    res.status(500).json({
      mensaje: 'Error interno del servidor'
    })
  }
})


// ========================================
// EDITAR UN JUEGO
// ========================================

app.put('/api/juegos/:id', async (req, res) => {
  try {
    const { id } = req.params

    const {
      nombre,
      descripcion,
      instrucciones,
      activo
    } = req.body

    if (!nombre || !descripcion || !instrucciones) {
      return res.status(400).json({
        mensaje:
          'Nombre, descripción e instrucciones son obligatorios'
      })
    }

    const [juegos] = await conexion.query(
      `
      SELECT id_juego
      FROM juegos
      WHERE id_juego = ?
      `,
      [id]
    )

    if (juegos.length === 0) {
      return res.status(404).json({
        mensaje: 'El juego no existe'
      })
    }

    await conexion.query(
      `
      UPDATE juegos
      SET
        nombre = ?,
        descripcion = ?,
        instrucciones = ?,
        activo = ?
      WHERE id_juego = ?
      `,
      [
        nombre,
        descripcion,
        instrucciones,
        activo,
        id
      ]
    )

    res.json({
      mensaje: 'Juego actualizado correctamente'
    })

  } catch (error) {
    console.error(
      'Error al actualizar el juego:',
      error.message
    )

    res.status(500).json({
      mensaje: 'Error interno del servidor'
    })
  }
})


// ========================================
// DESACTIVAR UN JUEGO
// ========================================

app.patch('/api/juegos/:id/desactivar', async (req, res) => {
  try {
    const { id } = req.params

    const [juegos] = await conexion.query(
      `
      SELECT
        id_juego,
        activo
      FROM juegos
      WHERE id_juego = ?
      `,
      [id]
    )

    if (juegos.length === 0) {
      return res.status(404).json({
        mensaje: 'El juego no existe'
      })
    }

    if (!juegos[0].activo) {
      return res.status(400).json({
        mensaje: 'El juego ya está desactivado'
      })
    }

    await conexion.query(
      `
      UPDATE juegos
      SET activo = FALSE
      WHERE id_juego = ?
      `,
      [id]
    )

    res.json({
      mensaje: 'Juego desactivado correctamente'
    })

  } catch (error) {
    console.error(
      'Error al desactivar el juego:',
      error.message
    )

    res.status(500).json({
      mensaje: 'Error interno del servidor'
    })
  }
})


// ========================================
// LOGIN
// ========================================

app.post('/api/login', async (req, res) => {
  try {
    const { usuario, contraseña } = req.body

    if (!usuario || !contraseña) {
      return res.status(400).json({
        mensaje: 'Usuario y contraseña son obligatorios'
      })
    }

    const [usuarios] = await conexion.query(
      `
      SELECT
        id_usuario,
        nombre,
        usuario
      FROM usuarios
      WHERE usuario = ?
      AND contraseña = ?
      `,
      [usuario, contraseña]
    )

    if (usuarios.length === 0) {
      return res.status(401).json({
        mensaje: 'Usuario o contraseña incorrectos'
      })
    }

    const usuarioEncontrado = usuarios[0]

    res.json({
      mensaje: 'Inicio de sesión correcto',
      usuario: usuarioEncontrado
    })

  } catch (error) {
    console.error(
      'Error en el login:',
      error.message
    )

    res.status(500).json({
      mensaje: 'Error interno del servidor'
    })
  }
})


// ========================================
// REGISTRO
// ========================================

app.post('/api/registro', async (req, res) => {
  try {
    const { nombre, usuario, contraseña } = req.body

    if (!nombre || !usuario || !contraseña) {
      return res.status(400).json({
        mensaje: 'Todos los campos son obligatorios'
      })
    }

    const [usuariosExistentes] = await conexion.query(
      `
      SELECT id_usuario
      FROM usuarios
      WHERE usuario = ?
      `,
      [usuario]
    )

    if (usuariosExistentes.length > 0) {
      return res.status(409).json({
        mensaje: 'Ese usuario ya está registrado'
      })
    }

    const [resultado] = await conexion.query(
      `
      INSERT INTO usuarios
      (nombre, usuario, contraseña)
      VALUES (?, ?, ?)
      `,
      [nombre, usuario, contraseña]
    )

    res.status(201).json({
      mensaje: 'Usuario registrado correctamente',

      usuario: {
        id_usuario: resultado.insertId,
        nombre: nombre,
        usuario: usuario
      }
    })

  } catch (error) {
    console.error(
      'Error en el registro:',
      error.message
    )

    res.status(500).json({
      mensaje: 'Error interno del servidor'
    })
  }
})

// ========================================
// OBTENER ENIGMAS DEL JUEGO DETECTIVE
// ========================================

app.get('/api/juegos/:id/enigmas', async (req, res) => {
  try {
    const { id } = req.params

    const [enigmas] = await conexion.query(
      `
      SELECT
        id_enigma,
        id_juego,
        materia,
        titulo,
        respuesta,
        pista_1,
        pista_2,
        pista_3
      FROM enigmas_detective
      WHERE id_juego = ?
      ORDER BY id_enigma
      `,
      [id]
    )

    res.json(enigmas)

  } catch (error) {
    console.error(
      'Error al obtener los enigmas:',
      error.message
    )

    res.status(500).json({
      mensaje: 'Error al obtener los enigmas'
    })
  }
})

// ========================================
// GUARDAR ENIGMAS DEL JUEGO DETECTIVE
// ========================================

app.put('/api/juegos/:id/enigmas', async (req, res) => {
  const { id } = req.params
  const enigmas = req.body.enigmas

  // Comprobar que se haya enviado al menos un enigma
  if (!Array.isArray(enigmas) || enigmas.length === 0) {
    return res.status(400).json({
      mensaje: 'Agrega al menos un enigma al juego Detective'
    })
  }

  // Limpiar los datos recibidos
  const normalizados = enigmas.map((item) => ({
    materia: String(item.materia || '').trim(),
    titulo: String(item.titulo || '').trim(),
    respuesta: String(item.respuesta || '').trim(),
    pista_1: String(item.pista_1 || '').trim(),
    pista_2: String(item.pista_2 || '').trim(),
    pista_3: String(item.pista_3 || '').trim()
  }))

  // Verificar que ningún campo esté vacío
  const hayCamposVacios = normalizados.some((item) =>
    !item.materia ||
    !item.titulo ||
    !item.respuesta ||
    !item.pista_1 ||
    !item.pista_2 ||
    !item.pista_3
  )

  if (hayCamposVacios) {
    return res.status(400).json({
      mensaje: 'Todos los campos de los enigmas son obligatorios'
    })
  }

  let conexionBD

  try {

    // Comprobar que el juego existe
    const [juegos] = await conexion.query(
      'SELECT id_juego FROM juegos WHERE id_juego = ?',
      [id]
    )

    if (!juegos.length) {
      return res.status(404).json({
        mensaje: 'El juego no existe'
      })
    }

    // Obtener una conexión para la transacción
    conexionBD = await conexion.getConnection()

    await conexionBD.beginTransaction()

    // Eliminar enigmas anteriores
    await conexionBD.query(
      'DELETE FROM enigmas_detective WHERE id_juego = ?',
      [id]
    )

    // Insertar los nuevos enigmas
    for (const enigma of normalizados) {

      await conexionBD.query(
        `
        INSERT INTO enigmas_detective
        (
          id_juego,
          materia,
          titulo,
          respuesta,
          pista_1,
          pista_2,
          pista_3
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
        [
          id,
          enigma.materia,
          enigma.titulo,
          enigma.respuesta,
          enigma.pista_1,
          enigma.pista_2,
          enigma.pista_3
        ]
      )
    }

    await conexionBD.commit()

    res.json({
      mensaje: 'Enigmas del Detective guardados correctamente'
    })

  } catch (error) {

    if (conexionBD) {
      await conexionBD.rollback()
    }

    console.error(
      'Error al guardar los enigmas del Detective:',
      error.message
    )

    res.status(500).json({
      mensaje: 'Error al guardar los enigmas del Detective'
    })

  } finally {

    if (conexionBD) {
      conexionBD.release()
    }
  }
})

// ========================================
// OBTENER PAREJAS DEL MEMORAMA
// ========================================

app.get('/api/juegos/:id/memorama', async (req, res) => {
  try {
    const { id } = req.params

    const [parejas] = await conexion.query(
      `
      SELECT
        id_pareja,
        id_juego,
        elemento_1,
        elemento_2
      FROM parejas_memorama
      WHERE id_juego = ?
      ORDER BY id_pareja
      `,
      [id]
    )

    res.json(parejas)

  } catch (error) {

    console.error(
      'Error al obtener las parejas del memorama:',
      error.message
    )

    res.status(500).json({
      mensaje: 'Error al obtener las parejas del memorama'
    })
  }
})
// ========================================
// GUARDAR PAREJAS DEL MEMORAMA
// ========================================

app.put('/api/juegos/:id/memorama', async (req, res) => {
  const { id } = req.params
  const parejas = req.body.parejas

  if (!Array.isArray(parejas) || parejas.length === 0) {
    return res.status(400).json({
      mensaje: 'Agrega al menos una pareja al memorama'
    })
  }

  const normalizadas = parejas.map((item) => ({
    elemento_1: String(item.elemento_1 || '').trim(),
    elemento_2: String(item.elemento_2 || '').trim()
  }))

  if (
    normalizadas.some(
      (item) => !item.elemento_1 || !item.elemento_2
    )
  ) {
    return res.status(400).json({
      mensaje: 'Todos los elementos de las parejas son obligatorios'
    })
  }

  let conexionBD

  try {
    const [juegos] = await conexion.query(
      'SELECT id_juego FROM juegos WHERE id_juego = ?',
      [id]
    )

    if (!juegos.length) {
      return res.status(404).json({
        mensaje: 'El juego no existe'
      })
    }

    conexionBD = await conexion.getConnection()

    await conexionBD.beginTransaction()

    await conexionBD.query(
      'DELETE FROM parejas_memorama WHERE id_juego = ?',
      [id]
    )

    for (const pareja of normalizadas) {
      await conexionBD.query(
        `
        INSERT INTO parejas_memorama
        (
          id_juego,
          elemento_1,
          elemento_2
        )
        VALUES (?, ?, ?)
        `,
        [
          id,
          pareja.elemento_1,
          pareja.elemento_2
        ]
      )
    }

    await conexionBD.commit()

    res.json({
      mensaje: 'Parejas del memorama guardadas correctamente'
    })

  } catch (error) {

    if (conexionBD) {
      await conexionBD.rollback()
    }

    console.error(
      'Error al guardar las parejas del memorama:',
      error.message
    )

    res.status(500).json({
      mensaje: 'Error al guardar las parejas del memorama'
    })

  } finally {

    if (conexionBD) {
      conexionBD.release()
    }
  }
})
// ========================================
// OBTENER PALABRAS DEL CRUCIGRAMA
// ========================================

app.get('/api/juegos/:id/crucigrama', async (req, res) => {
  try {
    const { id } = req.params

    const [palabras] = await conexion.query(
      `
      SELECT
        id_palabra,
        id_juego,
        palabra,
        pista,
        fila,
        columna,
        direccion
      FROM palabras_crucigrama
      WHERE id_juego = ?
      ORDER BY id_palabra
      `,
      [id]
    )

    res.json(palabras)

  } catch (error) {
    console.error(
      'Error al obtener las palabras del crucigrama:',
      error.message
    )

    res.status(500).json({
      mensaje: 'Error al obtener las palabras del crucigrama'
    })
  }
})
// ========================================
// GUARDAR RESULTADO
// ========================================

app.post('/api/resultados', async (req, res) => {
  try {
    const {
      id_usuario,
      id_juego,
      hora_inicio,
      hora_fin,
      tiempo_transcurrido,
      aciertos,
      errores,
      puntuacion
    } = req.body

    if (
      !id_usuario ||
      !id_juego ||
      !hora_inicio ||
      !hora_fin ||
      tiempo_transcurrido === undefined ||
      aciertos === undefined ||
      errores === undefined ||
      puntuacion === undefined
    ) {
      return res.status(400).json({
        mensaje: 'Todos los datos del resultado son obligatorios'
      })
    }

    // Comprobar usuario
    const [usuarios] = await conexion.query(
      `
      SELECT id_usuario
      FROM usuarios
      WHERE id_usuario = ?
      `,
      [id_usuario]
    )

    if (usuarios.length === 0) {
      return res.status(404).json({
        mensaje: 'El usuario no existe'
      })
    }

    // Comprobar juego
    const [juegos] = await conexion.query(
      `
      SELECT id_juego
      FROM juegos
      WHERE id_juego = ?
      `,
      [id_juego]
    )

    if (juegos.length === 0) {
      return res.status(404).json({
        mensaje: 'El juego no existe'
      })
    }

    // Guardar resultado
    const [resultado] = await conexion.query(
      `
      INSERT INTO resultados
      (
        id_usuario,
        id_juego,
        fecha,
        hora_inicio,
        hora_fin,
        tiempo_transcurrido,
        aciertos,
        errores,
        puntuacion
      )
      VALUES (?, ?, CURDATE(), ?, ?, ?, ?, ?, ?)
      `,
      [
        id_usuario,
        id_juego,
        hora_inicio,
        hora_fin,
        tiempo_transcurrido,
        aciertos,
        errores,
        puntuacion
      ]
    )

    res.status(201).json({
      mensaje: 'Resultado guardado correctamente',

      resultado: {
        id_resultado: resultado.insertId,
        id_usuario,
        id_juego,
        tiempo_transcurrido,
        aciertos,
        errores,
        puntuacion
      }
    })

  } catch (error) {
    console.error(
      'Error al guardar el resultado:',
      error.message
    )

    res.status(500).json({
      mensaje: 'Error interno del servidor'
    })
  }
})


// ========================================
// OBTENER HISTORIAL DE UN USUARIO
// ========================================

app.get('/api/resultados/usuario/:id', async (req, res) => {
  try {
    const { id } = req.params

    const [resultados] = await conexion.query(
      `
      SELECT
        r.id_resultado,
        r.id_usuario,
        r.id_juego,
        j.nombre AS juego,
        t.nombre AS tipo,
        r.fecha,
        r.hora_inicio,
        r.hora_fin,
        r.tiempo_transcurrido,
        r.aciertos,
        r.errores,
        r.puntuacion
      FROM resultados r
      INNER JOIN juegos j
        ON r.id_juego = j.id_juego
      INNER JOIN tipos_juego t
        ON j.id_tipo = t.id_tipo
      WHERE r.id_usuario = ?
      ORDER BY r.id_resultado DESC
      `,
      [id]
    )

    res.json(resultados)

  } catch (error) {
    console.error(
      'Error al obtener el historial:',
      error.message
    )

    res.status(500).json({
      mensaje: 'Error al obtener el historial'
    })
  }
})


// ========================================
// INICIAR SERVIDOR
// ========================================

app.listen(PORT, () => {
  console.log(
    `🚀 Servidor ejecutándose en http://localhost:${PORT}`
  )
})
