// Quiz Online - JavaScript Principal
// Aplicación moderna de quiz con diseño 2025

class QuizApp {
    constructor() {
        this.quizData = null;
        this.userAnswers = {};
        this.currentResults = null;
        this.isAnswersShown = false;
        
        // Elementos del DOM
        this.loadingOverlay = document.getElementById('loading');
        this.quizTitle = document.getElementById('quiz-title');
        this.questionsContainer = document.getElementById('questions-container');
        this.checkBtn = document.getElementById('check-btn');
        this.resetBtn = document.getElementById('reset-btn');
        this.resultModal = document.getElementById('result-modal');
        this.modalOverlay = document.getElementById('modal-overlay');
        this.closeModalBtn = document.getElementById('close-modal');
        this.continueBtn = document.getElementById('continue-btn');
        
        this.init();
    }

    /**
     * Inicializa la aplicación
     */
    async init() {
        try {
            // Mostrar overlay de carga
            this.showLoading();
            
            // Cargar datos del quiz desde CSV
            await this.loadQuizFromCSV();
            
            // Construir interfaz
            this.buildQuizInterface();
            
            // Configurar event listeners
            this.setupEventListeners();
            
            // Ocultar overlay de carga
            this.hideLoading();
            
        } catch (error) {
            console.error('Error al inicializar el quiz:', error);
            this.showError('Error al cargar el quiz. Por favor, recarga la página.');
        }
    }

