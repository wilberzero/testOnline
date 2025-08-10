// Quiz Online - JavaScript Principal
// Aplicación moderna de quiz con carga EXCLUSIVA desde archivos CSV

class QuizApp {
    constructor() {
        this.availableTests = [];
        this.currentTestId = null;
        this.quizData = null;
        this.userAnswers = {};
        this.currentResults = null;
        this.isAnswersShown = false;
        this.pendingTestChange = null;
        
        // Elementos del DOM
        this.loadingOverlay = document.getElementById('loading');
        this.testSelect = document.getElementById('test-select');
        this.quizTitle = document.getElementById('quiz-title');
        this.questionsContainer = document.getElementById('questions-container');
        this.checkBtn = document.getElementById('check-btn');
        this.resetBtn = document.getElementById('reset-btn');
        this.resultModal = document.getElementById('result-modal');
        this.modalOverlay = document.getElementById('modal-overlay');
        this.closeModalBtn = document.getElementById('close-modal');
        this.continueBtn = document.getElementById('continue-btn');
        
        // Modal de confirmación
        this.changeConfirmModal = document.getElementById('change-confirm-modal');
        this.changeModalOverlay = document.getElementById('change-modal-overlay');
        this.changeCloseModalBtn = document.getElementById('change-close-modal');
        this.confirmChangeBtn = document.getElementById('confirm-change-btn');
        this.cancelChangeBtn = document.getElementById('cancel-change-btn');
        
        this.init();
    }

    /**
     * Inicializa la aplicación
     */
    async init() {
        try {
            console.log('🚀 Iniciando aplicación Quiz con carga CSV exclusiva...');
            
            // Mostrar overlay de carga
            this.showLoading();
            
            // ÚNICAMENTE carga desde CSV externos - NO datos embebidos
            await this.loadAllQuizzes();
            
            // Poblar selector con tests cargados
            this.populateTestSelector();
            
            // Cargar primer test disponible por defecto
            if (this.availableTests.length > 0) {
                await this.loadTest(this.availableTests[0].id, false);
            }
            
            // Configurar event listeners
            this.setupEventListeners();
            
            // Ocultar overlay de carga
            this.hideLoading();
            
            console.log('✅ Aplicación inicializada con', this.availableTests.length, 'tests desde CSV');
            
        } catch (error) {
            console.error('❌ Error al inicializar el quiz:', error);
            this.hideLoading();
            this.showError(error.message);
        }
    }

    /**
     * Carga todos los quizzes desde archivos CSV externos
     */
    async loadAllQuizzes() {
        // Lista de archivos CSV que la aplicación buscará
        const csvFiles = [
            'quiz_example.csv',
            'historia_test.csv', 
            'ciencias_test.csv'
        ];
        
        const loadedTests = [];
        console.log('📁 Buscando archivos CSV externos...');
        
        for (const filename of csvFiles) {
            try {
                console.log(`📄 Intentando cargar ${filename}...`);
                const response = await fetch(filename);
                
                if (response.ok) {
                    const csvText = await response.text();
                    console.log(`📝 Contenido CSV de ${filename} obtenido (${csvText.length} caracteres)`);
                    
                    const testData = this.parseCSV(csvText, filename);
                    if (testData) {
                        loadedTests.push({
                            id: this.generateTestId(filename),
                            filename: filename,
                            title: testData.title,
                            questions: testData.questions.length,
                            data: testData
                        });
                        console.log(`✅ ${filename} parseado correctamente - "${testData.title}" (${testData.questions.length} preguntas)`);
                    } else {
                        console.warn(`⚠️ ${filename} no pudo ser parseado - formato inválido`);
                    }
                } else {
                    console.warn(`⚠️ ${filename} no se pudo cargar - HTTP ${response.status}`);
                }
            } catch (error) {
                console.warn(`⚠️ Error al acceder a ${filename}:`, error.message);
            }
        }
        
        this.availableTests = loadedTests;
        
        // Si no se cargó ningún test CSV válido, lanzar error
        if (loadedTests.length === 0) {
            throw new Error(`No se pudieron cargar archivos CSV válidos.

Los archivos CSV deben estar en la misma carpeta que este HTML y seguir el formato correcto.

Archivos buscados:
• quiz_example.csv
• historia_test.csv  
• ciencias_test.csv

Formato CSV requerido:
Primera línea: "Título del Examen,Nombre del Test"
Otras líneas: "Pregunta,Texto pregunta,Opción A,Opción B,Opción C,Opción D,Respuesta correcta"`);
        }
        
        console.log(`✅ Total de tests cargados desde CSV: ${loadedTests.length}`);
    }

