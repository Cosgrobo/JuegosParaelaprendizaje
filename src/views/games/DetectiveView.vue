<template>
  <div class="detective-container">
    <BackToMenu />
    
    <!-- BARRA SUPERIOR Y CONMUTADOR DE ROL -->
    <header class="detective-header">
      <div class="brand">
        <span class="icon">🕵️‍♂️</span>
        <span class="title">Detective Escolar</span>
      </div>

      <div class="role-switch">
        <button @click="toggleRole" class="btn-secondary">
          <i :class="isTeacher ? 'fa-solid fa-chalkboard-user' : 'fa-solid fa-graduation-cap'"></i>
          <span>Modo: {{ isTeacher ? 'Maestro' : 'Estudiante' }}</span>
        </button>
      </div>
    </header>

    <!-- TÍTULO PRINCIPAL -->
    <div class="hero">
      <h1>🕵️‍♂️ Detective Escolar</h1>
      <p>Deduce el concepto oculto utilizando las pistas antes de agotar tus intentos.</p>
    </div>

    <!-- PANEL DE MÉTRICAS -->
    <div class="metrics-grid">
      <div class="metric-card">
        <div class="metric-label">Aciertos</div>
        <div class="metric-value">{{ hits }}</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Errores</div>
        <div class="metric-value">{{ errors }}</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Puntuación</div>
        <div class="metric-value">{{ totalScore }}</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Progreso</div>
        <div class="metric-value">{{ progressPercentage }}%</div>
      </div>
      <div class="metric-card col-span-mobile">
        <div class="metric-label">Tiempo</div>
        <div class="metric-value">{{ formattedTime }}</div>
      </div>
    </div>

    <!-- CONTENIDO PRINCIPAL -->
    <main class="main-content">
      
      <!-- VISTA ESTUDIANTE / JUEGO -->
      <transition name="fade" mode="out-in">
        <div v-if="!isTeacher">
          <!-- SELECCIÓN Y NAVEGACIÓN -->
          <div class="filter-bar">
            <div class="filter-group">
              <label>Materia:</label>
              <select v-model="selectedSubjectFilter" class="select-input">
                <option value="ALL">Todas las Materias</option>
                <option v-for="subj in availableSubjects" :key="subj" :value="subj">{{ subj }}</option>
              </select>
            </div>

            <div class="nav-group">
              <span>Caso {{ currentCaseIndex + 1 }} de {{ filteredEnigmas.length }}</span>
              <button @click="prevCase" :disabled="currentCaseIndex === 0" class="btn-icon">❮</button>
              <button @click="nextCase" :disabled="currentCaseIndex >= filteredEnigmas.length - 1" class="btn-icon">❯</button>
            </div>
          </div>

          <!-- EXPEDIENTE DEL CASO -->
          <div v-if="activeCase" class="case-card">
            <div class="case-header">
              <div>
                <span class="badge">{{ activeCase.subject }}</span>
                <h2 class="case-title">{{ activeCase.title }}</h2>
              </div>
              
              <div class="lives-container">
                <div class="lives-label">Intentos restantes</div>
                <div class="hearts">
                  <span v-for="n in 3" :key="n" :class="['heart', n <= currentLives ? 'active' : 'empty']">❤️</span>
                </div>
              </div>
            </div>

            <!-- ESTADO RESUELTO -->
            <div v-if="isSolved(activeCase.id)" class="solved-banner">
              <div class="solved-icon">✓</div>
              <h3>¡Expediente Resuelto!</h3>
              <p>Respuesta: <strong>{{ activeCase.answer }}</strong> (+{{ getSolvedPoints(activeCase.id) }} Pts)</p>
            </div>

            <!-- PISTAS Y DEDUCCIÓN -->
            <div v-else class="case-body">
              <div class="clues-header">
                <h3>Pistas del Caso:</h3>
                <span>Recompensa: <strong>{{ currentRewardPoints }} Pts</strong></span>
              </div>

              <div class="clues-list">
                <div class="clue-box active">
                  <div class="clue-title">🔍 Pista 1 (Contextual - 100 Pts)</div>
                  <p>"{{ activeCase.clues[0] }}"</p>
                </div>

                <div :class="['clue-box', clueLevel >= 2 ? 'active' : 'locked']">
                  <div class="clue-title">{{ clueLevel >= 2 ? '🔑' : '🔒' }} Pista 2 (Dato Clave - 60 Pts)</div>
                  <p v-if="clueLevel >= 2">"{{ activeCase.clues[1] }}"</p>
                  <p v-else class="placeholder">Desbloquea esta pista si necesitas más información.</p>
                </div>

                <div :class="['clue-box', clueLevel >= 3 ? 'active' : 'locked']">
                  <div class="clue-title">{{ clueLevel >= 3 ? '🔑' : '🔒' }} Pista 3 (Muy Reveladora - 30 Pts)</div>
                  <p v-if="clueLevel >= 3">"{{ activeCase.clues[2] }}"</p>
                  <p v-else class="placeholder">Pista final directa para deducir la respuesta.</p>
                </div>
              </div>

              <div class="action-center">
                <button @click="requestMoreClue" :disabled="clueLevel >= 3" class="btn-secondary">
                  💡 Pedir otra pista (- Puntuación)
                </button>
              </div>

              <form @submit.prevent="submitDeduction" class="deduction-form">
                <label for="deduction">Escribe tu deducción / respuesta:</label>
                <div class="input-group">
                  <input 
                    v-model="deductionInput"
                    id="deduction"
                    type="text" 
                    placeholder="Ej. Fotosintesis, ADN, Teorema de Pitagoras..." 
                    autocomplete="off"
                  >
                  <button type="submit" class="btn-primary">Comprobar</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </transition>

      <!-- VISTA MAESTRO / ADMIN -->
      <transition name="fade" mode="out-in">
        <div v-if="isTeacher" class="teacher-panel">
          <div class="case-card">
            <div class="panel-header">
              <div>
                <h2>Panel del Maestro</h2>
                <p>Gestiona temas, materias y revisa el desempeño de los alumnos.</p>
              </div>
              <button @click="showAddModal = true" class="btn-primary">+ Agregar Enigma</button>
            </div>

            <div class="table-container">
              <h3>Resultados y Puntuaciones</h3>
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Posición</th>
                    <th>Estudiante</th>
                    <th>Casos Resueltos</th>
                    <th class="text-right">Puntuación Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(student, idx) in leaderboard" :key="student.name">
                    <td>{{ idx + 1 }}°</td>
                    <td><strong>{{ student.name }}</strong></td>
                    <td>{{ student.solved }} / {{ enigmas.length }}</td>
                    <td class="text-right"><strong>{{ student.score }} Pts</strong></td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="enigmas-list-section">
              <h3>Enigmas Registrados ({{ enigmas.length }})</h3>
              <div class="enigmas-grid">
                <div v-for="item in enigmas" :key="item.id" class="enigma-card">
                  <div>
                    <span class="badge">{{ item.subject }}</span>
                    <h4>{{ item.title }}</h4>
                    <p>Respuesta: <strong>{{ item.answer }}</strong></p>
                  </div>
                  <button @click="deleteEnigma(item.id)" class="btn-danger">🗑️</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </transition>
    </main>

    <!-- REINICIAR -->
    <div class="footer-actions">
      <button @click="resetCurrentGame" class="btn-secondary">🔄 Reiniciar Juego</button>
    </div>

    <!-- MODAL FEEDBACK -->
    <div v-if="showModal" class="modal-overlay">
      <div class="modal-card">
        <div :class="['modal-icon', modalSuccess ? 'success' : 'error']">
          {{ modalSuccess ? '✓' : '✕' }}
        </div>
        <h3>{{ modalSuccess ? '¡Correcto!' : 'Respuesta Incorrecta' }}</h3>
        <p>{{ modalMessage }}</p>
        <button @click="showModal = false" class="btn-primary block">Continuar</button>
      </div>
    </div>

    <!-- MODAL AGREGAR ENIGMA -->
    <div v-if="showAddModal" class="modal-overlay">
      <div class="modal-card large">
        <div class="modal-header">
          <h3>Nuevo Enigma Académico</h3>
          <button @click="showAddModal = false" class="btn-close">✕</button>
        </div>
        <form @submit.prevent="saveNewEnigma" class="form-grid">
          <div class="form-group">
            <label>Materia</label>
            <input v-model="newForm.subject" required type="text" placeholder="Ej: Biología">
          </div>
          <div class="form-group">
            <label>Título del Caso</label>
            <input v-model="newForm.title" required type="text" placeholder="Ej: El misterio celular">
          </div>
          <div class="form-group">
            <label>Respuesta Oculta</label>
            <input v-model="newForm.answer" required type="text" placeholder="Ej: Fotosintesis">
          </div>
          <div class="form-group">
            <label>Pista 1 (100 pts)</label>
            <input v-model="newForm.c1" required type="text" placeholder="Pista contextual...">
          </div>
          <div class="form-group">
            <label>Pista 2 (60 pts)</label>
            <input v-model="newForm.c2" required type="text" placeholder="Dato técnico...">
          </div>
          <div class="form-group">
            <label>Pista 3 (30 pts)</label>
            <input v-model="newForm.c3" required type="text" placeholder="Pista muy reveladora...">
          </div>
          <div class="form-actions">
            <button type="button" @click="showAddModal = false" class="btn-secondary">Cancelar</button>
            <button type="submit" class="btn-primary">Guardar</button>
          </div>
        </form>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import BackToMenu from '../../components/BackToMenu.vue'

