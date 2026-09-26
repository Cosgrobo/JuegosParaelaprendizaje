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

    console.log('✅ Conectado correctamente a MySQL')

    conexionBD.release()
  } catch (error) {
    console.error('❌ Error al conectar con MySQL:')
    console.error(error.message)
  }
}

probarConexion()

module.exports = conexion