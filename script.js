/**
 * Expense Tracker - Complete Production JavaScript
 * Architecture: Model-View-Controller (MVC)
 */

// =========================================
// 1. MODEL / STATE MANAGEMENT (Data & LocalStorage)
// =========================================
const AppState = {
    // LocalStorage se transactions load karna
    transactions: JSON.parse(localStorage.getItem('expense_tracker_tx')) || [],

    // LocalStorage me save karna
    save() {
        localStorage.setItem('expense_tracker_tx', JSON.stringify(this.transactions));
    },

    // Naya transaction add karna
    addTransaction(text, amount) {
        const newTx = {
            id: Date.now().toString(),
            text: text,
            amount: parseFloat(amount)
        };
        this.transactions.push(newTx);
        this.save();
        return newTx;
    },

    // Transaction delete karna
    deleteTransaction(id) {
        this.transactions = this.transactions.filter(tx => tx.id !== id);
        this.save();
    },

    // Total Balance, Income, aur Expense calculate karna
    getTotals() {
        const amounts = this.transactions.map(tx => tx.amount);
        const total = amounts.reduce((acc, item) => (acc += item), 0).toFixed(2);
        
        const income = amounts
            .filter(item => item > 0)
            .reduce((acc, item) => (acc += item), 0)
            .toFixed(2);

        const expense = (
            amounts
                .filter(item => item < 0)
                .reduce((acc, item) => (acc += item), 0) * -1
        ).toFixed(2);

        return { total, income, expense };
    }
};

// =========================================
// 2. VIEW LAYER (DOM Manipulation & UI Updates)
// =========================================
const UI = {
    balanceEl: document.getElementById('balance'),
    moneyPlusEl: document.getElementById('money-plus'),
    moneyMinusEl: document.getElementById('money-minus'),
    listEl: document.getElementById('list'),
    formEl: document.getElementById('form'),
    textInput: document.getElementById('text'),
    amountInput: document.getElementById('amount'),
    errorEl: document.getElementById('error-msg'),

    // Currency Formatter (Rupees format)
    formatMoney(num) {
        const parts = parseFloat(num).toFixed(2).split('.');
        const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        return `₹${integerPart}.${parts[1]}`;
    },

    // Safe DOM element creation (XSS Prevention)
    createTransactionElement(transaction) {
        const sign = transaction.amount < 0 ? '-' : '+';
        const itemClass = transaction.amount < 0 ? 'minus' : 'plus';

        const li = document.createElement('li');
        li.classList.add(itemClass);
        li.setAttribute('data-id', transaction.id);

        const titleSpan = document.createElement('span');
        titleSpan.appendChild(document.createTextNode(transaction.text));

        const amountSpan = document.createElement('span');
        amountSpan.appendChild(
            document.createTextNode(`${sign}${this.formatMoney(Math.abs(transaction.amount))}`)
        );

        const deleteBtn = document.createElement('button');
        deleteBtn.classList.add('delete-btn');
        deleteBtn.innerHTML = '×';
        deleteBtn.onclick = () => Controller.handleDelete(transaction.id);

        li.appendChild(titleSpan);
        li.appendChild(amountSpan);
        li.appendChild(deleteBtn);

        return li;
    },

    // Full List aur Totals ko re-render karna
    renderAll(transactions) {
        if (!this.listEl) return;
        this.listEl.innerHTML = '';

        if (transactions.length === 0) {
            const emptyMsg = document.createElement('p');
            emptyMsg.className = 'empty-msg';
            emptyMsg.textContent = 'Koi transaction nahi hai. Naya income/expense add karein!';
            this.listEl.appendChild(emptyMsg);
        } else {
            transactions.forEach(tx => {
                this.listEl.appendChild(this.createTransactionElement(tx));
            });
        }

        this.updateSummary();
    },

    // Header totals update karna
    updateSummary() {
        const { total, income, expense } = AppState.getTotals();
        if (this.balanceEl) this.balanceEl.innerText = this.formatMoney(total);
        if (this.moneyPlusEl) this.moneyPlusEl.innerText = `+${this.formatMoney(income)}`;
        if (this.moneyMinusEl) this.moneyMinusEl.innerText = `-${this.formatMoney(expense)}`;
    },

    // Error message display helper
    showError(msg) {
        if (this.errorEl) {
            this.errorEl.innerText = msg;
            this.errorEl.classList.add('show');
            setTimeout(() => {
                this.errorEl.classList.remove('show');
            }, 3000);
        } else {
            alert(msg);
        }
    },

    clearInputs() {
        if (this.textInput) this.textInput.value = '';
        if (this.amountInput) this.amountInput.value = '';
    }
};

// =========================================
// 3. CONTROLLER LAYER (App Logic & Event Handling)
// =========================================
const Controller = {
    init() {
        this.adjustVideoSpeed();
        UI.renderAll(AppState.transactions);
        this.setupEventListeners();
    },

    // Ambient Video Speed Optimization (50% playback speed)
    adjustVideoSpeed() {
        const bgVideo = document.getElementById('bg-video');
        if (bgVideo) {
            bgVideo.playbackRate = 0.4;
        }
    },

    setupEventListeners() {
        if (UI.formEl) {
            UI.formEl.addEventListener('submit', (e) => this.handleAddTransaction(e));
        }
    },

    handleAddTransaction(e) {
        e.preventDefault();

        const text = UI.textInput.value.trim();
        const amount = UI.amountInput.value.trim();

        // Validation 1: Empty Fields
        if (text === '' || amount === '') {
            UI.showError('Kripya description aur amount dono enter karein!');
            return;
        }

        // Validation 2: Invalid Number
        if (isNaN(amount) || parseFloat(amount) === 0) {
            UI.showError('Valid amount enter karein! (Income: +1000, Expense: -500)');
            return;
        }

        // Add & Render
        AppState.addTransaction(text, amount);
        UI.renderAll(AppState.transactions);
        UI.clearInputs();
    },

    handleDelete(id) {
        AppState.deleteTransaction(id);
        UI.renderAll(AppState.transactions);
    }
};

// Initializing application on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
    Controller.init();
});