const DEFAULT_ENIGMAS = [
  {
    id: "case-01",
    subject: "Biología",
    title: "El Proceso Verde",
    answer: "Fotosintesis",
    clues: [
      "Proceso mediante el cual los organismos con clorofila captan luz solar.",
      "Transforma agua y dióxido de carbono en glucosa y libera oxígeno a la atmósfera.",
      "Es la forma de nutrición autótrofa propia de las plantas verdes."
    ]
  },
  {
    id: "case-02",
    subject: "Matemáticas",
    title: "El Triángulo Sagrado",
    answer: "Teorema de Pitagoras",
    clues: [
      "Fórmula matemática fundamental que aplica solo en triángulos rectángulos.",
      "Establece que la suma de los cuadrados de los catetos es igual al cuadrado de la hipotenusa.",
      "Se expresa algebraicamente como a² + b² = c²."
    ]
  },
  {
    id: "case-03",
    subject: "Historia",
    title: "La Era del Carbón y Vapor",
    answer: "Revolucion Industrial",
    clues: [
      "Transformación económica y tecnológica iniciada en Gran Bretaña a mediados del siglo XVIII.",
      "Sustituyó el trabajo manual artesanal por la producción mecanizada en fábricas.",
      "Paso decisivo caracterizado por el invento de la máquina de vapor y el ferrocarril."
    ]
  },
  {
    id: "case-04",
    subject: "Física",
    title: "La Fuerza Invisible",
    answer: "Gravedad",
    clues: [
      "Fenómeno natural por el cual los objetos con masa se atraen entre sí.",
      "Es la responsable de mantener a los planetas orbitando alrededor del Sol.",
      "Fue formulada por Isaac Newton tras la célebre anécdota de la manzana."
    ]
  },
  {
    id: "case-05",
    subject: "Lengua",
    title: "El Traslado de Sentido",
    answer: "Metafora",
    clues: [
      "Figura retórica que consiste en identificar un término real con uno imaginario.",
      "No utiliza enlaces de comparación explícitos como la palabra 'como'.",
      "Un ejemplo clásico es decir 'Las perlas de su boca' para referirse a sus dientes."
    ]
  }
]

