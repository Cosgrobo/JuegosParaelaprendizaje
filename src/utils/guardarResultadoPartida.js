const formatoHora = (fecha) => fecha.toTimeString().slice(0, 8)

export const guardarResultadoPartida = async ({
  idJuego,
  horaInicio,
  horaFin = new Date(),
  tiempoTranscurrido,
  aciertos,
  errores,
  puntuacion
}) => {
  try {
    const usuarioGuardado = localStorage.getItem('usuario')
    const usuario = usuarioGuardado
      ? JSON.parse(usuarioGuardado)
      : null
    const idJuegoNumerico = Number(idJuego)

    if (!usuario?.id_usuario || !Number.isInteger(idJuegoNumerico)) {
      return false
    }

    const inicio = horaInicio instanceof Date ? horaInicio : horaFin
    const respuesta = await fetch('http://localhost:3000/api/resultados', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        id_usuario: usuario.id_usuario,
        id_juego: idJuegoNumerico,
        hora_inicio: formatoHora(inicio),
        hora_fin: formatoHora(horaFin),
        tiempo_transcurrido: Math.max(0, Number(tiempoTranscurrido) || 0),
        aciertos: Number(aciertos) || 0,
        errores: Number(errores) || 0,
        puntuacion: Number(puntuacion) || 0
      })
    })

    const datos = await respuesta.json()

    if (!respuesta.ok) {
      throw new Error(datos.mensaje || 'No se pudo guardar el resultado')
    }

    return true
  } catch (error) {
    console.error('Error al guardar el resultado de la partida:', error)
    return false
  }
}