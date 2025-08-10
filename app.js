// Quiz Online - JavaScript Principal (Bug crítico TOTALMENTE corregido con debugging)
// Aplicación moderna de quiz con soporte para múltiples tests

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
        
        // DEBUG: Verificar elementos del DOM
        this.verifyDOMElements();
        
        this.init();
    }

    /**
     * Verifica que todos los elementos del DOM estén presentes
     */
    verifyDOMElements() {
        const elements = {
            testSelect: this.testSelect,
            changeConfirmModal: this.changeConfirmModal,
            confirmChangeBtn: this.confirmChangeBtn,
            cancelChangeBtn: this.cancelChangeBtn
        };
        
        Object.entries(elements).forEach(([name, element]) => {
            if (!element) {
                console.error(`❌ Elemento DOM no encontrado: ${name}`);
            } else {
                console.log(`✅ Elemento DOM encontrado: ${name}`);
            }
        });
    }

    /**
     * Inicializa la aplicación
     */
    async init() {
        try {
            console.log('🚀 Iniciando aplicación de quiz...');
            
            // Mostrar overlay de carga
            this.showLoading();
            
            // Preparar tests disponibles
            this.setupAvailableTests();
            
            // Configurar selector de tests
            this.populateTestSelector();
            
            // Configurar event listeners PRIMERO
            this.setupEventListeners();
            
            // Cargar el primer test disponible
            if (this.availableTests.length > 0) {
                await this.executeTestChange(this.availableTests[0].id);
            }
            
            // Ocultar overlay de carga
            this.hideLoading();
            
            console.log('✅ Aplicación inicializada completamente');
            
        } catch (error) {
            console.error('💥 Error al inicializar el quiz:', error);
            this.showError('Error al cargar los tests. Por favor, recarga la página.');
        }
    }

    /**
     * Configura los tests disponibles con datos embebidos
     */
    setupAvailableTests() {
        this.availableTests = [
            {
                id: 'matematicas',
                title: 'Matemáticas Básicas',
                questions: 5,
                data: {
                    title: 'Matemáticas Básicas',
                    questions: [
                        {
                            id: 0,
                            question: '¿Cuánto es 2 + 2?',
                            options: { A: '2', B: '3', C: '4', D: '5' },
                            correct: 'C'
                        },
                        {
                            id: 1,
                            question: '¿Cuál es la raíz cuadrada de 16?',
                            options: { A: '2', B: '3', C: '4', D: '5' },
                            correct: 'C'
                        },
                        {
                            id: 2,
                            question: '¿Cuánto es 10 × 3?',
                            options: { A: '20', B: '25', C: '30', D: '35' },
                            correct: 'C'
                        },
                        {
                            id: 3,
                            question: '¿Cuál es el resultado de 15 ÷ 3?',
                            options: { A: '3', B: '4', C: '5', D: '6' },
                            correct: 'C'
                        },
                        {
                            id: 4,
                            question: '¿Cuánto es 8 - 3?',
                            options: { A: '4', B: '5', C: '6', D: '7' },
                            correct: 'B'
                        }
                    ]
                }
            },
            {
                id: 'historia',
                title: 'Historia Universal',
                questions: 5,
                data: {
                    title: 'Historia Universal',
                    questions: [
                        {
                            id: 0,
                            question: '¿En qué año comenzó la Segunda Guerra Mundial?',
                            options: { A: '1938', B: '1939', C: '1940', D: '1941' },
                            correct: 'B'
                        },
                        {
                            id: 1,
                            question: '¿Quién fue el primer emperador de Roma?',
                            options: { A: 'Julio César', B: 'Marco Antonio', C: 'Augusto', D: 'Nerón' },
                            correct: 'C'
                        },
                        {
                            id: 2,
                            question: '¿En qué siglo se construyó el Coliseo Romano?',
                            options: { A: 'Siglo I', B: 'Siglo II', C: 'Siglo III', D: 'Siglo IV' },
                            correct: 'A'
                        },
                        {
                            id: 3,
                            question: '¿Cuándo cayó el Muro de Berlín?',
                            options: { A: '1987', B: '1988', C: '1989', D: '1990' },
                            correct: 'C'
                        },
                        {
                            id: 4,
                            question: '¿Quién descubrió América?',
                            options: { A: 'Marco Polo', B: 'Cristóbal Colón', C: 'Vasco da Gama', D: 'Fernando de Magallanes' },
                            correct: 'B'
                        }
                    ]
                }
            },
            {
                id: 'ciencias',
                title: 'Ciencias Naturales',
                questions: 5,
                data: {
                    title: 'Ciencias Naturales',
                    questions: [
                        {
                            id: 0,
                            question: '¿Cuál es el elemento químico más abundante en el universo?',
                            options: { A: 'Oxígeno', B: 'Hidrógeno', C: 'Helio', D: 'Carbono' },
                            correct: 'B'
                        },
                        {
                            id: 1,
                            question: '¿Cuántos huesos tiene el cuerpo humano adulto?',
                            options: { A: '206', B: '208', C: '210', D: '212' },
                            correct: 'A'
                        },
                        {
                            id: 2,
                            question: '¿Cuál es la velocidad de la luz en el vacío?',
                            options: { A: '300,000 km/s', B: '299,792,458 m/s', C: '300,000,000 m/s', D: '299,000,000 m/s' },
                            correct: 'B'
                        },
                        {
                            id: 3,
                            question: '¿Qué gas es esencial para la fotosíntesis?',
                            options: { A: 'Oxígeno', B: 'Nitrógeno', C: 'Dióxido de carbono', D: 'Hidrógeno' },
                            correct: 'C'
                        },
                        {
                            id: 4,
                            question: '¿Cuál es el planeta más grande del sistema solar?',
                            options: { A: 'Saturno', B: 'Neptuno', C: 'Urano', D: 'Júpiter' },
                            correct: 'D'
                        }
                    ]
                }
            }
        ];
        
        console.log('📚 Tests configurados:', this.availableTests.map(t => t.title));
    }

    /**
     * Puebla el selector de tests con los disponibles
     */
    populateTestSelector() {
        if (!this.testSelect) {
            console.error('❌ testSelect no existe');
            return;
        }
        
        // Limpiar selector
        this.testSelect.innerHTML = '';
        
        // Agregar cada test disponible
        this.availableTests.forEach((test, index) => {
            const option = document.createElement('option');
            option.value = test.id;
            option.textContent = `${test.title} (${test.questions} preguntas)`;
            this.testSelect.appendChild(option);
        });
        
        console.log('📋 Selector poblado con', this.availableTests.length, 'opciones');
    }

    /**
     * Configura todos los event listeners
     */
    setupEventListeners() {
        console.log('🔧 Configurando event listeners...');
        
        // Selector de tests - CON DEBUGGING EXTENSIVO
        if (this.testSelect) {
            this.testSelect.addEventListener('change', (e) => {
                const selectedTestId = e.target.value;
                console.log('🎯 EVENT FIRED: testSelect change');
                console.log('🔄 Cambio solicitado de', this.currentTestId, 'a', selectedTestId);
                
                if (selectedTestId && selectedTestId !== this.currentTestId) {
                    console.log('✅ Cambio válido detectado, procesando...');
                    this.handleTestChangeWrapper(selectedTestId);
                } else {
                    console.log('❌ Cambio inválido o al mismo test');
                }
            });
            console.log('✅ Event listener para testSelect configurado');
        } else {
            console.error('❌ No se pudo configurar event listener para testSelect');
        }
        
        // Event listeners para el modal de confirmación
        if (this.confirmChangeBtn) {
            this.confirmChangeBtn.addEventListener('click', () => {
                console.log('🎯 EVENT FIRED: confirmChangeBtn click');
                this.confirmTestChange();
            });
            console.log('✅ Event listener para confirmChangeBtn configurado');
        }
        
        if (this.cancelChangeBtn) {
            this.cancelChangeBtn.addEventListener('click', () => {
                console.log('🎯 EVENT FIRED: cancelChangeBtn click');
                this.cancelTestChange();
            });
            console.log('✅ Event listener para cancelChangeBtn configurado');
        }
        
        if (this.changeCloseModalBtn) {
            this.changeCloseModalBtn.addEventListener('click', () => {
                console.log('🎯 EVENT FIRED: changeCloseModalBtn click');
                this.cancelTestChange();
            });
            console.log('✅ Event listener para changeCloseModalBtn configurado');
        }
        
        if (this.changeModalOverlay) {
            this.changeModalOverlay.addEventListener('click', (e) => {
                if (e.target === this.changeModalOverlay) {
                    console.log('🎯 EVENT FIRED: changeModalOverlay click');
                    this.cancelTestChange();
                }
            });
            console.log('✅ Event listener para changeModalOverlay configurado');
        }
        
        // Botones principales
        if (this.checkBtn) {
            this.checkBtn.addEventListener('click', () => this.checkAnswers());
        }
        if (this.resetBtn) {
            this.resetBtn.addEventListener('click', () => this.resetQuiz());
        }
        
        // Modal de resultados
        if (this.closeModalBtn) {
            this.closeModalBtn.addEventListener('click', () => this.closeModal());
        }
        if (this.continueBtn) {
            this.continueBtn.addEventListener('click', () => this.showAnswersFeedback());
        }
        if (this.modalOverlay) {
            this.modalOverlay.addEventListener('click', () => this.closeModal());
        }
        
        // Event listener para respuestas usando delegación de eventos
        document.addEventListener('change', (e) => {
            if (e.target && e.target.type === 'radio' && e.target.name && e.target.name.startsWith('question_')) {
                console.log('🎯 EVENT FIRED: radio button change');
                this.handleAnswerChange(e);
            }
        });
        
        console.log('✅ Todos los event listeners configurados');
    }

    /**
     * Wrapper para manejar cambio de test con debugging
     */
    handleTestChangeWrapper(selectedTestId) {
        console.log('🔍 === INICIANDO PROCESO DE CAMBIO DE TEST ===');
        console.log('📊 Estado actual:', {
            currentTestId: this.currentTestId,
            selectedTestId: selectedTestId,
            userAnswers: this.userAnswers,
            answersCount: Object.keys(this.userAnswers).length
        });
        
        // Verificar si hay respuestas
        const hasAnswers = this.hasAnswers();
        console.log('❓ ¿Tiene respuestas contestadas?', hasAnswers);
        
        if (hasAnswers) {
            console.log('⚠️ HAY RESPUESTAS - Mostrando modal de confirmación');
            this.pendingTestChange = selectedTestId;
            this.showChangeConfirmModal();
        } else {
            console.log('✨ NO HAY RESPUESTAS - Cambiando directamente');
            this.executeTestChange(selectedTestId);
        }
    }

    /**
     * Verifica si hay respuestas seleccionadas
     */
    hasAnswers() {
        const answersCount = Object.keys(this.userAnswers).length;
        const hasAnswers = answersCount > 0;
        console.log('🔍 Verificando respuestas:', {
            userAnswers: this.userAnswers,
            count: answersCount,
            hasAnswers: hasAnswers
        });
        return hasAnswers;
    }

    /**
     * Muestra el modal de confirmación - CON DEBUGGING
     */
    showChangeConfirmModal() {
        console.log('📱 === MOSTRANDO MODAL DE CONFIRMACIÓN ===');
        
        if (!this.changeConfirmModal) {
            console.error('❌ changeConfirmModal no existe!');
            return;
        }
        
        console.log('📱 Modal elemento:', this.changeConfirmModal);
        console.log('📱 Modal clases antes:', this.changeConfirmModal.className);
        console.log('📱 Modal display antes:', this.changeConfirmModal.style.display);
        
        // Forzar visibilidad del modal
        this.changeConfirmModal.style.display = 'flex';
        this.changeConfirmModal.classList.remove('hidden');
        
        console.log('📱 Modal clases después:', this.changeConfirmModal.className);
        console.log('📱 Modal display después:', this.changeConfirmModal.style.display);
        
        // Forzar repaint
        setTimeout(() => {
            this.changeConfirmModal.offsetHeight;
            console.log('📱 Modal offsetHeight:', this.changeConfirmModal.offsetHeight);
            console.log('📱 Modal visible?', this.changeConfirmModal.offsetWidth > 0 && this.changeConfirmModal.offsetHeight > 0);
        }, 10);
        
        console.log('📱 Modal de confirmación mostrado');
    }

    /**
     * Oculta el modal de confirmación
     */
    hideChangeConfirmModal() {
        console.log('📱 Ocultando modal de confirmación');
        if (this.changeConfirmModal) {
            this.changeConfirmModal.classList.add('hidden');
            setTimeout(() => {
                this.changeConfirmModal.style.display = 'none';
            }, 300);
        }
    }

    /**
     * Confirma el cambio de test
     */
    confirmTestChange() {
        console.log('✅ === CONFIRMANDO CAMBIO DE TEST ===');
        console.log('✅ Test pendiente:', this.pendingTestChange);
        
        this.hideChangeConfirmModal();
        
        if (this.pendingTestChange) {
            this.executeTestChange(this.pendingTestChange);
            this.pendingTestChange = null;
        } else {
            console.error('❌ No hay test pendiente para cambiar');
        }
    }

    /**
     * Cancela el cambio de test
     */
    cancelTestChange() {
        console.log('❌ === CANCELANDO CAMBIO DE TEST ===');
        
        this.hideChangeConfirmModal();
        
        // Restaurar selector al test actual
        if (this.currentTestId && this.testSelect) {
            this.testSelect.value = this.currentTestId;
            console.log('🔄 Selector restaurado a:', this.currentTestId);
        }
        
        this.pendingTestChange = null;
    }

    /**
     * EJECUTA el cambio de test
     */
    executeTestChange(newTestId) {
        try {
            console.log('🚀 === EJECUTANDO CAMBIO DE TEST ===');
            console.log('🚀 Cambiando a:', newTestId);
            
            // Verificar que el testId existe
            const testData = this.availableTests.find(t => t.id === newTestId);
            if (!testData) {
                console.error('❌ Test ID no encontrado:', newTestId);
                return;
            }

            console.log('✅ Test encontrado:', testData.title);

            // 1. Resetear estado actual
            console.log('🧹 Reseteando estado...');
            this.resetQuizState();
            
            // 2. Actualizar currentTestId
            this.currentTestId = newTestId;
            console.log('📝 currentTestId actualizado a:', this.currentTestId);
            
            // 3. Cargar datos del nuevo test
            this.quizData = testData.data;
            console.log('📊 Quiz data cargado:', this.quizData.title);
            
            // 4. Actualizar interfaz
            console.log('🎨 Actualizando interfaz...');
            this.quizTitle.textContent = this.quizData.title;
            this.buildQuizInterface();
            
            // 5. Sincronizar selector
            if (this.testSelect) {
                this.testSelect.value = newTestId;
                console.log('🔄 Selector sincronizado a:', this.testSelect.value);
            }
            
            // 6. Resetear botones
            this.checkBtn.disabled = true;
            
            console.log('🎉 === CAMBIO DE TEST COMPLETADO ===');
            
        } catch (error) {
            console.error('💥 Error al cambiar test:', error);
            this.showError('Error al cambiar de test');
        }
    }

    /**
     * Construye la interfaz del quiz dinámicamente
     */
    buildQuizInterface() {
        if (!this.quizData) {
            console.error('❌ No hay datos del quiz para construir la interfaz');
            return;
        }
        
        console.log('🔨 Construyendo interfaz para:', this.quizData.title);
        
        // Establecer título
        if (this.quizTitle) {
            this.quizTitle.textContent = this.quizData.title;
        }
        
        // Construir preguntas
        if (this.questionsContainer) {
            this.questionsContainer.innerHTML = '';
            
            this.quizData.questions.forEach((question, index) => {
                const questionCard = this.createQuestionCard(question, index);
                this.questionsContainer.appendChild(questionCard);
            });
        }
        
        // Actualizar estado del botón
        this.updateCheckButtonState();
        
        console.log('✅ Interfaz construida con', this.quizData.questions.length, 'preguntas');
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
        
        console.log('✏️ Respuesta seleccionada - Pregunta:', questionId, 'Respuesta:', answer);
        
        // IMPORTANTE: Actualizar userAnswers
        this.userAnswers[questionId] = answer;
        
        console.log('📊 userAnswers actualizado:', this.userAnswers);
        console.log('📊 Total respuestas:', Object.keys(this.userAnswers).length);
        
        // Agregar efecto visual
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
        if (!this.quizData || !this.checkBtn) return;
        
        const totalQuestions = this.quizData.questions.length;
        const answeredQuestions = Object.keys(this.userAnswers).length;
        
        this.checkBtn.disabled = answeredQuestions < totalQuestions;
        
        console.log(`🔲 Botón estado: ${this.checkBtn.disabled ? 'deshabilitado' : 'habilitado'} (${answeredQuestions}/${totalQuestions})`);
    }

    /**
     * Reinicia el estado del quiz
     */
    resetQuizState() {
        console.log('🧹 Reseteando estado del quiz...');
        
        // Limpiar respuestas
        this.userAnswers = {};
        this.currentResults = null;
        this.isAnswersShown = false;
        
        // Resetear botón de corrección
        if (this.checkBtn) {
            this.checkBtn.innerHTML = `
                <span>Corregir Test</span>
                <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
            `;
        }
        
        console.log('✅ Estado reseteado');
    }

    // Resto de métodos sin cambios importantes...
    
    checkAnswers() {
        if (this.isAnswersShown) {
            this.resetQuiz();
            return;
        }
        
        let correctCount = 0;
        const totalQuestions = this.quizData.questions.length;
        
        this.quizData.questions.forEach(question => {
            const userAnswer = this.userAnswers[question.id];
            const isCorrect = userAnswer === question.correct;
            if (isCorrect) {
                correctCount++;
            }
        });
        
        const percentage = Math.round((correctCount / totalQuestions) * 100);
        
        this.currentResults = {
            correct: correctCount,
            total: totalQuestions,
            percentage: percentage
        };
        
        setTimeout(() => {
            this.showResultModal();
        }, 100);
    }

    showResultModal() {
        if (!this.currentResults) return;
        
        const { correct, total, percentage } = this.currentResults;
        
        document.getElementById('score-percentage').textContent = `${percentage}%`;
        document.getElementById('score-text').textContent = `Has acertado ${correct} de ${total} preguntas`;
        
        this.resultModal.style.display = 'flex';
        this.resultModal.classList.remove('hidden');
        
        setTimeout(() => {
            const progressBar = document.getElementById('score-progress');
            if (progressBar) {
                progressBar.style.width = `${percentage}%`;
            }
        }, 500);
    }

    closeModal() {
        this.resultModal.classList.add('hidden');
        this.resultModal.style.display = '';
    }

    showAnswersFeedback() {
        this.closeModal();
        
        this.checkBtn.innerHTML = `
            <span>Nuevo Test</span>
            <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
        `;
        
        this.isAnswersShown = true;
        
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
                
                label.classList.remove('correct', 'incorrect', 'correct-answer');
                
                if (optionLetter === correctAnswer) {
                    label.classList.add('correct-answer');
                    
                    if (userAnswer === correctAnswer) {
                        label.classList.add('correct');
                    }
                } else if (input.checked && userAnswer !== correctAnswer) {
                    label.classList.add('incorrect');
                }
                
                label.offsetHeight;
            });
        });
        
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    resetQuiz() {
        this.resetQuizState();
        this.buildQuizInterface();
        this.closeModal();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    showLoading() {
        if (this.loadingOverlay) {
            this.loadingOverlay.classList.remove('hidden');
        }
    }

    hideLoading() {
        setTimeout(() => {
            if (this.loadingOverlay) {
                this.loadingOverlay.classList.add('hidden');
            }
        }, 1000);
    }

    showError(message) {
        this.hideLoading();
        
        if (this.questionsContainer) {
            this.questionsContainer.innerHTML = `
                <div class="error-message" style="
                    background: rgba(239, 68, 68, 0.1);
                    border: 1px solid rgba(239, 68, 68, 0.3);
                    color: var(--color-text);
                    padding: 2rem;
                    border-radius: 16px;
                    text-align: center;
                    margin: 2rem 0;
                ">
                    <h3 style="margin: 0 0 1rem 0;">⚠️ Error</h3>
                    <p style="margin: 0;">${message}</p>
                </div>
            `;
        }
    }
}

// Inicialización con debugging
document.addEventListener('DOMContentLoaded', () => {
    console.log('🌟 === INICIALIZANDO APLICACIÓN ===');
    
    // Verificar elementos críticos del DOM
    const criticalElements = [
        'test-select',
        'change-confirm-modal',
        'confirm-change-btn',
        'cancel-change-btn'
    ];
    
    criticalElements.forEach(id => {
        const element = document.getElementById(id);
        console.log(`🔍 Verificando ${id}:`, element ? '✅ Encontrado' : '❌ NO encontrado');
    });
    
    // Inicializar aplicación
    window.quiz = new QuizApp();
    
    console.log('🎉 Aplicación inicializada y disponible en window.quiz');
});