const express = require('express')
const cors = require('cors')
const conexion = require('./db')
const bcrypt = require('bcrypt')
const http = require('http')
const { Server } = require('socket.io')


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
        j.id_unidad,
        u.nombre AS unidad,
        t.nombre AS tipo
      FROM juegos j
      INNER JOIN tipos_juego t
        ON j.id_tipo = t.id_tipo
      LEFT JOIN unidades u
        ON j.id_unidad = u.id_unidad
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
        j.id_unidad,
        u.nombre AS unidad,
        t.nombre AS tipo
      FROM juegos j
      INNER JOIN tipos_juego t
        ON j.id_tipo = t.id_tipo
      LEFT JOIN unidades u
        ON j.id_unidad = u.id_unidad
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
// UNIDADES
// ========================================

app.get('/api/unidades', async (req, res) => {
  try {
    const [unidades] = await conexion.query(`
      SELECT id_unidad, nombre
      FROM unidades
      ORDER BY id_unidad
    `)

    res.json(unidades)
  } catch (error) {
    console.error('Error al obtener unidades:', error.message)
    res.status(500).json({ mensaje: 'No se pudieron obtener las unidades' })
  }
})

app.post('/api/unidades', async (req, res) => {
  try {
    const nombre = String(req.body.nombre || '').trim()

    if (!nombre || nombre.length > 100) {
      return res.status(400).json({
        mensaje: 'Escribe un nombre de unidad de hasta 100 caracteres'
      })
    }

    const [existentes] = await conexion.query(
      'SELECT id_unidad FROM unidades WHERE nombre = ?',
      [nombre]
    )

    if (existentes.length > 0) {
      return res.status(409).json({ mensaje: 'Ya existe una unidad con ese nombre' })
    }

    const [resultado] = await conexion.query(
      'INSERT INTO unidades (nombre) VALUES (?)',
      [nombre]
    )

    res.status(201).json({
      mensaje: 'Unidad creada correctamente',
      unidad: { id_unidad: resultado.insertId, nombre }
    })
  } catch (error) {
    console.error('Error al crear unidad:', error.message)
    res.status(500).json({ mensaje: 'No se pudo crear la unidad' })
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


// ========================================
// OBTENER PALABRAS Y POSICIONES DE CRUCIGRAMA
// ========================================

app.get('/api/juegos/:id/crucigrama', async (req, res) => {
  try {
    const [palabras] = await conexion.query(`
      SELECT
        id_palabra,
        palabra,
        pista,
        fila,
        columna,
        direccion
      FROM palabras_crucigrama
      WHERE id_juego = ?
      ORDER BY id_palabra
    `, [req.params.id])

    res.json(palabras)

  } catch (error) {
    console.error(
      'Error al obtener el crucigrama:',
      error.message
    )

    res.status(500).json({
      mensaje: 'Error al obtener el crucigrama'
    })
  }
})


// ========================================
// REEMPLAZAR LAS PALABRAS DE UNA SOPA
// ========================================

app.put('/api/juegos/:id/palabras-sopa', async (req, res) => {
  const { id } = req.params
  const palabras = req.body.palabras

  if (!Array.isArray(palabras) || palabras.length === 0) {
    return res.status(400).json({
      mensaje: 'Agrega al menos una palabra a la sopa'
    })
  }

  const normalizadas = palabras.map((item) => ({
    palabra: String(item.palabra || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase()
      .replace(/[^A-Z]/g, ''),

    pista: String(item.pista || '').trim() || null
  }))

  if (
    normalizadas.some(
      (item) => !item.palabra || item.palabra.length > 10
    )
  ) {
    return res.status(400).json({
      mensaje: 'Cada palabra debe tener entre 1 y 10 letras'
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
      'DELETE FROM palabras_sopa WHERE id_juego = ?',
      [id]
    )

    for (const item of normalizadas) {
      await conexionBD.query(
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
          item.palabra,
          item.pista
        ]
      )
    }

    await conexionBD.commit()

    res.json({
      mensaje: 'Palabras de la sopa guardadas correctamente'
    })

  } catch (error) {

    if (conexionBD) {
      await conexionBD.rollback()
    }

    console.error(
      'Error al guardar las palabras de la sopa:',
      error.message
    )

    res.status(500).json({
      mensaje: 'Error al guardar las palabras de la sopa'
    })

  } finally {

    if (conexionBD) {
      conexionBD.release()
    }
  }
})


// ========================================
// REEMPLAZAR EL CONTENIDO DE UN CRUCIGRAMA
// ========================================

app.put('/api/juegos/:id/crucigrama', async (req, res) => {
  const { id } = req.params
  const palabras = req.body.palabras

  if (!Array.isArray(palabras) || palabras.length === 0) {
    return res.status(400).json({
      mensaje: 'Agrega al menos una palabra al crucigrama'
    })
  }

  const normalizadas = palabras.map((item) => ({
    palabra: String(item.palabra || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase()
      .replace(/[^A-Z]/g, ''),

    pista: String(item.pista || '').trim(),

    fila: Number(item.fila),

    columna: Number(item.columna),

    direccion: item.direccion
  }))

  const invalida = normalizadas.some((item) =>
    !item.palabra ||
    !item.pista ||
    !Number.isInteger(item.fila) ||
    !Number.isInteger(item.columna) ||
    item.fila < 0 ||
    item.fila > 9 ||
    item.columna < 0 ||
    item.columna > 14 ||
    !['horizontal', 'vertical'].includes(item.direccion) ||
    (
      item.direccion === 'horizontal' &&
      item.columna + item.palabra.length > 15
    ) ||
    (
      item.direccion === 'vertical' &&
      item.fila + item.palabra.length > 10
    )
  )

  if (invalida) {
    return res.status(400).json({
      mensaje:
        'Revisa palabras, pistas y posiciones: deben caber en el tablero de 10 × 15'
    })
  }

  const letrasEnTablero = new Map()

  for (const item of normalizadas) {

    for (
      let indice = 0;
      indice < item.palabra.length;
      indice++
    ) {

      const fila =
        item.fila +
        (
          item.direccion === 'vertical'
            ? indice
            : 0
        )

      const columna =
        item.columna +
        (
          item.direccion === 'horizontal'
            ? indice
            : 0
        )

      const casilla = `${fila},${columna}`

      if (
        letrasEnTablero.has(casilla) &&
        letrasEnTablero.get(casilla) !== item.palabra[indice]
      ) {
        return res.status(400).json({
          mensaje:
            'Las palabras se cruzan con letras distintas. Ajusta las posiciones antes de guardar.'
        })
      }

      letrasEnTablero.set(
        casilla,
        item.palabra[indice]
      )
    }
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
      'DELETE FROM palabras_crucigrama WHERE id_juego = ?',
      [id]
    )

    for (const item of normalizadas) {

      await conexionBD.query(
        `
        INSERT INTO palabras_crucigrama
        (
          id_juego,
          palabra,
          pista,
          fila,
          columna,
          direccion
        )
        VALUES (?, ?, ?, ?, ?, ?)
        `,
        [
          id,
          item.palabra,
          item.pista,
          item.fila,
          item.columna,
          item.direccion
        ]
      )
    }

    await conexionBD.commit()

    res.json({
      mensaje: 'Crucigrama guardado correctamente'
    })

  } catch (error) {

    if (conexionBD) {
      await conexionBD.rollback()
    }

    console.error(
      'Error al guardar el crucigrama:',
      error.message
    )

    res.status(500).json({
      mensaje: 'Error al guardar el crucigrama'
    })

  } finally {

    if (conexionBD) {
      conexionBD.release()
    }
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
        mensaje:
          'Todos los campos de la pregunta son obligatorios'
      })
    }

    const respuesta = respuesta_correcta
      .toString()
      .trim()
      .toUpperCase()

    if (!['A', 'B', 'C', 'D'].includes(respuesta)) {
      return res.status(400).json({
        mensaje:
          'La respuesta correcta debe ser A, B, C o D'
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
      id_unidad,
      activo
    } = req.body

    if (
      !nombre ||
      !descripcion ||
      !instrucciones ||
      !id_tipo ||
      !id_unidad
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

    const [unidades] = await conexion.query(
      'SELECT id_unidad FROM unidades WHERE id_unidad = ?',
      [id_unidad]
    )

    if (unidades.length === 0) {
      return res.status(404).json({ mensaje: 'La unidad seleccionada no existe' })
    }

    const [resultado] = await conexion.query(
      `
      INSERT INTO juegos
      (
        nombre,
        descripcion,
        instrucciones,
        id_tipo,
        id_unidad,
        activo
      )
      VALUES (?, ?, ?, ?, ?, ?)
      `,
      [
        nombre,
        descripcion,
        instrucciones,
        id_tipo,
        id_unidad,
        activo !== undefined
          ? activo
          : true
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
        id_unidad,
        activo:
          activo !== undefined
            ? activo
            : true
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
      id_unidad,
      activo
    } = req.body

    if (!nombre || !descripcion || !instrucciones || !id_unidad) {
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

    const [unidades] = await conexion.query(
      'SELECT id_unidad FROM unidades WHERE id_unidad = ?',
      [id_unidad]
    )

    if (unidades.length === 0) {
      return res.status(404).json({ mensaje: 'La unidad seleccionada no existe' })
    }

    await conexion.query(
      `
      UPDATE juegos
      SET
        nombre = ?,
        descripcion = ?,
        instrucciones = ?,
        id_unidad = ?,
        activo = ?
      WHERE id_juego = ?
      `,
      [
        nombre,
        descripcion,
        instrucciones,
        id_unidad,
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
    const {
      usuario,
      contraseña
    } = req.body

    if (!usuario || !contraseña) {
      return res.status(400).json({
        mensaje:
          'Usuario y contraseña son obligatorios'
      })
    }

    const [usuarios] = await conexion.query(
      `
      SELECT
        id_usuario,
        nombre,
        usuario,
        contraseña
      FROM usuarios
      WHERE usuario = ?
      `,
      [usuario]
    )

    if (usuarios.length === 0) {
      return res.status(401).json({
        mensaje:
          'Usuario o contraseña incorrectos'
      })
    }

    const usuarioEncontrado = usuarios[0]

    const contraseñaGuardada = String(usuarioEncontrado.contraseña ?? '')
    const tieneHashBcrypt = /^\$2[aby]\$\d{2}\$/.test(contraseñaGuardada)
    const contraseñaCorrecta = tieneHashBcrypt
      ? await bcrypt.compare(contraseña, contraseñaGuardada)
      : contraseña === contraseñaGuardada

    if (!contraseñaCorrecta) {
      return res.status(401).json({
        mensaje:
          'Usuario o contraseña incorrectos'
      })
    }

    // Las cuentas previas al uso de bcrypt conservan la contraseña en texto.
    // Al iniciar sesión correctamente, se actualizan al formato seguro.
    if (!tieneHashBcrypt) {
      try {
        const contraseñaHash = await bcrypt.hash(contraseña, 10)
        await conexion.query(
          'UPDATE usuarios SET contraseña = ? WHERE id_usuario = ?',
          [contraseñaHash, usuarioEncontrado.id_usuario]
        )
      } catch (error) {
        console.error('No se pudo actualizar el hash de la contraseña:', error.message)
      }
    }

    res.json({
      mensaje:
        'Inicio de sesión correcto',

      usuario: {
        id_usuario:
          usuarioEncontrado.id_usuario,

        nombre:
          usuarioEncontrado.nombre,

        usuario:
          usuarioEncontrado.usuario
      }
    })

  } catch (error) {

    console.error(
      'Error en el login:',
      error.message
    )

    res.status(500).json({
      mensaje:
        'Error interno del servidor'
    })
  }
})


// ========================================
// REGISTRO
// ========================================

app.post('/api/registro', async (req, res) => {
  try {

    const {
      nombre,
      usuario,
      contraseña
    } = req.body

    if (
      !nombre ||
      !usuario ||
      !contraseña
    ) {
      return res.status(400).json({
        mensaje:
          'Todos los campos son obligatorios'
      })
    }

    const [usuariosExistentes] =
      await conexion.query(
        `
        SELECT id_usuario
        FROM usuarios
        WHERE usuario = ?
        `,
        [usuario]
      )

    if (usuariosExistentes.length > 0) {
      return res.status(409).json({
        mensaje:
          'Ese usuario ya está registrado'
      })
    }

    const contraseñaHash =
      await bcrypt.hash(
        contraseña,
        10
      )

    const [resultado] =
      await conexion.query(
        `
        INSERT INTO usuarios
        (
          nombre,
          usuario,
          contraseña
        )
        VALUES (?, ?, ?)
        `,
        [
          nombre,
          usuario,
          contraseñaHash
        ]
      )

    res.status(201).json({
      mensaje:
        'Usuario registrado correctamente',

      usuario: {
        id_usuario:
          resultado.insertId,

        nombre:
          nombre,

        usuario:
          usuario
      }
    })

  } catch (error) {

    console.error(
      'Error en el registro:',
      error.message
    )

    res.status(500).json({
      mensaje:
        'Error interno del servidor'
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

  if (
    !Array.isArray(enigmas) ||
    enigmas.length === 0
  ) {
    return res.status(400).json({
      mensaje:
        'Agrega al menos un enigma al juego Detective'
    })
  }

  const normalizados = enigmas.map((item) => ({
    materia:
      String(item.materia || '').trim(),

    titulo:
      String(item.titulo || '').trim(),

    respuesta:
      String(item.respuesta || '').trim(),

    pista_1:
      String(item.pista_1 || '').trim(),

    pista_2:
      String(item.pista_2 || '').trim(),

    pista_3:
      String(item.pista_3 || '').trim()
  }))

  const hayCamposVacios =
    normalizados.some((item) =>
      !item.materia ||
      !item.titulo ||
      !item.respuesta ||
      !item.pista_1 ||
      !item.pista_2 ||
      !item.pista_3
    )

  if (hayCamposVacios) {
    return res.status(400).json({
      mensaje:
        'Todos los campos de los enigmas son obligatorios'
    })
  }

  let conexionBD

  try {

    const [juegos] =
      await conexion.query(
        'SELECT id_juego FROM juegos WHERE id_juego = ?',
        [id]
      )

    if (!juegos.length) {
      return res.status(404).json({
        mensaje:
          'El juego no existe'
      })
    }

    conexionBD =
      await conexion.getConnection()

    await conexionBD.beginTransaction()

    await conexionBD.query(
      'DELETE FROM enigmas_detective WHERE id_juego = ?',
      [id]
    )

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
      mensaje:
        'Enigmas del Detective guardados correctamente'
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
      mensaje:
        'Error al guardar los enigmas del Detective'
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
      mensaje:
        'Error al obtener las parejas del memorama'
    })
  }
})


// ========================================
// GUARDAR PAREJAS DEL MEMORAMA
// ========================================

app.put('/api/juegos/:id/memorama', async (req, res) => {
  const { id } = req.params
  const parejas = req.body.parejas

  if (
    !Array.isArray(parejas) ||
    parejas.length === 0
  ) {
    return res.status(400).json({
      mensaje:
        'Agrega al menos una pareja al memorama'
    })
  }

  const normalizadas = parejas.map((item) => ({
    elemento_1:
      String(item.elemento_1 || '').trim(),

    elemento_2:
      String(item.elemento_2 || '').trim()
  }))

  if (
    normalizadas.some(
      (item) =>
        !item.elemento_1 ||
        !item.elemento_2
    )
  ) {
    return res.status(400).json({
      mensaje:
        'Todos los elementos de las parejas son obligatorios'
    })
  }

  let conexionBD

  try {

    const [juegos] =
      await conexion.query(
        'SELECT id_juego FROM juegos WHERE id_juego = ?',
        [id]
      )

    if (!juegos.length) {
      return res.status(404).json({
        mensaje:
          'El juego no existe'
      })
    }

    conexionBD =
      await conexion.getConnection()

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
      mensaje:
        'Parejas del memorama guardadas correctamente'
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
      mensaje:
        'Error al guardar las parejas del memorama'
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
      mensaje:
        'Error al obtener las palabras del crucigrama'
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
        mensaje:
          'Todos los datos del resultado son obligatorios'
      })
    }

    const [usuarios] =
      await conexion.query(
        `
        SELECT id_usuario
        FROM usuarios
        WHERE id_usuario = ?
        `,
        [id_usuario]
      )

    if (usuarios.length === 0) {
      return res.status(404).json({
        mensaje:
          'El usuario no existe'
      })
    }

    const [juegos] =
      await conexion.query(
        `
        SELECT id_juego
        FROM juegos
        WHERE id_juego = ?
        `,
        [id_juego]
      )

    if (juegos.length === 0) {
      return res.status(404).json({
        mensaje:
          'El juego no existe'
      })
    }

    const [resultado] =
      await conexion.query(
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
      mensaje:
        'Resultado guardado correctamente',

      resultado: {
        id_resultado:
          resultado.insertId,

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
      mensaje:
        'Error interno del servidor'
    })
  }
})


// ========================================
// OBTENER HISTORIAL DE UN USUARIO
// ========================================

app.get('/api/resultados/usuario/:id', async (req, res) => {
  try {

    const { id } = req.params

    const [resultados] =
      await conexion.query(
        `
        SELECT
          r.id_resultado,
          r.id_usuario,
          r.id_juego,
          u.id_unidad,
          u.nombre AS unidad,
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
        LEFT JOIN unidades u
          ON j.id_unidad = u.id_unidad
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
      mensaje:
        'Error al obtener el historial'
    })
  }
})


// ========================================
// MULTIJUGADOR: SALAS EN TIEMPO REAL
// ========================================

const servidor = http.createServer(app)
const io = new Server(servidor, {
  cors: {
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    methods: ['GET', 'POST']
  }
})

// Las salas viven en memoria durante esta primera etapa.
// Si se reinicia el backend, las salas activas se cierran.
const salas = new Map()
const MAX_PARTICIPANTES = 8
const CARACTERES_CODIGO = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

function generarCodigoSala() {
  let codigo
  do {
    codigo = Array.from({ length: 6 }, () =>
      CARACTERES_CODIGO[Math.floor(Math.random() * CARACTERES_CODIGO.length)]
    ).join('')
  } while (salas.has(codigo))
  return codigo
}

function obtenerSalaPublica(sala) {
  return {
    codigo: sala.codigo,
    id_juego: sala.id_juego,
    id_tipo: sala.id_tipo,
    nombre_juego: sala.nombre_juego,
    estado: sala.estado,
    anfitrion_id: sala.anfitrion_id,
    participantes: sala.participantes.map(({ id_usuario, nombre }) => ({
      id_usuario,
      nombre,
      es_anfitrion: id_usuario === sala.anfitrion_id
    }))
  }
}

function emitirActualizacionSala(sala) {
  io.to(sala.codigo).emit('sala-actualizada', obtenerSalaPublica(sala))
}

async function buscarUsuario(idUsuario) {
  const id = Number(idUsuario)
  if (!Number.isInteger(id) || id <= 0) return null

  const [usuarios] = await conexion.query(
    'SELECT id_usuario, nombre FROM usuarios WHERE id_usuario = ?',
    [id]
  )

  return usuarios[0] || null
}

function quitarParticipante(sala, idUsuario) {
  sala.participantes = sala.participantes.filter(
    participante => participante.id_usuario !== idUsuario
  )

  if (sala.participantes.length === 0) {
    salas.delete(sala.codigo)
    return false
  }

  if (!sala.participantes.some(p => p.id_usuario === sala.anfitrion_id)) {
    sala.anfitrion_id = sala.participantes[0].id_usuario
  }

  return true
}

io.on('connection', socket => {
  console.log(`🔌 Cliente conectado: ${socket.id}`)

  socket.on('crear-sala', async (datos = {}, responder = () => {}) => {
    try {
      const idJuego = Number(datos.id_juego)
      const usuario = await buscarUsuario(datos.id_usuario)

      if (!usuario || !Number.isInteger(idJuego) || idJuego <= 0) {
        return responder({ ok: false, mensaje: 'Usuario o juego no válido.' })
      }

      const [juegos] = await conexion.query(
        'SELECT id_juego, id_tipo, nombre FROM juegos WHERE id_juego = ? AND activo = TRUE',
        [idJuego]
      )

      if (!juegos.length) {
        return responder({ ok: false, mensaje: 'El juego no existe o está inactivo.' })
      }

      const codigo = generarCodigoSala()
      const sala = {
        codigo,
        id_juego: idJuego,
        id_tipo: Number(juegos[0].id_tipo),
        nombre_juego: juegos[0].nombre,
        estado: 'esperando',
        anfitrion_id: usuario.id_usuario,
        participantes: [{
          id_usuario: usuario.id_usuario,
          nombre: usuario.nombre,
          socket_id: socket.id
        }],
        quiz: { jugadores: {} }
      }

      salas.set(codigo, sala)
      socket.join(codigo)
      socket.data.codigoSala = codigo
      socket.data.idUsuario = usuario.id_usuario

      responder({ ok: true, sala: obtenerSalaPublica(sala) })
      emitirActualizacionSala(sala)
    } catch (error) {
      console.error('Error al crear sala:', error.message)
      responder({ ok: false, mensaje: 'No se pudo crear la sala.' })
    }
  })

  socket.on('unirse-sala', async (datos = {}, responder = () => {}) => {
    try {
      const codigo = String(datos.codigo || '').trim().toUpperCase()
      const sala = salas.get(codigo)
      const usuario = await buscarUsuario(datos.id_usuario)

      if (!usuario) {
        return responder({ ok: false, mensaje: 'No se encontró el usuario.' })
      }
      if (!sala) {
        return responder({ ok: false, mensaje: 'La sala no existe o ya se cerró.' })
      }
      if (sala.estado !== 'esperando') {
        return responder({ ok: false, mensaje: 'La partida ya comenzó.' })
      }

      const existente = sala.participantes.find(p => p.id_usuario === usuario.id_usuario)
      if (existente) {
        existente.socket_id = socket.id
      } else {
        if (sala.participantes.length >= MAX_PARTICIPANTES) {
          return responder({ ok: false, mensaje: 'La sala está llena (máximo 8 jugadores).' })
        }
        sala.participantes.push({
          id_usuario: usuario.id_usuario,
          nombre: usuario.nombre,
          socket_id: socket.id
        })
      }

      socket.join(codigo)
      socket.data.codigoSala = codigo
      socket.data.idUsuario = usuario.id_usuario

      responder({ ok: true, sala: obtenerSalaPublica(sala) })
      emitirActualizacionSala(sala)
    } catch (error) {
      console.error('Error al unirse a sala:', error.message)
      responder({ ok: false, mensaje: 'No se pudo ingresar a la sala.' })
    }
  })

  socket.on('iniciar-partida', (responder = () => {}) => {
    const codigo = socket.data.codigoSala
    const sala = codigo ? salas.get(codigo) : null

    if (!sala) return responder({ ok: false, mensaje: 'La sala ya no está disponible.' })
    if (socket.data.idUsuario !== sala.anfitrion_id) {
      return responder({ ok: false, mensaje: 'Solo el anfitrión puede iniciar la partida.' })
    }
    if (sala.participantes.length < 2) {
      return responder({ ok: false, mensaje: 'Se necesitan al menos 2 jugadores.' })
    }

    sala.estado = 'en_juego'
    responder({ ok: true })
    io.to(codigo).emit('partida-iniciada', obtenerSalaPublica(sala))
  })

  // Permite que cada participante recupere su lugar cuando el anfitrión
  // inicia el juego y el navegador cambia de la vista de sala a la del Quiz.
  socket.on('reconectar-partida', (datos = {}, responder = () => {}) => {
    const codigo = String(datos.codigo || '').trim().toUpperCase()
    const sala = salas.get(codigo)
    const idUsuario = Number(datos.id_usuario)
    const participante = sala?.participantes.find(p => p.id_usuario === idUsuario)

    if (!sala || sala.estado !== 'en_juego' || !participante) {
      return responder({ ok: false, mensaje: 'No se encontró tu participación en esta partida.' })
    }

    participante.socket_id = socket.id
    socket.join(codigo)
    socket.data.codigoSala = codigo
    socket.data.idUsuario = idUsuario

    if (!sala.quiz) sala.quiz = { jugadores: {} }
    if (!sala.quiz.jugadores[idUsuario]) {
      sala.quiz.jugadores[idUsuario] = {
        pregunta: 0,
        puntuacion: 0,
        aciertos: 0,
        errores: 0,
        respuestas: {}
      }
    }

    responder({
      ok: true,
      sala: obtenerSalaPublica(sala),
      quiz: obtenerMarcadorQuiz(sala)
    })
    io.to(codigo).emit('quiz:marcador', obtenerMarcadorQuiz(sala))
  })

  function obtenerMarcadorQuiz(sala) {
    return {
      codigo: sala.codigo,
      jugadores: sala.participantes.map(p => {
        const estado = sala.quiz?.jugadores?.[p.id_usuario] || {}
        return {
          id_usuario: p.id_usuario,
          nombre: p.nombre,
          pregunta: Number(estado.pregunta || 0),
          puntuacion: Number(estado.puntuacion || 0),
          aciertos: Number(estado.aciertos || 0),
          errores: Number(estado.errores || 0)
        }
      })
    }
  }


  // ========================================
  // MEMORAMA MULTIJUGADOR: ESTADO AUTORITATIVO
  // ========================================

  function mezclarCartasMemorama(cartas) {
    const copia = [...cartas]
    for (let i = copia.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[copia[i], copia[j]] = [copia[j], copia[i]]
    }
    return copia
  }

  function obtenerEstadoMemorama(sala) {
    const juego = sala.memorama
    if (!juego) return null
    return {
      codigo: sala.codigo,
      cartas: juego.cartas.map((carta, indice) => ({
        uid: carta.uid,
        id: carta.id,
        tipo: carta.tipo,
        texto: carta.texto,
        volteada: carta.volteada,
        encontrada: carta.encontrada,
        indice
      })),
      intentos: juego.intentos,
      parejas: juego.parejas,
      totalParejas: juego.totalParejas,
      turno: juego.turno,
      bloqueado: juego.bloqueado,
      terminado: juego.terminado,
      jugadores: sala.participantes.map(p => ({
        id_usuario: p.id_usuario,
        nombre: p.nombre,
        puntuacion: juego.puntuaciones[p.id_usuario] || 0,
        aciertos: juego.aciertos[p.id_usuario] || 0
      }))
    }
  }

  async function inicializarMemorama(sala) {
    if (sala.memorama) return sala.memorama
    const [parejas] = await conexion.query(
      `SELECT id_pareja, elemento_1, elemento_2
       FROM parejas_memorama
       WHERE id_juego = ?
       ORDER BY id_pareja`,
      [sala.id_juego]
    )
    if (!parejas.length) throw new Error('Este memorama no tiene parejas registradas.')
    const cartas = []
    for (const pareja of parejas) {
      cartas.push({
        uid: `concepto-${pareja.id_pareja}`,
        id: pareja.id_pareja,
        tipo: 'concepto',
        texto: pareja.elemento_1,
        volteada: false,
        encontrada: false
      })
      cartas.push({
        uid: `definicion-${pareja.id_pareja}`,
        id: pareja.id_pareja,
        tipo: 'definicion',
        texto: pareja.elemento_2,
        volteada: false,
        encontrada: false
      })
    }
    sala.memorama = {
      cartas: mezclarCartasMemorama(cartas),
      primera: null,
      intentos: 0,
      parejas: 0,
      totalParejas: parejas.length,
      turno: sala.participantes[0]?.id_usuario || null,
      bloqueado: false,
      terminado: false,
      puntuaciones: Object.fromEntries(sala.participantes.map(p => [p.id_usuario, 0])),
      aciertos: Object.fromEntries(sala.participantes.map(p => [p.id_usuario, 0])),
      temporizadorError: null
    }
    return sala.memorama
  }

  socket.on('memorama:reconectar', async (datos = {}, responder = () => {}) => {
    try {
      const codigo = String(datos.codigo || '').trim().toUpperCase()
      const sala = salas.get(codigo)
      const idUsuario = Number(datos.id_usuario)
      const participante = sala?.participantes.find(p => p.id_usuario === idUsuario)
      if (!sala || sala.estado !== 'en_juego' || sala.id_tipo !== 4 || !participante) {
        return responder({ ok: false, mensaje: 'No se encontró tu partida de Memorama.' })
      }
      participante.socket_id = socket.id
      socket.join(codigo)
      socket.data.codigoSala = codigo
      socket.data.idUsuario = idUsuario
      await inicializarMemorama(sala)
      const estado = obtenerEstadoMemorama(sala)
      responder({ ok: true, estado })
      io.to(codigo).emit('memorama:estado', estado)
    } catch (error) {
      console.error('Error al recuperar Memorama:', error.message)
      responder({ ok: false, mensaje: error.message || 'No se pudo recuperar el Memorama.' })
    }
  })

  socket.on('memorama:seleccionar', async (datos = {}, responder = () => {}) => {
    const codigo = socket.data.codigoSala
    const sala = codigo ? salas.get(codigo) : null
    const idUsuario = socket.data.idUsuario
    const juego = sala?.memorama
    const indice = Number(datos.indice)

    if (!sala || sala.estado !== 'en_juego' || sala.id_tipo !== 4 || !juego) {
      return responder({ ok: false, mensaje: 'La partida de Memorama no está disponible.' })
    }
    if (!sala.participantes.some(p => p.id_usuario === idUsuario)) {
      return responder({ ok: false, mensaje: 'No formas parte de esta sala.' })
    }
    if (juego.terminado) return responder({ ok: false, mensaje: 'El memorama ya terminó.' })
    if (juego.bloqueado) return responder({ ok: false, mensaje: 'Espera a que se resuelva el intento actual.' })
    if (juego.turno !== idUsuario) return responder({ ok: false, mensaje: 'Es el turno de otro jugador.' })
    if (!Number.isInteger(indice) || indice < 0 || indice >= juego.cartas.length) {
      return responder({ ok: false, mensaje: 'La carta seleccionada no es válida.' })
    }
    const carta = juego.cartas[indice]
    if (carta.volteada || carta.encontrada) {
      return responder({ ok: false, mensaje: 'Esa carta ya está seleccionada.' })
    }

    carta.volteada = true
    if (juego.primera === null) {
      juego.primera = indice
      const estado = obtenerEstadoMemorama(sala)
      responder({ ok: true, estado })
      io.to(codigo).emit('memorama:estado', estado)
      return
    }

    const primera = juego.cartas[juego.primera]
    juego.intentos += 1
    juego.bloqueado = true
    const coincide = primera.id === carta.id && primera.tipo !== carta.tipo
    if (coincide) {
      primera.encontrada = true
      carta.encontrada = true
      juego.parejas += 1
      juego.puntuaciones[idUsuario] = (juego.puntuaciones[idUsuario] || 0) + 100
      juego.aciertos[idUsuario] = (juego.aciertos[idUsuario] || 0) + 1
      juego.primera = null
      juego.bloqueado = false
      if (juego.parejas === juego.totalParejas) juego.terminado = true
    } else {
      juego.puntuaciones[idUsuario] = Math.max(0, (juego.puntuaciones[idUsuario] || 0) - 10)
      const primeraIndice = juego.primera
      juego.primera = null
      juego.temporizadorError = setTimeout(() => {
        const salaActual = salas.get(codigo)
        const juegoActual = salaActual?.memorama
        if (!juegoActual || juegoActual.terminado) return
        juegoActual.cartas[primeraIndice].volteada = false
        juegoActual.cartas[indice].volteada = false
        juegoActual.turno = siguienteJugador(salaActual, idUsuario)
        juegoActual.bloqueado = false
        juegoActual.temporizadorError = null
        io.to(codigo).emit('memorama:estado', obtenerEstadoMemorama(salaActual))
      }, 850)
    }

    const estado = obtenerEstadoMemorama(sala)
    responder({ ok: true, coincide, estado })
    io.to(codigo).emit('memorama:estado', estado)
  })

  function siguienteJugador(sala, idActual) {
    const participantes = sala.participantes
    if (!participantes.length) return null
    const indice = participantes.findIndex(p => p.id_usuario === idActual)
    return participantes[(indice + 1) % participantes.length].id_usuario
  }


  // ========================================
  // MULTIJUGADOR: DETECTIVE ESCOLAR
  // ========================================

  function normalizarRespuestaDetective(valor) {
    return String(valor || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '')
  }

  function siguienteCasoDetective(juego) {
    const siguiente = juego.casos.findIndex(
      (caso, indice) => indice > juego.indiceCaso && !juego.resueltos[caso.id]
    )
    if (siguiente !== -1) return siguiente
    return juego.casos.findIndex(caso => !juego.resueltos[caso.id])
  }

  function obtenerEstadoDetective(sala) {
    const juego = sala.detective
    if (!juego) return null

    return {
      codigo: sala.codigo,
      casos: juego.casos.map(caso => ({
        id: caso.id,
        subject: caso.subject,
        title: caso.title,
        clues: [...caso.clues
        ],
        resuelto: Boolean(juego.resueltos[caso.id]),
        puntos: Number(juego.resueltos[caso.id] || 0)
      })),
      indiceCaso: juego.indiceCaso,
      turno: juego.turno,
      terminado: juego.terminado,
      venceEn: juego.venceEn || null,
      aviso: juego.aviso || '',
      resueltos: { ...juego.resueltos },
      jugadores: sala.participantes.map(p => {
        const estado = juego.jugadores[p.id_usuario] || {}
        return {
          id_usuario: p.id_usuario,
          nombre: p.nombre,
          puntuacion: Number(estado.puntuacion || 0),
          aciertos: Number(estado.aciertos || 0),
          errores: Number(estado.errores || 0),
          vidas: Number(estado.vidas ?? 3),
          pista: Number(estado.pista || 1)
        }
      })
    }
  }

  const TIEMPO_TURNO_DETECTIVE_MS = 25_000

  function programarTemporizadorDetective(sala) {
    const juego = sala?.detective
    if (!juego || juego.terminado || !juego.turno) return

    if (juego.temporizadorTurno) clearTimeout(juego.temporizadorTurno)

    const turnoProgramado = juego.turno
    const venceEn = Date.now() + TIEMPO_TURNO_DETECTIVE_MS
    juego.venceEn = venceEn
    juego.temporizadorTurno = setTimeout(() => {
      const salaActual = salas.get(sala.codigo)
      const juegoActual = salaActual?.detective
      if (
        !juegoActual ||
        juegoActual.terminado ||
        juegoActual.turno !== turnoProgramado ||
        juegoActual.venceEn !== venceEn
      ) return

      pasarTurnoDetectivePorTiempo(salaActual)
    }, TIEMPO_TURNO_DETECTIVE_MS)
  }

  function detenerTemporizadorDetective(juego) {
    if (juego?.temporizadorTurno) clearTimeout(juego.temporizadorTurno)
    if (juego) {
      juego.temporizadorTurno = null
      juego.venceEn = null
    }
  }

  function pasarTurnoDetectivePorTiempo(sala) {
    const juego = sala?.detective
    if (!juego || juego.terminado || !juego.turno) return false

    const idAnterior = juego.turno
    const jugadorAnterior = juego.jugadores[idAnterior]
    if (jugadorAnterior) {
      jugadorAnterior.vidas = 3
      jugadorAnterior.pista = 1
    }

    const siguienteId = siguienteJugador(sala, idAnterior)
    if (!siguienteId) return false

    juego.turno = siguienteId
    const siguiente = juego.jugadores[siguienteId]
    if (siguiente) {
      siguiente.vidas = 3
      siguiente.pista = 1
    }

    const nombreSiguiente = sala.participantes.find(p => p.id_usuario === siguienteId)?.nombre || 'el siguiente jugador'
    juego.aviso = `Se agotaron los 25 segundos. El turno pasa a ${nombreSiguiente}.`
    programarTemporizadorDetective(sala)

    const estado = obtenerEstadoDetective(sala)
    io.to(sala.codigo).emit('detective:estado', estado)
    juego.aviso = ''
    return true
  }

  async function inicializarDetective(sala) {
    if (sala.detective) return sala.detective

    const [enigmas] = await conexion.query(
      `SELECT id_enigma, materia, titulo, respuesta, pista_1, pista_2, pista_3
       FROM enigmas_detective
       WHERE id_juego = ?
       ORDER BY id_enigma`,
      [sala.id_juego]
    )

    if (!enigmas.length) {
      throw new Error('Este juego Detective no tiene enigmas registrados.')
    }

    const jugadores = {}
    for (const participante of sala.participantes) {
      jugadores[participante.id_usuario] = {
        puntuacion: 0,
        aciertos: 0,
        errores: 0,
        vidas: 3,
        pista: 1
      }
    }

    sala.detective = {
      casos: enigmas.map(enigma => ({
        id: Number(enigma.id_enigma),
        subject: enigma.materia,
        title: enigma.titulo,
        answer: enigma.respuesta,
        clues: [enigma.pista_1, enigma.pista_2, enigma.pista_3]
      })),
      indiceCaso: 0,
      turno: sala.participantes[0]?.id_usuario || null,
      terminado: false,
      resueltos: {},
      jugadores,
      venceEn: null,
      temporizadorTurno: null,
      aviso: ''
    }
    programarTemporizadorDetective(sala)
    return sala.detective
  }

  socket.on('detective:reconectar', async (datos = {}, responder = () => {}) => {
    try {
      const codigo = String(datos.codigo || '').trim().toUpperCase()
      const sala = salas.get(codigo)
      const idUsuario = Number(datos.id_usuario)
      const participante = sala?.participantes.find(p => p.id_usuario === idUsuario)

      if (!sala || sala.estado !== 'en_juego' || sala.id_tipo !== 6 || !participante) {
        return responder({ ok: false, mensaje: 'No se encontró tu partida de Detective.' })
      }

      participante.socket_id = socket.id
      socket.join(codigo)
      socket.data.codigoSala = codigo
      socket.data.idUsuario = idUsuario

      await inicializarDetective(sala)
      if (!sala.detective.jugadores[idUsuario]) {
        sala.detective.jugadores[idUsuario] = {
          puntuacion: 0, aciertos: 0, errores: 0, vidas: 3, pista: 1
        }
      }

      if (!sala.detective.venceEn) {
        programarTemporizadorDetective(sala)
      } else if (Date.now() >= sala.detective.venceEn) {
        pasarTurnoDetectivePorTiempo(sala)
      }

      const estado = obtenerEstadoDetective(sala)
      responder({ ok: true, estado })
      io.to(codigo).emit('detective:estado', estado)
    } catch (error) {
      console.error('Error al recuperar Detective:', error.message)
      responder({ ok: false, mensaje: error.message || 'No se pudo recuperar la partida de Detective.' })
    }
  })

  socket.on('detective:pista', (responder = () => {}) => {
    const codigo = socket.data.codigoSala
    const sala = codigo ? salas.get(codigo) : null
    const idUsuario = socket.data.idUsuario
    const juego = sala?.detective
    const jugador = juego?.jugadores?.[idUsuario]

    if (sala && juego && juego.venceEn && Date.now() >= juego.venceEn) {
      pasarTurnoDetectivePorTiempo(sala)
      return responder({ ok: false, mensaje: 'Se agotaron los 25 segundos. El turno pasó al siguiente jugador.', estado: obtenerEstadoDetective(sala) })
    }

    if (!sala || sala.estado !== 'en_juego' || sala.id_tipo !== 6 || !juego || !jugador) {
      return responder({ ok: false, mensaje: 'La partida de Detective no está disponible.' })
    }
    if (juego.terminado) return responder({ ok: false, mensaje: 'La partida ya terminó.' })
    if (juego.turno !== idUsuario) return responder({ ok: false, mensaje: 'Es el turno de otro jugador.' })
    if (jugador.pista >= 3) return responder({ ok: false, mensaje: 'Ya consultaste todas las pistas.' })

    jugador.pista += 1
    const estado = obtenerEstadoDetective(sala)
    responder({ ok: true, estado })
    io.to(codigo).emit('detective:estado', estado)
  })

  socket.on('detective:responder', (datos = {}, responder = () => {}) => {
    const codigo = socket.data.codigoSala
    const sala = codigo ? salas.get(codigo) : null
    const idUsuario = socket.data.idUsuario
    const juego = sala?.detective
    const jugador = juego?.jugadores?.[idUsuario]
    const respuesta = normalizarRespuestaDetective(datos.respuesta)

    if (sala && juego && juego.venceEn && Date.now() >= juego.venceEn) {
      pasarTurnoDetectivePorTiempo(sala)
      return responder({ ok: false, mensaje: 'Se agotaron los 25 segundos. El turno pasó al siguiente jugador.', estado: obtenerEstadoDetective(sala) })
    }

    if (!sala || sala.estado !== 'en_juego' || sala.id_tipo !== 6 || !juego || !jugador) {
      return responder({ ok: false, mensaje: 'La partida de Detective no está disponible.' })
    }
    if (juego.terminado) return responder({ ok: false, mensaje: 'La partida ya terminó.' })
    if (juego.turno !== idUsuario) return responder({ ok: false, mensaje: 'Es el turno de otro jugador.' })
    if (!respuesta) return responder({ ok: false, mensaje: 'Escribe una respuesta antes de comprobarla.' })

    const caso = juego.casos[juego.indiceCaso]
    if (!caso || juego.resueltos[caso.id]) {
      return responder({ ok: false, mensaje: 'Este expediente ya fue resuelto.' })
    }

    const correcta = respuesta === normalizarRespuestaDetective(caso.answer)
    let mensaje = ''

    if (correcta) {
      const puntos = jugador.pista === 1 ? 100 : jugador.pista === 2 ? 60 : 30
      jugador.puntuacion += puntos
      jugador.aciertos += 1
      juego.resueltos[caso.id] = puntos
      const siguiente = siguienteCasoDetective(juego)

      if (siguiente === -1) {
        juego.terminado = true
        detenerTemporizadorDetective(juego)
        mensaje = `¡Correcto! "${caso.answer}". Sumaste ${puntos} puntos. La partida terminó.`
      } else {
        juego.indiceCaso = siguiente
        juego.turno = siguienteJugador(sala, idUsuario)
        const siguienteJugadorSala = sala.participantes.find(p => p.id_usuario === juego.turno)
        mensaje = `¡Correcto! "${caso.answer}". Sumaste ${puntos} puntos. Ahora juega ${siguienteJugadorSala?.nombre || 'el siguiente participante'}.`
        const nuevoTurno = juego.jugadores[juego.turno]
        if (nuevoTurno) {
          nuevoTurno.vidas = 3
          nuevoTurno.pista = 1
        }
        programarTemporizadorDetective(sala)
      }
    } else {
      jugador.errores += 1
      jugador.vidas = Math.max(0, jugador.vidas - 1)

      if (jugador.vidas === 0) {
        const siguienteId = siguienteJugador(sala, idUsuario)
        juego.turno = siguienteId
        jugador.vidas = 3
        jugador.pista = 1
        const siguienteJugadorEstado = juego.jugadores[siguienteId]
        if (siguienteJugadorEstado) {
          siguienteJugadorEstado.vidas = 3
          siguienteJugadorEstado.pista = 1
        }
        const siguienteJugadorSala = sala.participantes.find(p => p.id_usuario === siguienteId)
        mensaje = `Respuesta incorrecta. Se agotaron tus 3 intentos. El expediente sigue abierto y el turno pasa a ${siguienteJugadorSala?.nombre || "otro jugador"}.`
        programarTemporizadorDetective(sala)
      } else {
        mensaje = `Respuesta incorrecta. Te quedan ${jugador.vidas} intento(s); conservas el turno.`
      }
    }

    const estado = obtenerEstadoDetective(sala)
    responder({
      ok: true,
      correcta,
      mensaje,
      respuesta: correcta ? caso.answer : null,
      estado
    })
    io.to(codigo).emit('detective:estado', estado)
  })

  socket.on('quiz:responder', async (datos = {}, responder = () => {}) => {
    try {
      const codigo = socket.data.codigoSala
      const sala = codigo ? salas.get(codigo) : null
      const idUsuario = socket.data.idUsuario
      const indice = Number(datos.indice)
      const letra = String(datos.letra || '').trim().toUpperCase()

      if (!sala || sala.estado !== 'en_juego' || sala.id_juego <= 0) {
        return responder({ ok: false, mensaje: 'La partida ya no está disponible.' })
      }
      if (!sala.participantes.some(p => p.id_usuario === idUsuario)) {
        return responder({ ok: false, mensaje: 'No formas parte de esta sala.' })
      }
      if (!Number.isInteger(indice) || indice < 0 || !['A', 'B', 'C', 'D'].includes(letra)) {
        return responder({ ok: false, mensaje: 'La respuesta enviada no es válida.' })
      }

      const [preguntas] = await conexion.query(
        `SELECT id_pregunta, respuesta_correcta
         FROM preguntas
         WHERE id_juego = ?
         ORDER BY id_pregunta
         LIMIT 1 OFFSET ?`,
        [sala.id_juego, indice]
      )
      if (!preguntas.length) {
        return responder({ ok: false, mensaje: 'La pregunta ya no existe.' })
      }

      if (!sala.quiz) sala.quiz = { jugadores: {} }
      if (!sala.quiz.jugadores[idUsuario]) {
        sala.quiz.jugadores[idUsuario] = {
          pregunta: 0, puntuacion: 0, aciertos: 0, errores: 0, respuestas: {}
        }
      }
      const estado = sala.quiz.jugadores[idUsuario]
      if (estado.respuestas[indice]) {
        return responder({ ok: false, mensaje: 'Ya respondiste esta pregunta.' })
      }
      if (indice !== estado.pregunta) {
        return responder({ ok: false, mensaje: 'El número de pregunta no coincide con tu progreso.' })
      }

      const correcta = letra === String(preguntas[0].respuesta_correcta).trim().toUpperCase()
      estado.respuestas[indice] = { letra, correcta }
      if (correcta) {
        estado.aciertos += 1
        estado.puntuacion += 100
      } else {
        estado.errores += 1
      }

      responder({
        ok: true,
        correcta,
        respuesta_correcta: String(preguntas[0].respuesta_correcta).trim().toUpperCase(),
        puntuacion: estado.puntuacion,
        aciertos: estado.aciertos,
        errores: estado.errores
      })
      io.to(codigo).emit('quiz:marcador', obtenerMarcadorQuiz(sala))
    } catch (error) {
      console.error('Error al registrar respuesta del Quiz:', error.message)
      responder({ ok: false, mensaje: 'No se pudo registrar la respuesta.' })
    }
  })

  socket.on('quiz:siguiente', (datos = {}) => {
    const codigo = socket.data.codigoSala
    const sala = codigo ? salas.get(codigo) : null
    const estado = sala?.quiz?.jugadores?.[socket.data.idUsuario]
    const indice = Number(datos.indice)
    if (!estado || !Number.isInteger(indice) || indice < estado.pregunta || indice > estado.pregunta + 1) return
    estado.pregunta = indice
    io.to(codigo).emit('quiz:marcador', obtenerMarcadorQuiz(sala))
  })

  socket.on('salir-sala', () => {
    const codigo = socket.data.codigoSala
    const sala = codigo ? salas.get(codigo) : null
    if (!sala) return

    socket.leave(codigo)
    const sigueActiva = quitarParticipante(sala, socket.data.idUsuario)
    socket.data.codigoSala = null
    socket.data.idUsuario = null
    if (sigueActiva) emitirActualizacionSala(sala)
  })

  socket.on('disconnect', () => {
    const codigo = socket.data.codigoSala
    const sala = codigo ? salas.get(codigo) : null
    if (sala) {
      if (sala.estado === 'en_juego') {
        const participante = sala.participantes.find(p => p.id_usuario === socket.data.idUsuario)
        if (participante && participante.socket_id === socket.id) participante.socket_id = null
      } else {
        const sigueActiva = quitarParticipante(sala, socket.data.idUsuario)
        if (sigueActiva) emitirActualizacionSala(sala)
      }
    }
    console.log(`🔌 Cliente desconectado: ${socket.id}`)
  })
})

// ========================================
// INICIAR SERVIDOR
// ========================================

conexion.preparacion.then(() => {
  servidor.listen(PORT, () => {
    console.log(`🚀 Servidor ejecutándose en http://localhost:${PORT}`)
    console.log('🎮 Multijugador Socket.IO disponible')
  })
})
