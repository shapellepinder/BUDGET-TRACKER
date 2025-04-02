// Data Storage Functions

// Transactions
function getTransactions() {
    const transactions = localStorage.getItem('transactions');
    return transactions ? JSON.parse(transactions) : [];
}

function addTransaction(transaction) {
    const transactions = getTransactions();
    transactions.push(transaction);
    localStorage.setItem('transactions', JSON.stringify(transactions));
    
    // Update dashboard if it's open
    if (document.querySelector('#categoryChart')) {
        updateDashboard();
    }
}

// Budget
function getBudget() {
    const budget = localStorage.getItem('budget');
    return budget ? JSON.parse(budget) : { total: 0, categories: {} };
}

function saveBudget(budget) {
    localStorage.setItem('budget', JSON.stringify(budget));
}

// User Profile
function getUserProfile() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : {};
}

function saveUserProfile(user) {
    localStorage.setItem('user', JSON.stringify(user));
}

// Categories
function getCategories() {
    const defaultCategories = ['Food', 'Transportation', 'Housing', 'Entertainment', 'Utilities', 'Other'];
    const customCategories = localStorage.getItem('categories');
    
    return customCategories ? 
        [...defaultCategories, ...JSON.parse(customCategories)] : 
        defaultCategories;
}

function addCustomCategory(category) {
    const currentCategories = getCategories();
    
    // Don't add if already exists
    if (currentCategories.includes(category)) return;
    
    const customCategories = localStorage.getItem('categories');
    const categories = customCategories ? JSON.parse(customCategories) : [];
    categories.push(category);
    localStorage.setItem('categories', JSON.stringify(categories));
}

function deleteCustomCategory(category) {
    const defaultCategories = ['Food', 'Transportation', 'Housing', 'Entertainment', 'Utilities', 'Other'];
    
    // Don't allow deleting default categories
    if (defaultCategories.includes(category)) return;
    
    const customCategories = localStorage.getItem('categories');
    if (customCategories) {
        const categories = JSON.parse(customCategories).filter(c => c !== category);
        localStorage.setItem('categories', JSON.stringify(categories));
    }
}

// Calculation Helpers
function calculateTotalBalance(transactions) {
    return transactions.reduce((balance, transaction) => {
        return transaction.type === 'income' ? 
            balance + transaction.amount : 
            balance - transaction.amount;
    }, 0);
}

function calculateMonthlyExpenses(transactions) {
    const now = new Date();
    const currentMonth = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
    
    return transactions
        .filter(transaction => {
            if (transaction.type !== 'expense') return false;
            
            const transactionDate = new Date(transaction.date);
            const transactionMonth = transactionDate.getFullYear() + '-' + String(transactionDate.getMonth() + 1).padStart(2, '0');
            
            return transactionMonth === currentMonth;
        })
        .reduce((total, transaction) => total + transaction.amount, 0);
}