const isTeacher = ref(false)
const enigmas = ref([...DEFAULT_ENIGMAS])
const selectedSubjectFilter = ref('ALL')
const currentCaseIndex = ref(0)

const hits = ref(0)
const errors = ref(0)
const totalScore = ref(0)
const solvedMap = ref({})

const clueLevel = ref(1)
const currentLives = ref(3)
const deductionInput = ref('')

const secondsElapsed = ref(0)
let timerInterval = null

const showModal = ref(false)
const modalSuccess = ref(false)
const modalMessage = ref('')
const showAddModal = ref(false)

const newForm = ref({ subject: '', title: '', answer: '', c1: '', c2: '', c3: '' })

const leaderboard = ref([
  { name: "Estudiante Actual", score: computed(() => totalScore.value), solved: computed(() => hits.value) },
  { name: "Agente Lucía", score: 260, solved: 3 },
  { name: "Inspector Carlos", score: 100, solved: 1 }
])

const startTimer = () => {
  if (timerInterval) clearInterval(timerInterval)
  timerInterval = setInterval(() => { secondsElapsed.value++ }, 1000)
}

const formattedTime = computed(() => {
  const mins = Math.floor(secondsElapsed.value / 60).toString().padStart(2, '0')
  const secs = (secondsElapsed.value % 60).toString().padStart(2, '0')
  return `${mins}:${secs}`
})

