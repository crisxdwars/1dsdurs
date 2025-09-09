class BlockBlast {
    constructor() {
        this.grid = Array(10).fill().map(() => Array(10).fill(0));
        this.score = 0;
        this.pieces = [];
        this.draggedPiece = null;
        this.dragOffset = { x: 0, y: 0 };
        this.isDragging = false;
        this.ghostPiece = null;
        this.questionTimer = null;
        this.timeLeft = 30;
        
        this.pieceShapes = [
            [[1]], // Single block
            [[1, 1]], // 2x1
            [[1], [1]], // 1x2
            [[1, 1], [1, 1]], // 2x2 square
            [[1, 1, 1]], // 3x1
            [[1], [1], [1]], // 1x3
            [[1, 1, 1], [0, 1, 0]], // T-shape
            [[1, 1, 0], [0, 1, 1]], // Z-shape
            [[0, 1, 1], [1, 1, 0]], // S-shape
            [[1, 0], [1, 0], [1, 1]], // L-shape
            [[0, 1], [0, 1], [1, 1]], // Reverse L
        ];

        this.questions = [
            {
                question: "What is the capital of France?",
                options: ["London", "Berlin", "Paris", "Madrid"],
                correct: 2
            },
            {
                question: "Which planet is known as the Red Planet?",
                options: ["Venus", "Mars", "Jupiter", "Saturn"],
                correct: 1
            },
            {
                question: "What is 2 + 2?",
                options: ["3", "4", "5", "6"],
                correct: 1
            },
            {
                question: "Who painted the Mona Lisa?",
                options: ["Van Gogh", "Picasso", "Leonardo da Vinci", "Michelangelo"],
                correct: 2
            },
            {
                question: "What is the largest ocean on Earth?",
                options: ["Atlantic", "Pacific", "Indian", "Arctic"],
                correct: 1
            },
            {
                question: "How many continents are there?",
                options: ["5", "6", "7", "8"],
                correct: 2
            },
            {
                question: "What gas do plants absorb from the atmosphere?",
                options: ["Oxygen", "Carbon Dioxide", "Nitrogen", "Hydrogen"],
                correct: 1
            },
            {
                question: "Which programming language is known for web development?",
                options: ["Python", "JavaScript", "C++", "Java"],
                correct: 1
            },
            {
                question: "What is the smallest prime number?",
                options: ["0", "1", "2", "3"],
                correct: 2
            },
            {
                question: "Which animal is known as the King of the Jungle?",
                options: ["Tiger", "Lion", "Elephant", "Gorilla"],
                correct: 1
            },
            {
                question: "What is Java programmings Motto?",
                options: ["Tiger", "Lion", "wora", "Write once run anywhere"],
                correct: 3
            }
        ];
        
        this.init();
    }

    init() {
        this.createGrid();
        this.generatePieces();
        this.setupEventListeners();
        this.updateScore();
    }

    createGrid() {
        const gridElement = document.getElementById('gameGrid');
        gridElement.innerHTML = '';
        
        for (let row = 0; row < 10; row++) {
            for (let col = 0; col < 10; col++) {
                const cell = document.createElement('div');
                cell.className = 'grid-cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                gridElement.appendChild(cell);
            }
        }
    }

    generatePieces() {
        const container = document.getElementById('pieceContainer');
        container.innerHTML = '';
        this.pieces = [];

        for (let i = 0; i < 3; i++) {
            const shape = this.pieceShapes[Math.floor(Math.random() * this.pieceShapes.length)];
            const piece = {
                shape: shape,
                id: Date.now() + i,
                used: false
            };
            this.pieces.push(piece);
            this.createPieceElement(piece, container);
        }
    }

    createPieceElement(piece, container) {
        const pieceDiv = document.createElement('div');
        pieceDiv.className = 'piece';
        pieceDiv.dataset.pieceId = piece.id;
        pieceDiv.draggable = true;

        const rows = piece.shape.length;
        const cols = piece.shape[0].length;
        
        const pieceGrid = document.createElement('div');
        pieceGrid.className = 'piece-grid';
        pieceGrid.style.gridTemplateColumns = `repeat(${cols}, 35px)`;
        pieceGrid.style.gridTemplateRows = `repeat(${rows}, 35px)`;

        piece.shape.forEach(row => {
            row.forEach(cell => {
                const cellDiv = document.createElement('div');
                cellDiv.className = `piece-cell ${cell ? 'filled' : 'empty'}`;
                pieceGrid.appendChild(cellDiv);
            });
        });

        pieceDiv.appendChild(pieceGrid);
        container.appendChild(pieceDiv);
        
        // Add drag event listeners (desktop)
        pieceDiv.addEventListener('dragstart', (e) => this.handleDragStart(e, piece));
        pieceDiv.addEventListener('dragend', (e) => this.handleDragEnd(e));
        
        // Add touch event listeners (mobile)
        pieceDiv.addEventListener('touchstart', (e) => this.handleTouchStart(e, piece), { passive: false });
        pieceDiv.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
        pieceDiv.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: false });
    }

    setupEventListeners() {
        const gridElement = document.getElementById('gameGrid');
        
        // Add drop event listeners to grid (desktop)
        gridElement.addEventListener('dragover', (e) => this.handleDragOver(e));
        gridElement.addEventListener('drop', (e) => this.handleDrop(e));
        
        // Add mouse move listener for accurate cursor following
        document.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        
        // Add touch event listeners to grid (mobile)
        gridElement.addEventListener('touchmove', (e) => this.handleGridTouchMove(e), { passive: false });
        gridElement.addEventListener('touchend', (e) => this.handleGridTouchEnd(e), { passive: false });
    }

    handleDragStart(e, piece) {
        if (piece.used) {
            e.preventDefault();
            return;
        }
        
        this.draggedPiece = piece;
        this.isDragging = true;
        
        // Store the piece shape for accurate placement
        this.draggedPieceShape = piece.shape;
        
        // No offset needed - we'll position everything relative to cursor center
        this.dragOffset = { x: 0, y: 0 };
        
        // Hide the piece completely during drag
        e.target.style.opacity = '0.2';
        e.target.style.transform = 'scale(0.8)';
        
        // Create accurate ghost piece for cursor following
        this.createAccurateGhostPiece(piece.shape);
        
        // Remove default drag image
        const emptyImg = new Image();
        emptyImg.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=';
        e.dataTransfer.setDragImage(emptyImg, 0, 0);
        
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', '');
    }

    handleDragEnd(e) {
        if (this.draggedPiece) {
            e.target.style.opacity = '1';
            e.target.style.transform = 'scale(1)';
            this.clearPreview();
            this.removeGhostPiece();
            this.draggedPiece = null;
            this.isDragging = false;
        }
    }

    handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        
        if (this.isDragging && this.draggedPiece) {
            this.updatePreview(e);
        }
    }

    handleDrop(e) {
        e.preventDefault();
        
        if (!this.draggedPiece || this.draggedPiece.used) return;
        
        const gridRect = document.getElementById('gameGrid').getBoundingClientRect();
        const cellSize = this.getCellSize();
        
        // Calculate grid position based on mouse cursor position
        const gridX = e.clientX - gridRect.left;
        const gridY = e.clientY - gridRect.top;
        
        // Get grid spacing for accurate calculation
        const spacing = this.getGridSpacing();
        
        // Convert mouse position to grid coordinates
        // Each cell takes (cellSize + spacing) except the last one
        const col = Math.floor(gridX / (cellSize + spacing));
        const row = Math.floor(gridY / (cellSize + spacing));
        
        if (this.canPlacePiece(this.draggedPiece.shape, row, col)) {
            this.placePiece(this.draggedPiece.shape, row, col);
            
            // Hide the piece
            const pieceElement = document.querySelector(`[data-piece-id="${this.draggedPiece.id}"]`);
            pieceElement.style.display = 'none';
            this.draggedPiece.used = true;
            
            this.clearLines();
            this.updateScore();
            
            if (this.pieces.every(p => p.used)) {
                this.generatePieces();
            }
            
            if (this.isGameOver()) {
                this.showGameOver();
            }
        }
        
        this.clearPreview();
    }

    handleMouseMove(e) {
        if (this.isDragging && this.ghostPiece) {
            // Get grid information
            const gridRect = document.getElementById('gameGrid').getBoundingClientRect();
            const cellSize = this.getCellSize();
            const spacing = this.getGridSpacing();
            
            // Calculate relative position to grid
            const gridX = e.clientX - gridRect.left;
            const gridY = e.clientY - gridRect.top;
            
            // Calculate which grid cell we're over
            const col = Math.floor(gridX / (cellSize + spacing));
            const row = Math.floor(gridY / (cellSize + spacing));
            
            // Calculate exact center position of that grid cell
            const centerX = col * (cellSize + spacing) + cellSize / 2;
            const centerY = row * (cellSize + spacing) + cellSize / 2;
            
            // Position ghost piece at the calculated center
            const screenX = gridRect.left + centerX;
            const screenY = gridRect.top + centerY;
            
            this.ghostPiece.style.left = screenX + 'px';
            this.ghostPiece.style.top = screenY + 'px';
        }
    }
    
    // Touch event handlers for mobile devices
    handleTouchStart(e, piece) {
        e.preventDefault();
        
        if (piece.used) return;
        
        this.draggedPiece = piece;
        this.isDragging = true;
        
        const touch = e.touches[0];
        const rect = e.target.getBoundingClientRect();
        
        // Store the piece shape for accurate placement
        this.draggedPieceShape = piece.shape;
        
        // No offset needed - we'll position everything relative to cursor center
        this.dragOffset = { x: 0, y: 0 };
        
        // Make the piece semi-transparent during drag
        e.target.style.opacity = '0.2';
        e.target.style.transform = 'scale(0.8)';
        
        // Create accurate ghost piece for cursor following
        this.createAccurateGhostPiece(piece.shape);
        
        // Position ghost piece at initial touch with grid snapping
        const gridRect = document.getElementById('gameGrid').getBoundingClientRect();
        const cellSize = this.getCellSize();
        const spacing = this.getGridSpacing();
        
        const gridX = touch.clientX - gridRect.left;
        const gridY = touch.clientY - gridRect.top;
        
        const col = Math.floor(gridX / (cellSize + spacing));
        const row = Math.floor(gridY / (cellSize + spacing));
        
        const centerX = col * (cellSize + spacing) + cellSize / 2;
        const centerY = row * (cellSize + spacing) + cellSize / 2;
        
        const screenX = gridRect.left + centerX;
        const screenY = gridRect.top + centerY;
        
        this.ghostPiece.style.left = screenX + 'px';
        this.ghostPiece.style.top = screenY + 'px';
    }
    
    handleTouchMove(e) {
        e.preventDefault();
        
        if (!this.isDragging || !this.draggedPiece) return;
        
        const touch = e.touches[0];
        
        // Update ghost piece position to snap to grid
        if (this.ghostPiece) {
            const gridRect = document.getElementById('gameGrid').getBoundingClientRect();
            const cellSize = this.getCellSize();
            const spacing = this.getGridSpacing();
            
            const gridX = touch.clientX - gridRect.left;
            const gridY = touch.clientY - gridRect.top;
            
            const col = Math.floor(gridX / (cellSize + spacing));
            const row = Math.floor(gridY / (cellSize + spacing));
            
            const centerX = col * (cellSize + spacing) + cellSize / 2;
            const centerY = row * (cellSize + spacing) + cellSize / 2;
            
            const screenX = gridRect.left + centerX;
            const screenY = gridRect.top + centerY;
            
            this.ghostPiece.style.left = screenX + 'px';
            this.ghostPiece.style.top = screenY + 'px';
        }
        
        // Update preview on grid
        this.updateTouchPreview(touch);
    }
    
    handleTouchEnd(e) {
        e.preventDefault();
        
        if (!this.draggedPiece) return;
        
        const touch = e.changedTouches[0];
        
        // Check if touch ended over the grid
        const elementUnderTouch = document.elementFromPoint(touch.clientX, touch.clientY);
        if (elementUnderTouch && elementUnderTouch.classList.contains('grid-cell')) {
            this.handleTouchDrop(touch);
        }
        
        // Clean up
        const pieceElement = document.querySelector(`[data-piece-id="${this.draggedPiece.id}"]`);
        pieceElement.style.opacity = '1';
        pieceElement.style.transform = 'scale(1)';
        
        this.clearPreview();
        this.removeGhostPiece();
        this.draggedPiece = null;
        this.isDragging = false;
    }
    
    handleGridTouchMove(e) {
        e.preventDefault();
        // Handled in handleTouchMove
    }
    
    handleGridTouchEnd(e) {
        e.preventDefault();
        // Handled in handleTouchEnd
    }
    
    updateTouchPreview(touch) {
        this.clearPreview();
        
        const gridRect = document.getElementById('gameGrid').getBoundingClientRect();
        const cellSize = this.getCellSize();
        
        // Calculate grid position based on touch position
        const gridX = touch.clientX - gridRect.left;
        const gridY = touch.clientY - gridRect.top;
        
        // Check if touch is over the grid
        if (gridX < 0 || gridY < 0 || gridX > gridRect.width || gridY > gridRect.height) {
            // Touch is outside grid - show neutral color
            this.updateGhostPieceColor('neutral');
            return;
        }
        
        // Get grid spacing for accurate calculation
        const spacing = this.getGridSpacing();
        
        // Convert touch position to grid coordinates
        const col = Math.floor(gridX / (cellSize + spacing));
        const row = Math.floor(gridY / (cellSize + spacing));
        
        if (this.canPlacePiece(this.draggedPiece.shape, row, col)) {
            this.showPreview(this.draggedPiece.shape, row, col, 'valid');
            this.updateGhostPieceColor('valid');
        } else {
            this.showPreview(this.draggedPiece.shape, row, col, 'invalid');
            this.updateGhostPieceColor('invalid');
        }
    }
    
    handleTouchDrop(touch) {
        if (!this.draggedPiece || this.draggedPiece.used) return;
        
        const gridRect = document.getElementById('gameGrid').getBoundingClientRect();
        const cellSize = this.getCellSize();
        
        // Calculate grid position based on touch position
        const gridX = touch.clientX - gridRect.left;
        const gridY = touch.clientY - gridRect.top;
        
        // Get grid spacing for accurate calculation
        const spacing = this.getGridSpacing();
        
        // Convert touch position to grid coordinates
        const col = Math.floor(gridX / (cellSize + spacing));
        const row = Math.floor(gridY / (cellSize + spacing));
        
        if (this.canPlacePiece(this.draggedPiece.shape, row, col)) {
            this.placePiece(this.draggedPiece.shape, row, col);
            
            // Hide the piece
            const pieceElement = document.querySelector(`[data-piece-id="${this.draggedPiece.id}"]`);
            pieceElement.style.display = 'none';
            this.draggedPiece.used = true;
            
            this.clearLines();
            this.updateScore();
            
            if (this.pieces.every(p => p.used)) {
                this.generatePieces();
            }
            
            if (this.isGameOver()) {
                this.showGameOver();
            }
        }
        
        this.clearPreview();
    }
    
    getCellSize() {
        // Get the exact cell size without gap - gap is handled separately
        const gridCell = document.querySelector('.grid-cell');
        if (gridCell) {
            return gridCell.getBoundingClientRect().width;
        }
        return 35; // fallback
    }
    
    getGridSpacing() {
        // Get the gap between grid cells
        const mainGrid = document.getElementById('gameGrid');
        if (mainGrid) {
            return parseFloat(getComputedStyle(mainGrid).gap) || 2;
        }
        return 2; // fallback
    }

    createAccurateGhostPiece(shape) {
        // Remove existing ghost piece if any
        this.removeGhostPiece();
        
        // Get actual grid cell size and gap for perfect alignment
        const gridCell = document.querySelector('.grid-cell');
        const mainGrid = document.getElementById('gameGrid');
        const cellSize = gridCell ? gridCell.getBoundingClientRect().width : 35;
        const gapValue = mainGrid ? parseFloat(getComputedStyle(mainGrid).gap) || 2 : 2;
        
        // Store dimensions for accurate positioning
        this.ghostCellSize = cellSize;
        this.ghostGap = gapValue;
        
        this.ghostPiece = document.createElement('div');
        this.ghostPiece.className = 'ghost-piece';
        this.ghostPiece.style.position = 'fixed';
        this.ghostPiece.style.pointerEvents = 'none';
        this.ghostPiece.style.zIndex = '10000';
        this.ghostPiece.style.opacity = '0.9';
        
        const rows = shape.length;
        const cols = shape[0].length;
        
        // Calculate exact piece dimensions including gaps
        const pieceWidth = cols * cellSize + (cols - 1) * gapValue;
        const pieceHeight = rows * cellSize + (rows - 1) * gapValue;
        
        // Center the piece by translating by half its size
        this.ghostPiece.style.transform = `translate(-${pieceWidth/2}px, -${pieceHeight/2}px)`;
        
        const pieceGrid = document.createElement('div');
        pieceGrid.className = 'ghost-piece-grid';
        pieceGrid.style.display = 'grid';
        pieceGrid.style.gridTemplateColumns = `repeat(${cols}, ${cellSize}px)`;
        pieceGrid.style.gridTemplateRows = `repeat(${rows}, ${cellSize}px)`;
        pieceGrid.style.gap = `${gapValue}px`;
        
        shape.forEach(row => {
            row.forEach(cell => {
                const cellDiv = document.createElement('div');
                cellDiv.style.width = `${cellSize}px`;
                cellDiv.style.height = `${cellSize}px`;
                cellDiv.style.borderRadius = getComputedStyle(gridCell).borderRadius || '4px';
                
                if (cell) {
                    cellDiv.style.background = 'linear-gradient(45deg, #3498db, #2980b9)';
                    cellDiv.style.border = '2px solid #2471a3';
                    cellDiv.style.boxShadow = '0 2px 8px rgba(52, 152, 219, 0.4)';
                } else {
                    cellDiv.style.background = 'transparent';
                }
                
                pieceGrid.appendChild(cellDiv);
            });
        });
        
        this.ghostPiece.appendChild(pieceGrid);
        document.body.appendChild(this.ghostPiece);
    }
    
    removeGhostPiece() {
        if (this.ghostPiece && this.ghostPiece.parentNode) {
            this.ghostPiece.parentNode.removeChild(this.ghostPiece);
            this.ghostPiece = null;
        }
    }
    
    updateGhostPieceColor(state) {
        if (!this.ghostPiece) return;
        
        const cells = this.ghostPiece.querySelectorAll('div');
        cells.forEach(cell => {
            // Skip empty cells (transparent background)
            if (cell.style.background === 'transparent') return;
            
            if (state === 'valid') {
                cell.style.background = 'linear-gradient(45deg, #2ecc71, #27ae60)';
                cell.style.border = '2px solid #229954';
                cell.style.boxShadow = '0 2px 8px rgba(46, 204, 113, 0.4)';
            } else if (state === 'invalid') {
                cell.style.background = 'linear-gradient(45deg, #e74c3c, #c0392b)';
                cell.style.border = '2px solid #a93226';
                cell.style.boxShadow = '0 2px 8px rgba(231, 76, 60, 0.4)';
            } else {
                // Default blue color
                cell.style.background = 'linear-gradient(45deg, #3498db, #2980b9)';
                cell.style.border = '2px solid #2471a3';
                cell.style.boxShadow = '0 2px 8px rgba(52, 152, 219, 0.4)';
            }
        });
    }
    
    updatePreview(e) {
        this.clearPreview();
        
        const gridRect = document.getElementById('gameGrid').getBoundingClientRect();
        const cellSize = this.getCellSize();
        
        // Calculate grid position based on mouse cursor position
        const gridX = e.clientX - gridRect.left;
        const gridY = e.clientY - gridRect.top;
        
        // Check if cursor is over the grid
        if (gridX < 0 || gridY < 0 || gridX > gridRect.width || gridY > gridRect.height) {
            // Cursor is outside grid - show neutral color
            this.updateGhostPieceColor('neutral');
            return;
        }
        
        // Get grid spacing for accurate calculation
        const spacing = this.getGridSpacing();
        
        // Convert cursor position to grid coordinates
        const col = Math.floor(gridX / (cellSize + spacing));
        const row = Math.floor(gridY / (cellSize + spacing));
        
        if (this.canPlacePiece(this.draggedPiece.shape, row, col)) {
            this.showPreview(this.draggedPiece.shape, row, col, 'valid');
            this.updateGhostPieceColor('valid');
        } else {
            this.showPreview(this.draggedPiece.shape, row, col, 'invalid');
            this.updateGhostPieceColor('invalid');
        }
    }


    showPreview(shape, startRow, startCol, className) {
        shape.forEach((row, r) => {
            row.forEach((cell, c) => {
                if (cell) {
                    const gridRow = startRow + r;
                    const gridCol = startCol + c;
                    
                    if (gridRow >= 0 && gridRow < 10 && gridCol >= 0 && gridCol < 10) {
                        const gridCell = document.querySelector(`[data-row="${gridRow}"][data-col="${gridCol}"]`);
                        if (gridCell) {
                            gridCell.classList.add('preview', className);
                        }
                    }
                }
            });
        });
    }

    clearPreview() {
        document.querySelectorAll('.grid-cell.preview').forEach(cell => {
            cell.classList.remove('preview', 'valid', 'invalid');
        });
    }

    canPlacePiece(shape, startRow, startCol) {
        for (let r = 0; r < shape.length; r++) {
            for (let c = 0; c < shape[r].length; c++) {
                if (shape[r][c]) {
                    const gridRow = startRow + r;
                    const gridCol = startCol + c;
                    
                    // Check bounds
                    if (gridRow >= 10 || gridCol >= 10 || gridRow < 0 || gridCol < 0) {
                        return false;
                    }
                    
                    // Check if cell is already occupied
                    if (this.grid[gridRow][gridCol]) {
                        return false;
                    }
                }
            }
        }
        return true;
    }

    placePiece(shape, startRow, startCol) {
        shape.forEach((row, r) => {
            row.forEach((cell, c) => {
                if (cell) {
                    this.grid[startRow + r][startCol + c] = 1;
                    const gridCell = document.querySelector(`[data-row="${startRow + r}"][data-col="${startCol + c}"]`);
                    gridCell.classList.add('filled');
                }
            });
        });
        
        // Add score for placing piece
        this.score += shape.flat().filter(cell => cell).length * 10;
    }

    clearLines() {
        let linesCleared = 0;
        
        // Check rows
        for (let row = 0; row < 10; row++) {
            if (this.grid[row].every(cell => cell === 1)) {
                this.grid[row].fill(0);
                this.updateGridDisplay();
                linesCleared++;
            }
        }
        
        // Check columns
        for (let col = 0; col < 10; col++) {
            let columnFull = true;
            for (let row = 0; row < 10; row++) {
                if (this.grid[row][col] === 0) {
                    columnFull = false;
                    break;
                }
            }
            if (columnFull) {
                for (let row = 0; row < 10; row++) {
                    this.grid[row][col] = 0;
                }
                this.updateGridDisplay();
                linesCleared++;
            }
        }
        
        if (linesCleared > 0) {
            this.score += linesCleared * 100 * linesCleared; // Bonus for multiple lines
        }
    }

    updateGridDisplay() {
        for (let row = 0; row < 10; row++) {
            for (let col = 0; col < 10; col++) {
                const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
                if (this.grid[row][col]) {
                    cell.classList.add('filled');
                } else {
                    cell.classList.remove('filled');
                }
            }
        }
    }

    updateScore() {
        document.getElementById('score').textContent = this.score;
    }

    isGameOver() {
        return this.pieces.filter(p => !p.used).every(piece => {
            for (let row = 0; row < 10; row++) {
                for (let col = 0; col < 10; col++) {
                    if (this.canPlacePiece(piece.shape, row, col)) {
                        return false;
                    }
                }
            }
            return true;
        });
    }

    showGameOver() {
        // Skip the game over modal and go directly to question
        this.showQuestion();
    }

    restart() {
        this.grid = Array(10).fill().map(() => Array(10).fill(0));
        this.score = 0;
        this.pieces = [];
        this.draggedPiece = null;
        this.isDragging = false;
        
        // Stop any running timer
        this.stopQuestionTimer();
        
        document.getElementById('gameOver').style.display = 'none';
        document.getElementById('questionModal').style.display = 'none';
        this.clearPreview();
        this.removeGhostPiece();
        this.updateGridDisplay();
        this.generatePieces();
        this.updateScore();
    }

    showQuestion() {
        const randomQuestion = this.questions[Math.floor(Math.random() * this.questions.length)];
        
        document.getElementById('questionText').textContent = randomQuestion.question;
        
        const optionsContainer = document.getElementById('answerOptions');
        optionsContainer.innerHTML = '';
        
        randomQuestion.options.forEach((option, index) => {
            const button = document.createElement('button');
            button.className = 'answer-btn';
            button.textContent = `${String.fromCharCode(65 + index)}. ${option}`;
            button.onclick = () => this.handleAnswer(index, randomQuestion.correct, button);
            optionsContainer.appendChild(button);
        });
        
        document.getElementById('questionFeedback').textContent = '';
        document.getElementById('modalButtons').style.display = 'none';
        document.getElementById('questionModal').style.display = 'flex';
        
        // Start the 30-second timer
        this.startQuestionTimer();
    }

    startQuestionTimer() {
        this.timeLeft = 30;
        this.updateTimerDisplay();
        
        this.questionTimer = setInterval(() => {
            this.timeLeft--;
            this.updateTimerDisplay();
            
            if (this.timeLeft <= 0) {
                this.handleTimerExpired();
            }
        }, 1000);
    }
    
    updateTimerDisplay() {
        const timerElement = document.getElementById('timerDisplay');
        timerElement.textContent = `Time: ${this.timeLeft}s`;
        
        // Change color as time runs out
        if (this.timeLeft <= 10) {
            timerElement.style.color = '#ff6b6b';
            timerElement.style.fontWeight = 'bold';
        } else if (this.timeLeft <= 20) {
            timerElement.style.color = '#ffa502';
        } else {
            timerElement.style.color = '#00ff87';
        }
    }
    
    handleTimerExpired() {
        // Stop the timer
        this.stopQuestionTimer();
        
        // Disable all answer buttons
        document.querySelectorAll('.answer-btn').forEach(btn => {
            btn.style.pointerEvents = 'none';
            btn.style.opacity = '0.5';
        });
        
        // Show time's up message and game over
        const feedbackElement = document.getElementById('questionFeedback');
        feedbackElement.textContent = '⏰ Time\'s up! Game Over.';
        feedbackElement.style.color = '#ff6b6b';
        
        const modalButtons = document.getElementById('modalButtons');
        modalButtons.innerHTML = '<button class="game-over-btn" onclick="finalGameOver()">Game Over</button>';
        modalButtons.style.display = 'flex';
    }
    
    stopQuestionTimer() {
        if (this.questionTimer) {
            clearInterval(this.questionTimer);
            this.questionTimer = null;
        }
    }

    handleAnswer(selectedIndex, correctIndex, buttonElement) {
        // Stop the timer when answer is selected
        this.stopQuestionTimer();
        
        const buttons = document.querySelectorAll('.answer-btn');
        const feedbackElement = document.getElementById('questionFeedback');
        const modalButtons = document.getElementById('modalButtons');
        
        // Disable all buttons
        buttons.forEach(btn => btn.style.pointerEvents = 'none');
        
        if (selectedIndex === correctIndex) {
            buttonElement.classList.add('correct');
            feedbackElement.textContent = '🎉 Correct! You can continue playing!';
            feedbackElement.style.color = '#00ff87';
            
            // Show continue button for correct answer
            modalButtons.innerHTML = '<button class="continue-btn" onclick="continueWithSameScore()">Continue Game</button>';
        } else {
            buttonElement.classList.add('incorrect');
            buttons[correctIndex].classList.add('correct');
            feedbackElement.textContent = '❌ Wrong answer! Game Over.';
            feedbackElement.style.color = '#ff6b6b';
            
            // Show game over option for wrong answer
            modalButtons.innerHTML = '<button class="game-over-btn" onclick="finalGameOver()">Game Over</button>';
        }
        
        modalButtons.style.display = 'flex';
    }
}

let game;

function startGame() {
    game = new BlockBlast();
}

function showQuestion() {
    game.showQuestion();
}

function restartGame() {
    game.restart();
}

function continueWithSameScore() {
    // Clear the grid but keep the score
    game.grid = Array(10).fill().map(() => Array(10).fill(0));
    game.pieces = [];
    game.draggedPiece = null;
    game.isDragging = false;
    
    // Hide modals
    document.getElementById('questionModal').style.display = 'none';
    document.getElementById('gameOver').style.display = 'none';
    
    // Clean up any drag states
    game.clearPreview();
    game.removeGhostPiece();
    
    // Refresh display and generate new pieces
    game.updateGridDisplay();
    game.generatePieces();
    game.updateScore();
}

function finalGameOver() {
    // Update final score display before showing game over
    document.getElementById('finalScore').textContent = game.score;
    
    // Hide question modal and show final game over
    document.getElementById('questionModal').style.display = 'none';
    document.getElementById('gameOver').style.display = 'flex';
}

function refreshPage() {
    window.location.reload();
}

function goHome() {
    window.location.href = 'home.html';
}

// Start the game when page loads
window.addEventListener('load', startGame);
