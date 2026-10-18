const mysql = require('mysql2/promise')

const conexion = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'juegos_educativos'
})

async function probarConexion() {
  let conexionBD

  try {
    conexionBD = await conexion.getConnection()

    await conexionBD.query(`
      CREATE TABLE IF NOT EXISTS palabras_crucigrama (
        id_palabra INT AUTO_INCREMENT PRIMARY KEY,
        id_juego INT NOT NULL,
        palabra VARCHAR(60) NOT NULL,
        pista VARCHAR(255) NOT NULL,
        fila INT NOT NULL,
        columna INT NOT NULL,
        direccion ENUM('horizontal', 'vertical') NOT NULL,
        INDEX idx_crucigrama_juego (id_juego)
      )
    `)

    await conexionBD.query(`
      CREATE TABLE IF NOT EXISTS unidades (
        id_unidad INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL UNIQUE,
        fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `)

    const [columnasJuego] = await conexionBD.query(
      "SHOW COLUMNS FROM juegos LIKE 'id_unidad'"
    )

    if (columnasJuego.length === 0) {
      await conexionBD.query(
        'ALTER TABLE juegos ADD COLUMN id_unidad INT NULL AFTER id_tipo'
      )
    }

    const [indicesJuego] = await conexionBD.query(
      "SHOW INDEX FROM juegos WHERE Key_name = 'idx_juegos_unidad'"
    )

    if (indicesJuego.length === 0) {
      await conexionBD.query(
        'CREATE INDEX idx_juegos_unidad ON juegos (id_unidad)'
      )
    }

    console.log('✅ Conectado correctamente a MySQL')

  } catch (error) {
    console.error('❌ Error al conectar con MySQL:')
    console.error(error.message)
  } finally {
    if (conexionBD) conexionBD.release()
  }
}

conexion.preparacion = probarConexion()

module.exports = conexion
