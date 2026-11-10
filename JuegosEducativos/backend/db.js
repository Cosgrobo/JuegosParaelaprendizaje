const mysql = require('mysql2/promise')
require('dotenv').config()

const conexion = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'juegos_educativos',
  waitForConnections: true,
  connectionLimit: 10,
  charset: 'utf8mb4'
})

async function probarConexion() {
  let conexionBD

  try {
    conexionBD = await conexion.getConnection()

    await conexionBD.query(`CREATE TABLE IF NOT EXISTS tipos_juego (
      id_tipo INT AUTO_INCREMENT PRIMARY KEY,
      nombre VARCHAR(100) NOT NULL UNIQUE
    )`)
    await conexionBD.query(`CREATE TABLE IF NOT EXISTS usuarios (
      id_usuario INT AUTO_INCREMENT PRIMARY KEY,
      nombre VARCHAR(120) NOT NULL,
      usuario VARCHAR(80) NOT NULL UNIQUE,
      contraseña VARCHAR(255) NOT NULL,
      fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`)
    await conexionBD.query(`CREATE TABLE IF NOT EXISTS unidades (
      id_unidad INT AUTO_INCREMENT PRIMARY KEY,
      nombre VARCHAR(100) NOT NULL UNIQUE,
      fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`)
    await conexionBD.query(`CREATE TABLE IF NOT EXISTS juegos (
      id_juego INT AUTO_INCREMENT PRIMARY KEY,
      nombre VARCHAR(120) NOT NULL,
      descripcion TEXT NOT NULL,
      instrucciones TEXT NOT NULL,
      id_tipo INT NOT NULL,
      id_unidad INT NULL,
      activo TINYINT(1) NOT NULL DEFAULT 1,
      fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_juegos_tipo (id_tipo),
      INDEX idx_juegos_unidad (id_unidad)
    )`)
    for (const nombreTipo of ['Sopa de letras', 'Crucigrama', 'Ruleta', 'Detective', 'Memorama']) {
      const [tipoExistente] = await conexionBD.query('SELECT id_tipo FROM tipos_juego WHERE nombre=? LIMIT 1', [nombreTipo])
      if (!tipoExistente.length) await conexionBD.query('INSERT INTO tipos_juego (nombre) VALUES (?)', [nombreTipo])
    }
    await conexionBD.query(`CREATE TABLE IF NOT EXISTS palabras_sopa (
      id_palabra INT AUTO_INCREMENT PRIMARY KEY,
      id_juego INT NOT NULL,
      palabra VARCHAR(10) NOT NULL,
      pista VARCHAR(255) NULL,
      INDEX idx_sopa_juego (id_juego)
    )`)
    await conexionBD.query(`CREATE TABLE IF NOT EXISTS preguntas (
      id_pregunta INT AUTO_INCREMENT PRIMARY KEY,
      id_juego INT NOT NULL,
      pregunta TEXT NOT NULL,
      opcion_a VARCHAR(500) NOT NULL,
      opcion_b VARCHAR(500) NOT NULL,
      opcion_c VARCHAR(500) NOT NULL,
      opcion_d VARCHAR(500) NOT NULL,
      respuesta_correcta CHAR(1) NOT NULL,
      INDEX idx_preguntas_juego (id_juego)
    )`)
    await conexionBD.query(`CREATE TABLE IF NOT EXISTS enigmas_detective (
      id_enigma INT AUTO_INCREMENT PRIMARY KEY,
      id_juego INT NOT NULL,
      materia VARCHAR(120) NOT NULL,
      titulo VARCHAR(180) NOT NULL,
      respuesta VARCHAR(255) NOT NULL,
      pista_1 VARCHAR(255) NOT NULL,
      pista_2 VARCHAR(255) NOT NULL,
      pista_3 VARCHAR(255) NOT NULL,
      INDEX idx_enigmas_juego (id_juego)
    )`)
    await conexionBD.query(`CREATE TABLE IF NOT EXISTS parejas_memorama (
      id_pareja INT AUTO_INCREMENT PRIMARY KEY,
      id_juego INT NOT NULL,
      elemento_1 VARCHAR(255) NOT NULL,
      elemento_2 VARCHAR(255) NOT NULL,
      INDEX idx_memorama_juego (id_juego)
    )`)
    await conexionBD.query(`CREATE TABLE IF NOT EXISTS resultados (
      id_resultado INT AUTO_INCREMENT PRIMARY KEY,
      id_usuario INT NOT NULL,
      id_juego INT NOT NULL,
      fecha DATE NOT NULL,
      hora_inicio DATETIME NOT NULL,
      hora_fin DATETIME NOT NULL,
      tiempo_transcurrido INT NOT NULL,
      aciertos INT NOT NULL DEFAULT 0,
      errores INT NOT NULL DEFAULT 0,
      puntuacion INT NOT NULL DEFAULT 0,
      INDEX idx_resultados_usuario (id_usuario)
    )`)

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

    // Datos de salas y partidas separados del catálogo de juegos. Un mismo
    // juego puede usarse en muchas partidas sin compartir su avance.
    await conexionBD.query(`
      CREATE TABLE IF NOT EXISTS salas (
        id_sala BIGINT AUTO_INCREMENT PRIMARY KEY,
        codigo VARCHAR(12) NOT NULL UNIQUE,
        id_juego INT NOT NULL,
        id_anfitrion INT NOT NULL,
        max_jugadores INT NOT NULL DEFAULT 30,
        limite_segundos INT NOT NULL DEFAULT 300,
        modalidad ENUM('competitiva','colaborativa') NOT NULL DEFAULT 'competitiva',
        estado ENUM('esperando','en_curso','finalizada') NOT NULL DEFAULT 'esperando',
        turno_usuario INT NULL,
        estado_juego JSON NULL,
        creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        inicia_en DATETIME NULL,
        finaliza_en DATETIME NULL,
        INDEX idx_salas_estado (estado),
        INDEX idx_salas_juego (id_juego)
      )
    `)

    const [salaTimerColumn] = await conexionBD.query("SHOW COLUMNS FROM salas LIKE 'limite_segundos'")
    if (salaTimerColumn.length === 0) {
      await conexionBD.query('ALTER TABLE salas ADD COLUMN limite_segundos INT NOT NULL DEFAULT 300 AFTER max_jugadores')
    }

    await conexionBD.query('ALTER TABLE salas MODIFY max_jugadores INT NOT NULL DEFAULT 30')

    await conexionBD.query(`
      CREATE TABLE IF NOT EXISTS partidas (
        id_partida BIGINT AUTO_INCREMENT PRIMARY KEY,
        id_sala BIGINT NOT NULL UNIQUE,
        id_juego INT NOT NULL,
        tipo_juego VARCHAR(100) NOT NULL,
        fecha DATE NOT NULL,
        hora_inicio DATETIME NOT NULL,
        hora_fin DATETIME NULL,
        tiempo_transcurrido INT NOT NULL DEFAULT 0,
        estado ENUM('en_curso','finalizada','tiempo_agotado') NOT NULL DEFAULT 'en_curso',
        resultado_general VARCHAR(80) NULL,
        INDEX idx_partidas_juego (id_juego),
        INDEX idx_partidas_fecha (fecha)
      )
    `)

    await conexionBD.query(`
      CREATE TABLE IF NOT EXISTS sala_participantes (
        id_sala BIGINT NOT NULL,
        id_usuario INT NOT NULL,
        conectado TINYINT(1) NOT NULL DEFAULT 1,
        aciertos INT NOT NULL DEFAULT 0,
        errores INT NOT NULL DEFAULT 0,
        puntuacion INT NOT NULL DEFAULT 0,
        resultado VARCHAR(40) NULL,
        unido_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        desconectado_en DATETIME NULL,
        ultimo_visto DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id_sala, id_usuario),
        INDEX idx_participantes_usuario (id_usuario)
      )
    `)

    const [presenceColumn] = await conexionBD.query("SHOW COLUMNS FROM sala_participantes LIKE 'ultimo_visto'")
    if (presenceColumn.length === 0) {
      await conexionBD.query('ALTER TABLE sala_participantes ADD COLUMN ultimo_visto DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP')
    }

    await conexionBD.query(`
      CREATE TABLE IF NOT EXISTS partida_acciones (
        id_accion BIGINT AUTO_INCREMENT PRIMARY KEY,
        id_sala BIGINT NOT NULL,
        id_usuario INT NOT NULL,
        clave_accion VARCHAR(80) NOT NULL,
        tipo_accion VARCHAR(40) NOT NULL,
        objetivo VARCHAR(100) NOT NULL,
        acierto TINYINT(1) NOT NULL,
        detalle JSON NULL,
        creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uq_accion_idempotente (id_sala, id_usuario, clave_accion),
        INDEX idx_acciones_objetivo (id_sala, objetivo)
      )
    `)

    await conexionBD.query(`
      CREATE TABLE IF NOT EXISTS sesiones_usuario (
        token_hash CHAR(64) PRIMARY KEY,
        id_usuario INT NOT NULL,
        expira_en DATETIME NOT NULL,
        creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_sesiones_expira (expira_en)
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
    console.error(error.stack || error)
    throw error
  } finally {
    if (conexionBD) conexionBD.release()
  }
}

conexion.preparacion = probarConexion()

module.exports = conexion