const availableSubjects = computed(() => [...new Set(enigmas.value.map(e => e.subject))])
const filteredEnigmas = computed(() => selectedSubjectFilter.value === 'ALL' ? enigmas.value : enigmas.value.filter(e => e.subject === selectedSubjectFilter.value))
const activeCase = computed(() => filteredEnigmas.value[currentCaseIndex.value] || filteredEnigmas.value[0])
const progressPercentage = computed(() => enigmas.value.length === 0 ? 0 : Math.round((hits.value / enigmas.value.length) * 100))
const currentRewardPoints = computed(() => clueLevel.value === 1 ? 100 : clueLevel.value === 2 ? 60 : 30)

const toggleRole = () => { isTeacher.value = !isTeacher.value }
const isSolved = (id) => !!solvedMap.value[id]
const getSolvedPoints = (id) => solvedMap.value[id] || 0
const requestMoreClue = () => { if (clueLevel.value < 3) clueLevel.value++ }

const normalizeString = (str) => str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "")

const submitDeduction = () => {
  if (!deductionInput.value.trim() || !activeCase.value) return
  if (normalizeString(deductionInput.value) === normalizeString(activeCase.value.answer)) {
    const pts = currentRewardPoints.value
    solvedMap.value[activeCase.value.id] = pts
    hits.value++
    totalScore.value += pts
    modalSuccess.value = true
    modalMessage.value = `¡Has deducido correctamente "${activeCase.value.answer}" sumando +${pts} Pts!`
    showModal.value = true
    deductionInput.value = ''
  } else {
    errors.value++
    currentLives.value--
    modalSuccess.value = false
    modalMessage.value = currentLives.value <= 0 
      ? `Sin intentos restantes. La respuesta era "${activeCase.value.answer}".` 
      : `Incorrecto. Te quedan ${currentLives.value} intento(s).`
    showModal.value = true
  }
}

const prevCase = () => { if (currentCaseIndex.value > 0) { currentCaseIndex.value--; resetCaseState(); } }
const nextCase = () => { if (currentCaseIndex.value < filteredEnigmas.value.length - 1) { currentCaseIndex.value++; resetCaseState(); } }
const resetCaseState = () => { clueLevel.value = 1; currentLives.value = 3; deductionInput.value = ''; }

const resetCurrentGame = () => {
  hits.value = 0; errors.value = 0; totalScore.value = 0; solvedMap.value = {}; secondsElapsed.value = 0; currentCaseIndex.value = 0; resetCaseState();
}

const saveNewEnigma = () => {
  enigmas.value.push({
    id: `case-custom-${Date.now()}`,
    subject: newForm.value.subject,
    title: newForm.value.title,
    answer: newForm.value.answer,
    clues: [newForm.value.c1, newForm.value.c2, newForm.value.c3]
  })
  showAddModal.value = false
  newForm.value = { subject: '', title: '', answer: '', c1: '', c2: '', c3: '' }
}

const deleteEnigma = (id) => { enigmas.value = enigmas.value.filter(e => e.id !== id) }

watch(selectedSubjectFilter, () => { currentCaseIndex.value = 0; resetCaseState(); })
onMounted(() => { startTimer() })
onUnmounted(() => { if (timerInterval) clearInterval(timerInterval) })
</script>

<style scoped>
.detective-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 24px 16px;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: #111827;
}

.detective-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 16px;
  border-bottom: 1px solid #e5e7eb;
  margin-bottom: 24px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
  font-size: 1.25rem;
}

.hero {
  text-align: center;
  margin-bottom: 24px;
}

.hero h1 {
  font-size: 2rem;
  font-weight: 800;
  margin: 0 0 8px 0;
}

.hero p {
  color: #6b7280;
  font-size: 0.9rem;
  margin: 0;
}

/* Métricas */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 12px;
  margin-bottom: 24px;
}

