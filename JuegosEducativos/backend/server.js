const express = require('express')
const cors = require('cors')

const conexion = require('./db')

const app = express()
const PORT = 3000

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
// INICIAR SERVIDOR
// ========================================

app.listen(PORT, () => {
  console.log(
    `🚀 Servidor ejecutándose en http://localhost:${PORT}`
  )
})