    /**
     * Carga y parsea el archivo CSV del quiz
     */
    async loadQuizFromCSV() {
        try {
            // URL del archivo CSV (debe estar en la misma carpeta que el HTML)
            const csvUrl = 'https://ppl-ai-code-interpreter-files.s3.amazonaws.com/web/direct-files/5272ad2a99f9245274f2935e230ef12d/209d2e2c-78a2-4458-a882-ec4c1773fc33/ff6533e6.csv';
            
            const response = await fetch(csvUrl);
            
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }
            
            const csvText = await response.text();
            this.parseCSV(csvText);
            
        } catch (error) {
            console.error('Error al cargar CSV:', error);
            throw new Error('No se pudo cargar el archivo del quiz');
        }
    }

    /**
     * Parsea el contenido CSV y extrae las preguntas
     * Formato: Título del Examen,Nombre
     * Pregunta,Texto,OpciónA,OpciónB,OpciónC,OpciónD,Correcta
     */
    parseCSV(csvText) {
        const lines = csvText.trim().split('\n');
        
        if (lines.length < 2) {
            throw new Error('El archivo CSV no tiene el formato correcto');
        }
        
        // Primera línea: título del examen
        const titleLine = lines[0].split(',');
        const title = titleLine[1] || 'Quiz Online';
        
        // Resto de líneas: preguntas
        const questions = [];
        
        for (let i = 1; i < lines.length; i++) {
            const parts = lines[i].split(',');
            
            if (parts.length >= 7) {
                questions.push({
                    id: i - 1,
                    question: parts[1],
                    options: {
                        A: parts[2],
                        B: parts[3],
                        C: parts[4],
                        D: parts[5]
                    },
                    correct: parts[6].trim()
                });
            }
        }
        
        this.quizData = {
            title: title,
            questions: questions
        };
        
        console.log('Quiz cargado:', this.quizData);
    }

    /**
     * Construye la interfaz del quiz dinámicamente
     */
    buildQuizInterface() {
        if (!this.quizData) return;
        
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
     * Configura todos los event listeners
     */
    setupEventListeners() {
        // Botones principales
        this.checkBtn.addEventListener('click', () => this.checkAnswers());
        this.resetBtn.addEventListener('click', () => this.resetQuiz());
        
        // Modal
        this.closeModalBtn.addEventListener('click', () => this.closeModal());
        this.continueBtn.addEventListener('click', () => this.showAnswersFeedback());
        this.modalOverlay.addEventListener('click', () => this.closeModal());
        
        // Respuestas de preguntas
        this.questionsContainer.addEventListener('change', (e) => {
            if (e.target.type === 'radio') {
                this.handleAnswerChange(e);
            }
        });
        
        // Cerrar modal con Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !this.resultModal.classList.contains('hidden')) {
                this.closeModal();
            }
        });
    }

    /**
     * Maneja el cambio de respuesta en una pregunta
     */
    handleAnswerChange(event) {
        const questionId = event.target.name.replace('question_', '');
        const answer = event.target.value;
        
        this.userAnswers[questionId] = answer;
        
        // Agregar efecto visual al seleccionar
        const label = event.target.nextElementSibling;
        if (label) {
            // Remover animación previa si existe
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
        const totalQuestions = this.quizData.questions.length;
        const answeredQuestions = Object.keys(this.userAnswers).length;
        
        this.checkBtn.disabled = answeredQuestions < totalQuestions;
        
        if (answeredQuestions === totalQuestions) {
            this.checkBtn.classList.add('ready');
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
            if (userAnswer === question.correct) {
                correctCount++;
            }
        });
        
        const percentage = Math.round((correctCount / totalQuestions) * 100);
        
        this.currentResults = {
            correct: correctCount,
            total: totalQuestions,
            percentage: percentage
        };
        
        // FORZAR la muestra del modal
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
        
        console.log('Mostrando modal con resultados:', this.currentResults);
        
        // Actualizar contenido del modal
        document.getElementById('score-percentage').textContent = `${percentage}%`;
        document.getElementById('score-text').textContent = `Has acertado ${correct} de ${total} preguntas`;
        
        // FORZAR la visibilidad del modal
        this.resultModal.style.display = 'flex';
        this.resultModal.classList.remove('hidden');
        
        // Forzar reflow
        this.resultModal.offsetHeight;
        
        // Animar barra de progreso
        setTimeout(() => {
            const progressBar = document.getElementById('score-progress');
            if (progressBar) {
                progressBar.style.width = `${percentage}%`;
            }
        }, 500);
        
        // Agregar clase de animación al círculo de puntaje
        const scoreCircle = document.querySelector('.score-circle');
        if (scoreCircle) {
            scoreCircle.style.animation = 'pulse 2s infinite';
        }
    }

    /**
     * Cierra el modal de resultados
     */
    closeModal() {
        this.resultModal.classList.add('hidden');
        this.resultModal.style.display = '';
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
        
        // Marcar respuestas con colores - MEJORADO
        this.quizData.questions.forEach(question => {
            const userAnswer = this.userAnswers[question.id];
            const correctAnswer = question.correct;
            
            console.log(`Pregunta ${question.id}: Usuario=${userAnswer}, Correcto=${correctAnswer}`);
            
            // Obtener todas las opciones de esta pregunta
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
                    console.log(`Marcando ${optionLetter} como correcta para pregunta ${question.id}`);
                    
                    if (userAnswer === correctAnswer) {
                        // El usuario acertó esta pregunta
                        label.classList.add('correct');
                    }
                } else if (input.checked && userAnswer !== correctAnswer) {
                    // Esta es la respuesta incorrecta que eligió el usuario
                    label.classList.add('incorrect');
                    console.log(`Marcando ${optionLetter} como incorrecta para pregunta ${question.id}`);
                }
                
                // Forzar actualización visual
                label.offsetHeight;
            });
        });
        
        // Scroll suave al inicio
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    /**
     * Reinicia el quiz a su estado inicial
     */
    resetQuiz() {
        // Limpiar respuestas
        this.userAnswers = {};
        this.currentResults = null;
        this.isAnswersShown = false;
        
        // Limpiar selecciones en formulario
        const radioButtons = document.querySelectorAll('input[type="radio"]');
        radioButtons.forEach(radio => {
            radio.checked = false;
        });
        
        // Limpiar clases de retroalimentación visual
        const labels = document.querySelectorAll('.option-label');
        labels.forEach(label => {
            label.classList.remove('correct', 'incorrect', 'correct-answer');
            label.style.animation = '';
        });
        
        // Resetear botón de corrección
        this.checkBtn.innerHTML = `
            <span>Corregir Test</span>
            <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
        `;
        
        // Actualizar estado del botón
        this.updateCheckButtonState();
        
        // Cerrar modal si está abierto
        this.closeModal();
        
        // Scroll al inicio
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        // Animación de reset
        const cards = document.querySelectorAll('.question-card');
        cards.forEach((card, index) => {
            card.style.animation = 'none';
            setTimeout(() => {
                card.style.animation = `fadeInUp 0.4s ease ${index * 0.1}s both`;
            }, 50);
        });
    }

    /**
     * Muestra el overlay de carga
     */
    showLoading() {
        this.loadingOverlay.classList.remove('hidden');
    }

    /**
     * Oculta el overlay de carga
     */
    hideLoading() {
        setTimeout(() => {
            this.loadingOverlay.classList.add('hidden');
        }, 800); // Pequeño delay para mejor UX
    }

    /**
     * Muestra un mensaje de error
     */
    showError(message) {
        this.hideLoading();
        
        this.questionsContainer.innerHTML = `
            <div class="error-message" style="
                background: rgba(239, 68, 68, 0.1);
                border: 1px solid rgba(239, 68, 68, 0.3);
                color: white;
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

// Efectos adicionales y mejoras de UX
document.addEventListener('DOMContentLoaded', () => {
    // Inicializar aplicación
    const quiz = new QuizApp();
    
    // Agregar efectos de fondo sutiles (opcional)
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