    /**
     * Función de parseo CSV pura
     */
    parseCSV(csvText, filename) {
        try {
            const lines = csvText.trim().split('\n');
            
            if (lines.length < 2) {
                console.error(`❌ CSV ${filename} debe tener al menos 2 líneas (título + al menos 1 pregunta)`);
                return null;
            }
            
            // Primera línea: Título del examen
            const titleLine = lines[0].split(',');
            if (titleLine.length < 2 || titleLine[0].trim().replace(/"/g, '') !== 'Título del Examen') {
                console.error(`❌ Primera línea de ${filename} debe ser: "Título del Examen,Nombre del Test"`);
                console.error(`❌ Encontrado: "${lines[0]}"`);
                return null;
            }
            
            const title = titleLine[1].trim().replace(/"/g, '');
            if (!title) {
                console.error(`❌ ${filename}: El nombre del test no puede estar vacío`);
                return null;
            }
            
            const questions = [];
            
            // Líneas siguientes: Preguntas
            for (let i = 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue; // Saltar líneas vacías
                
                const parts = line.split(',');
                
                if (parts.length !== 7) {
                    console.error(`❌ Línea ${i + 1} de ${filename} debe tener exactamente 7 elementos separados por comas`);
                    console.error(`❌ Encontrados ${parts.length} elementos: ${line}`);
                    continue;
                }
                
                if (parts[0].trim().replace(/"/g, '') !== 'Pregunta') {
                    console.error(`❌ Línea ${i + 1} de ${filename} debe empezar con "Pregunta"`);
                    console.error(`❌ Encontrado: "${parts[0]}"`);
                    continue;
                }
                
                const questionText = parts[1].trim().replace(/"/g, '');
                const optionA = parts[2].trim().replace(/"/g, '');
                const optionB = parts[3].trim().replace(/"/g, '');
                const optionC = parts[4].trim().replace(/"/g, '');
                const optionD = parts[5].trim().replace(/"/g, '');
                const correctAnswer = parts[6].trim().toUpperCase().replace(/"/g, '');
                
                // Validar que todos los campos tengan contenido
                if (!questionText || !optionA || !optionB || !optionC || !optionD || !correctAnswer) {
                    console.error(`❌ Línea ${i + 1} de ${filename} tiene campos vacíos`);
                    continue;
                }
                
                // Validar que la respuesta correcta sea A, B, C o D
                if (!['A', 'B', 'C', 'D'].includes(correctAnswer)) {
                    console.error(`❌ Línea ${i + 1} de ${filename} - respuesta correcta debe ser A, B, C o D. Encontrado: "${correctAnswer}"`);
                    continue;
                }
                
                questions.push({
                    id: questions.length, // Usar índice basado en preguntas válidas
                    question: questionText,
                    options: {
                        A: optionA,
                        B: optionB,
                        C: optionC,
                        D: optionD
                    },
                    correct: correctAnswer
                });
            }
            
            if (questions.length === 0) {
                console.error(`❌ ${filename} no tiene preguntas válidas después del parseo`);
                return null;
            }
            
            console.log(`✅ ${filename} parseado exitosamente: "${title}" con ${questions.length} preguntas`);
            return { title, questions };
            
        } catch (error) {
            console.error(`❌ Error crítico parseando ${filename}:`, error);
            return null;
        }
    }

    /**
     * Generador de ID basado en nombre de archivo
     */
    generateTestId(filename) {
        // Convertir nombre de archivo a ID: "historia_test.csv" -> "historia"
        return filename.replace('.csv', '').replace('_test', '').replace('quiz_', '');
    }

    /**
     * Puebla el selector de tests con los disponibles
     */
    populateTestSelector() {
        // Limpiar selector
        this.testSelect.innerHTML = '';
        
        if (this.availableTests.length === 0) {
            const option = document.createElement('option');
            option.value = '';
            option.textContent = 'No hay tests CSV disponibles';
            this.testSelect.appendChild(option);
            this.testSelect.disabled = true;
            console.log('❌ Selector deshabilitado - no hay tests CSV válidos');
            return;
        }
        
        // Agregar cada test disponible
        this.availableTests.forEach((test, index) => {
            const option = document.createElement('option');
            option.value = test.id;
            option.textContent = `${test.title} (${test.questions} preguntas)`;
            
            // Seleccionar el primero por defecto
            if (index === 0) {
                option.selected = true;
            }
            
            this.testSelect.appendChild(option);
        });
        
        this.testSelect.disabled = false;
        console.log('📋 Selector poblado con', this.availableTests.length, 'tests desde CSV');
    }

    /**
     * Configura todos los event listeners
     */
    setupEventListeners() {
        // Solo configurar event listeners si hay tests disponibles
        if (this.availableTests.length === 0) {
            console.log('⚠️ No se configuran event listeners - no hay tests CSV disponibles');
            return;
        }
        
        // Selector de tests
        this.testSelect.addEventListener('change', (e) => this.handleTestChange(e.target.value));
        
        // Botones principales
        this.checkBtn.addEventListener('click', () => this.checkAnswers());
        this.resetBtn.addEventListener('click', () => this.resetQuiz());
        
        // Modal de resultados
        this.closeModalBtn.addEventListener('click', () => this.closeModal());
        this.continueBtn.addEventListener('click', () => this.showAnswersFeedback());
        this.modalOverlay.addEventListener('click', () => this.closeModal());
        
        // Modal de confirmación
        this.changeCloseModalBtn.addEventListener('click', () => this.closeChangeConfirmModal());
        this.confirmChangeBtn.addEventListener('click', () => this.confirmTestChange());
        this.cancelChangeBtn.addEventListener('click', () => this.cancelTestChange());
        this.changeModalOverlay.addEventListener('click', () => this.closeChangeConfirmModal());
        
        // Respuestas de preguntas
        this.questionsContainer.addEventListener('change', (e) => {
            if (e.target.type === 'radio') {
                this.handleAnswerChange(e);
            }
        });
        
        // Cerrar modales con Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (!this.changeConfirmModal.classList.contains('hidden')) {
                    this.closeChangeConfirmModal();
                } else if (!this.resultModal.classList.contains('hidden')) {
                    this.closeModal();
                }
            }
        });
        
        console.log('🎯 Event listeners configurados');
    }

    /**
     * Maneja el cambio de test en el selector
     */
    async handleTestChange(testId) {
        if (!testId || testId === this.currentTestId) {
            return;
        }

        console.log('🔄 Solicitando cambio a test:', testId, 'desde:', this.currentTestId);

        // Verificar si hay respuestas seleccionadas
        if (this.hasAnswers()) {
            console.log('📝 Hay respuestas contestadas, mostrando modal de confirmación');
            this.pendingTestChange = testId;
            this.showChangeConfirmation();
        } else {
            console.log('✅ No hay respuestas, cambiando directamente');
            await this.loadTest(testId, true);
        }
    }

    /**
     * Verifica si hay respuestas seleccionadas
     */
    hasAnswers() {
        const hasAnswers = Object.keys(this.userAnswers).length > 0;
        console.log('🔍 ¿Tiene respuestas contestadas?', hasAnswers, 'Respuestas:', this.userAnswers);
        return hasAnswers;
    }

    /**
     * Muestra el modal de confirmación para cambio de test
     */
    showChangeConfirmation() {
        console.log('💬 Mostrando modal de confirmación para cambiar de test');
        this.changeConfirmModal.classList.remove('hidden');
        this.changeConfirmModal.style.display = 'flex';
        
        // Forzar reflow para que la animación funcione
        this.changeConfirmModal.offsetHeight;
    }

    /**
     * Cierra el modal de confirmación
     */
    closeChangeConfirmModal() {
        console.log('❌ Cerrando modal de confirmación');
        this.changeConfirmModal.classList.add('hidden');
        this.changeConfirmModal.style.display = '';
        
        // Restaurar el valor del selector al test actual
        if (this.currentTestId) {
            this.testSelect.value = this.currentTestId;
        }
        
        this.pendingTestChange = null;
    }

    /**
     * Confirma el cambio de test
     */
    async confirmTestChange() {
        console.log('✅ Usuario confirmó cambio de test a:', this.pendingTestChange);
        this.closeChangeConfirmModal();
        
        if (this.pendingTestChange) {
            await this.loadTest(this.pendingTestChange, true);
            this.pendingTestChange = null;
        }
    }

    /**
     * Cancela el cambio de test
     */
    cancelTestChange() {
        console.log('❌ Usuario canceló el cambio de test');
        this.closeChangeConfirmModal();
    }

    /**
     * Carga un test específico
     */
    async loadTest(testId, shouldReset = true) {
        const test = this.availableTests.find(t => t.id === testId);
        
        if (!test) {
            console.error('❌ Test no encontrado:', testId);
            return;
        }

        console.log('📖 Cargando test desde CSV:', test.title, `(${test.filename})`);

        if (shouldReset) {
            this.resetQuizState();
        }

        this.currentTestId = testId;
        this.quizData = test.data;
        this.testSelect.value = testId;
        
        // Construir interfaz
        this.buildQuizInterface();
        
        console.log(`✅ Test "${test.title}" cargado exitosamente desde ${test.filename}`);
    }

    /**
     * Construye la interfaz del quiz dinámicamente
     */
    buildQuizInterface() {
        if (!this.quizData) {
            console.error('❌ No hay datos del quiz para construir la interfaz');
            return;
        }
        
        // Establecer título
        this.quizTitle.textContent = this.quizData.title;
        
        // Construir preguntas
        this.questionsContainer.innerHTML = '';
        
        this.quizData.questions.forEach((question, index) => {
            const questionCard = this.createQuestionCard(question, index);
            this.questionsContainer.appendChild(questionCard);
        });
        
        // Habilitar botón de corrección cuando todas las preguntas estén respondidas
        this.updateCheckButtonState();
        
        // Animación de entrada
        setTimeout(() => {
            const cards = document.querySelectorAll('.question-card');
            cards.forEach((card, index) => {
                card.style.animation = `fadeInUp 0.4s ease ${index * 0.1}s both`;
            });
        }, 100);
        
        console.log('🎨 Interfaz construida con', this.quizData.questions.length, 'preguntas');
    }

    /**
     * Crea una tarjeta de pregunta individual
     */
    createQuestionCard(question, index) {
        const card = document.createElement('div');
        card.className = `question-card stagger-${Math.min(index + 1, 5)}`;
        card.dataset.questionId = question.id;
        
        card.innerHTML = `
            <h3 class="question-title">
                <span class="question-number">${index + 1}</span>
                ${question.question}
            </h3>
            <div class="options-grid">
                ${Object.entries(question.options).map(([letter, text]) => `
                    <div class="option-item">
                        <input type="radio" 
                               id="q${question.id}_${letter}" 
                               name="question_${question.id}" 
                               value="${letter}" 
                               class="option-input">
                        <label for="q${question.id}_${letter}" class="option-label">
                            <span class="option-letter">${letter}</span>
                            <span class="option-text">${text}</span>
                        </label>
                    </div>
                `).join('')}
            </div>
        `;
        
        return card;
    }

    /**
     * Maneja el cambio de respuesta en una pregunta
     */
    handleAnswerChange(event) {
        const questionId = event.target.name.replace('question_', '');
        const answer = event.target.value;
        
        this.userAnswers[questionId] = answer;
        console.log('📝 Respuesta registrada - Pregunta:', questionId, 'Respuesta:', answer);
        
        // Agregar efecto visual al seleccionar
        const label = event.target.nextElementSibling;
        if (label) {
            label.style.animation = 'none';
            setTimeout(() => {
                label.style.animation = 'correctAnswer 0.3s ease';
            }, 10);
        }
        
        this.updateCheckButtonState();
    }

    /**
     * Actualiza el estado del botón de corrección
     */
    updateCheckButtonState() {
        if (!this.quizData) return;
        
        const totalQuestions = this.quizData.questions.length;
        const answeredQuestions = Object.keys(this.userAnswers).length;
        
        const wasDisabled = this.checkBtn.disabled;
        this.checkBtn.disabled = answeredQuestions < totalQuestions;
        
        if (wasDisabled !== this.checkBtn.disabled) {
            console.log(`🔘 Botón de corrección ${this.checkBtn.disabled ? 'deshabilitado' : 'habilitado'} (${answeredQuestions}/${totalQuestions} preguntas respondidas)`);
        }
    }

    /**
     * Corrige las respuestas y muestra el modal de resultados
     */
    checkAnswers() {
        if (this.isAnswersShown) {
            this.resetQuiz();
            return;
        }
        
        let correctCount = 0;
        const totalQuestions = this.quizData.questions.length;
        
        // Evaluar respuestas
        this.quizData.questions.forEach(question => {
            const userAnswer = this.userAnswers[question.id];
            const isCorrect = userAnswer === question.correct;
            if (isCorrect) {
                correctCount++;
            }
            console.log(`📊 Pregunta ${question.id + 1}: ${userAnswer} ${isCorrect ? '✓' : '✗'} (correcta: ${question.correct})`);
        });
        
        const percentage = Math.round((correctCount / totalQuestions) * 100);
        
        this.currentResults = {
            correct: correctCount,
            total: totalQuestions,
            percentage: percentage
        };
        
        console.log('📈 Resultados:', this.currentResults);
        
        // Mostrar modal
        setTimeout(() => {
            this.showResultModal();
        }, 100);
    }

    /**
     * Muestra el modal con los resultados
     */
    showResultModal() {
        if (!this.currentResults) return;
        
        const { correct, total, percentage } = this.currentResults;
        
        // Actualizar contenido del modal
        document.getElementById('score-percentage').textContent = `${percentage}%`;
        document.getElementById('score-text').textContent = `Has acertado ${correct} de ${total} preguntas`;
        
        // Mostrar modal
        this.resultModal.style.display = 'flex';
        this.resultModal.classList.remove('hidden');
        
        // Animar barra de progreso
        setTimeout(() => {
            const progressBar = document.getElementById('score-progress');
            if (progressBar) {
                progressBar.style.width = `${percentage}%`;
            }
        }, 500);
        
        console.log('🎉 Modal de resultados mostrado');
    }

    /**
     * Cierra el modal de resultados
     */
    closeModal() {
        this.resultModal.classList.add('hidden');
        this.resultModal.style.display = '';
        console.log('❌ Modal de resultados cerrado');
    }

    /**
     * Muestra las respuestas con retroalimentación visual
     */
    showAnswersFeedback() {
        this.closeModal();
        
        // Cambiar texto del botón de corrección
        this.checkBtn.innerHTML = `
            <span>Nuevo Test</span>
            <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
        `;
        
        this.isAnswersShown = true;
        
        // Marcar respuestas con colores
        this.quizData.questions.forEach(question => {
            const userAnswer = this.userAnswers[question.id];
            const correctAnswer = question.correct;
            
            const questionCard = document.querySelector(`[data-question-id="${question.id}"]`);
            if (!questionCard) return;
            
            const optionLabels = questionCard.querySelectorAll('.option-label');
            
            optionLabels.forEach(label => {
                const input = label.previousElementSibling;
                if (!input) return;
                
                const optionLetter = input.value;
                
                // Limpiar clases previas
                label.classList.remove('correct', 'incorrect', 'correct-answer');
                
                if (optionLetter === correctAnswer) {
                    // Esta es la respuesta correcta
                    label.classList.add('correct-answer');
                    
                    if (userAnswer === correctAnswer) {
                        // El usuario acertó esta pregunta
                        label.classList.add('correct');
                    }
                } else if (input.checked && userAnswer !== correctAnswer) {
                    // Esta es la respuesta incorrecta que eligió el usuario
                    label.classList.add('incorrect');
                }
                
                // Forzar actualización visual
                label.offsetHeight;
            });
        });
        
        // Scroll suave al inicio
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        console.log('🎨 Retroalimentación visual de respuestas mostrada');
    }

    /**
     * Reinicia solo el estado del quiz actual (sin cambiar de test)
     */
    resetQuiz() {
        console.log('🔄 Reiniciando quiz actual');
        this.resetQuizState();
        this.buildQuizInterface();
        this.closeModal();
        
        // Scroll al inicio
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    /**
     * Reinicia el estado del quiz
     */
    resetQuizState() {
        // Limpiar respuestas
        this.userAnswers = {};
        this.currentResults = null;
        this.isAnswersShown = false;
        
        // Resetear botón de corrección
        this.checkBtn.innerHTML = `
            <span>Corregir Test</span>
            <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
        `;
        
        console.log('🧹 Estado del quiz reiniciado');
    }

    /**
     * Muestra el overlay de carga
     */
    showLoading() {
        this.loadingOverlay.classList.remove('hidden');
        
        // Actualizar mensaje de carga
        const loadingText = this.loadingOverlay.querySelector('p');
        if (loadingText) {
            loadingText.textContent = 'Buscando archivos CSV externos...';
        }
    }

    /**
     * Oculta el overlay de carga
     */
    hideLoading() {
        setTimeout(() => {
            this.loadingOverlay.classList.add('hidden');
        }, 1000);
    }

    /**
     * Muestra un mensaje de error
     */
    showError(message) {
        this.hideLoading();
        
        // Deshabilitar selector
        this.testSelect.innerHTML = '<option value="">No hay tests CSV disponibles</option>';
        this.testSelect.disabled = true;
        
        // Mostrar mensaje de error detallado
        this.questionsContainer.innerHTML = `
            <div class="error-message" style="
                background: rgba(239, 68, 68, 0.1);
                border: 1px solid rgba(239, 68, 68, 0.3);
                color: white;
                padding: 2rem;
                border-radius: 16px;
                text-align: center;
                margin: 2rem 0;
                backdrop-filter: blur(10px);
            ">
                <h3 style="margin: 0 0 1rem 0;">⚠️ Error de Carga CSV</h3>
                <p style="margin: 0 0 1rem 0; white-space: pre-line;">${message}</p>
                <div style="
                    background: rgba(255, 255, 255, 0.1);
                    padding: 1rem;
                    border-radius: 8px;
                    margin-top: 1rem;
                    font-size: 0.9em;
                    text-align: left;
                ">
                    <strong>📋 Solución:</strong><br>
                    1. Crea los archivos CSV en la misma carpeta que este HTML<br>
                    2. Usa exactamente estos nombres de archivo<br>
                    3. Sigue el formato CSV especificado<br>
                    4. Recarga la página<br><br>
                    <strong>🔄 Ejemplo de archivo CSV válido:</strong><br>
                    <code style="display: block; background: rgba(0,0,0,0.3); padding: 8px; border-radius: 4px; margin-top: 8px; font-family: monospace;">
Título del Examen,Matemáticas Básicas<br>
Pregunta,¿Cuánto es 2+2?,2,3,4,5,C<br>
Pregunta,¿Cuánto es 3*3?,6,8,9,10,C
                    </code>
                </div>
            </div>
        `;
        
        // Ocultar título del quiz
        this.quizTitle.textContent = 'Error al cargar tests CSV';
        
        console.log('❌ Error mostrado al usuario:', message);
    }
}

// Efectos adicionales y mejoras de UX
document.addEventListener('DOMContentLoaded', () => {
    // Inicializar aplicación
    console.log('🌟 Iniciando Quiz App con carga CSV exclusiva...');
    window.quiz = new QuizApp();
    
    // Agregar efectos de fondo sutiles
    createBackgroundEffects();
    
    // Mejoras de accesibilidad
    setupAccessibility();
});

/**
 * Crea efectos de fondo sutiles
 */
function createBackgroundEffects() {
    const body = document.body;
    
    // Crear elementos decorativos flotantes
    for (let i = 0; i < 5; i++) {
        const bubble = document.createElement('div');
        bubble.className = 'floating-bubble';
        bubble.style.cssText = `
            position: fixed;
            width: ${Math.random() * 100 + 50}px;
            height: ${Math.random() * 100 + 50}px;
            background: linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05));
            border-radius: 50%;
            pointer-events: none;
            z-index: -1;
            animation: float ${Math.random() * 10 + 10}s infinite linear;
            left: ${Math.random() * 100}%;
            top: ${Math.random() * 100}%;
            backdrop-filter: blur(2px);
        `;
        
        body.appendChild(bubble);
    }
    
    // Agregar animación CSS para las burbujas
    const style = document.createElement('style');
    style.textContent = `
        @keyframes float {
            0%, 100% {
                transform: translateY(0px) rotate(0deg);
                opacity: 0.7;
            }
            50% {
                transform: translateY(-20px) rotate(180deg);
                opacity: 0.3;
            }
        }
    `;
    document.head.appendChild(style);
}

/**
 * Configura mejoras de accesibilidad
 */
function setupAccessibility() {
    // Navegación por teclado mejorada
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            if (e.target.classList.contains('option-label')) {
                e.preventDefault();
                const radio = e.target.previousElementSibling;
                if (radio && radio.type === 'radio') {
                    radio.checked = true;
                    radio.dispatchEvent(new Event('change', { bubbles: true }));
                }
            }
        }
    });
    
    // Mejorar el foco visual
    document.addEventListener('focusin', (e) => {
        if (e.target.classList.contains('option-label')) {
            e.target.style.outline = '2px solid rgba(255, 255, 255, 0.8)';
            e.target.style.outlineOffset = '4px';
        }
    });
    
    document.addEventListener('focusout', (e) => {
        if (e.target.classList.contains('option-label')) {
            e.target.style.outline = '';
            e.target.style.outlineOffset = '';
        }
    });
}