.metric-card {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 12px;
  text-align: center;
}

.metric-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #4b5563;
}

.metric-value {
  font-size: 1.5rem;
  font-weight: 800;
  margin-top: 4px;
}

/* Filtros y Navegación */
.filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  padding: 10px 16px;
  border-radius: 12px;
  margin-bottom: 20px;
}

.select-input {
  background: #fff;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 6px 10px;
  font-size: 0.85rem;
  margin-left: 8px;
}

.nav-group {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  font-weight: 600;
}

/* Tarjeta del Caso */
.case-card {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
}

.case-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  border-bottom: 1px solid #f3f4f6;
  padding-bottom: 16px;
  margin-bottom: 20px;
}

.badge {
  background: #f3f4f6;
  color: #374151;
  font-size: 0.7rem;
  font-weight: 700;
  padding: 4px 8px;
  border-radius: 9999px;
  text-transform: uppercase;
}

.case-title {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 8px 0 0 0;
}

.lives-container {
  text-align: right;
}

.lives-label {
  font-size: 0.75rem;
  color: #6b7280;
  margin-bottom: 4px;
}

.hearts {
  display: flex;
  gap: 4px;
}

.heart.empty {
  opacity: 0.2;
}

/* Pistas */
.clues-header {
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
  margin-bottom: 12px;
}

.clues-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
}

.clue-box {
  padding: 12px 16px;
  border-radius: 12px;
  font-size: 0.9rem;
  border: 1px solid #e5e7eb;
}

.clue-box.active {
  background: #f9fafb;
}

.clue-box.locked {
  background: #fff;
  border-style: dashed;
  opacity: 0.6;
}

.clue-title {
  font-weight: 700;
  font-size: 0.8rem;
  margin-bottom: 4px;
}

.placeholder {
  color: #9ca3af;
  font-style: italic;
  margin: 0;
}

/* Formularios y Botones */
.action-center {
  text-align: center;
  margin-bottom: 20px;
}

.deduction-form {
  border-top: 1px solid #f3f4f6;
  padding-top: 16px;
}

.deduction-form label {
  display: block;
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  margin-bottom: 8px;
}

.input-group {
  display: flex;
  gap: 8px;
}

.input-group input {
  flex: 1;
  padding: 10px 14px;
  border: 1px solid #d1d5db;
  border-radius: 10px;
  font-size: 0.9rem;
}

.btn-primary {
  background: #111827;
  color: #fff;
  border: none;
  padding: 10px 18px;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-primary:hover {
  background: #1f2937;
}

.btn-secondary {
  background: #f3f4f6;
  color: #111827;
  border: 1px solid #e5e7eb;
  padding: 8px 14px;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
}

.btn-secondary:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.btn-icon {
  background: #fff;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  padding: 4px 10px;
  cursor: pointer;
}

.btn-icon:disabled {
  opacity: 0.3;
}

.footer-actions {
  text-align: center;
  margin-top: 32px;
}

/* Resuelto */
.solved-banner {
  background: #ecfdf5;
  border: 1px solid #a7f3d0;
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  color: #065f46;
}

.solved-icon {
  font-size: 2rem;
  font-weight: bold;
}

/* Modales */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.4);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  z-index: 50;
}

.modal-card {
  background: #fff;
  border-radius: 16px;
  padding: 24px;
  width: 100%;
  max-width: 360px;
  text-align: center;
  box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1);
}

.modal-card.large {
  max-width: 500px;
  text-align: left;
}

.modal-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 12px auto;
  font-weight: bold;
  font-size: 1.25rem;
}

.modal-icon.success { background: #ecfdf5; color: #059669; }
.modal-icon.error { background: #fef2f2; color: #dc2626; }

.block { width: 100%; margin-top: 16px; }

/* Tabla Admin */
.data-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 12px;
  font-size: 0.85rem;
}

.data-table th, .data-table td {
  padding: 10px;
  border-bottom: 1px solid #e5e7eb;
  text-align: left;
}

.text-right { text-align: right !important; }

.enigmas-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
  margin-top: 12px;
}

.enigma-card {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  padding: 12px;
  border-radius: 10px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.btn-danger {
  background: none;
  border: none;
  cursor: pointer;
}

/* Transiciones */
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
