
const express = require('express')
const cors = require('cors')

const conexion = require('./db')

const app = express()
const PORT = 3000

// Middlewares
app.use(cors())
app.use(express.json())

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({
    mensaje: 'API de Juegos Educativos funcionando'
  })
})

// Obtener todos los juegos
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
    console.error('Error al obtener los juegos:', error.message)

    res.status(500).json({
      mensaje: 'Error al obtener los juegos'
    })
  }
})


// =====================================================
// LOGIN
// =====================================================

app.post('/api/login', async (req, res) => {

  try {

    const { usuario, contraseña } = req.body

    // Comprobar que se recibieron los datos
    if (!usuario || !contraseña) {
      return res.status(400).json({
        mensaje: 'Usuario y contraseña son obligatorios'
      })
    }

    // Buscar usuario en MySQL
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

    // Usuario no encontrado
    if (usuarios.length === 0) {
      return res.status(401).json({
        mensaje: 'Usuario o contraseña incorrectos'
      })
    }

    // Usuario encontrado
    const usuarioEncontrado = usuarios[0]

    res.json({
      mensaje: 'Inicio de sesión correcto',
      usuario: usuarioEncontrado
    })

  } catch (error) {

    console.error('Error en el login:', error.message)

    res.status(500).json({
      mensaje: 'Error interno del servidor'
    })
  }

})


// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor ejecutándose en http://localhost:${PORT}`)
})

