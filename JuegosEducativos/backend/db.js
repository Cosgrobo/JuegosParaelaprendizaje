const mysql = require('mysql2/promise')

const conexion = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'juegos_educativos'
})

async function probarConexion() {
  try {
    const conexionBD = await conexion.getConnection()

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

    console.log('✅ Conectado correctamente a MySQL')

    conexionBD.release()
  } catch (error) {
    console.error('❌ Error al conectar con MySQL:')
    console.error(error.message)
  }
}

probarConexion()

module.exports = conexion
