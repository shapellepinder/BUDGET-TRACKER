// Main Application Logic
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the app
    initApp();
    
    // Page specific initializations
    if (document.querySelector('#expense-form')) {
        initExpensePage();
    }
    
    if (document.querySelector('#budget-form')) {
        initBudgetPage();
    }
    
    if (document.querySelector('#history-table')) {
        initHistoryPage();
    }
    
    if (document.querySelector('#profile-form')) {
        initSettingsPage();
    }
});

function initApp() {
    // Common initialization for all pages
    updateSidebarActiveLink();
    loadUserProfile();
    
    // Dashboard specific
    if (document.querySelector('#categoryChart')) {
        updateDashboard();
    }
}

function updateSidebarActiveLink() {
    const currentPage = window.location.pathname.split('/').pop();
    const navLinks = document.querySelectorAll('.nav-links a');
    
    navLinks.forEach(link => {
        link.parentElement.classList.remove('active');
        if (link.getAttribute('href') === currentPage) {
            link.parentElement.classList.add('active');
        }
    });
}

function loadUserProfile() {
    const user = getUserProfile();
    const userProfileElements = document.querySelectorAll('.user-profile span');
    
    if (userProfileElements.length > 0 && user.name) {
        userProfileElements.forEach(element => {
            element.textContent = `Welcome, ${user.name}`;
        });
    }
}

// Dashboard Functions
function updateDashboard() {
    const transactions = getTransactions();
    const budget = getBudget();
    
    // Update stats
    updateDashboardStats(transactions, budget);
    
    // Update charts
    renderCategoryChart(transactions);
    renderMonthlyTrendChart(transactions);
    
    // Update recent transactions
    updateRecentTransactions(transactions);
}

function updateDashboardStats(transactions, budget) {
    const totalBalance = calculateTotalBalance(transactions);
    const monthlyBudget = budget.total || 0;
    const monthlyExpenses = calculateMonthlyExpenses(transactions);
    const remainingBalance = monthlyBudget - monthlyExpenses;
    
    document.getElementById('total-balance').textContent = formatCurrency(totalBalance);
    document.getElementById('monthly-budget').textContent = formatCurrency(monthlyBudget);
    document.getElementById('monthly-expenses').textContent = formatCurrency(monthlyExpenses);
    document.getElementById('remaining-balance').textContent = formatCurrency(remainingBalance);
}

function updateRecentTransactions(transactions) {
    const tableBody = document.querySelector('#recent-transactions-table tbody');
    tableBody.innerHTML = '';
    
    // Get last 5 transactions
    const recentTransactions = transactions.slice(-5).reverse();
    
    recentTransactions.forEach(transaction => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${formatDate(transaction.date)}</td>
            <td>${transaction.description || 'No description'}</td>
            <td>${transaction.category}</td>
            <td class="amount ${transaction.type}">${formatCurrency(transaction.amount)}</td>
        `;
        
        tableBody.appendChild(row);
    });
}

// Expense Page Functions
function initExpensePage() {
    const expenseForm = document.getElementById('expense-form');
    const categoryFilter = document.getElementById('category-filter');
    const monthFilter = document.getElementById('month-filter');
    const applyFiltersBtn = document.getElementById('apply-filters');
    
    // Set default date to today
    document.getElementById('expense-date').valueAsDate = new Date();
    
    // Load categories from budget
    loadCategories();
    
    // Form submission
    expenseForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const amount = parseFloat(document.getElementById('expense-amount').value);
        const category = document.getElementById('expense-category').value;
        const description = document.getElementById('expense-description').value;
        const date = document.getElementById('expense-date').value;
        
        addTransaction({
            type: 'expense',
            amount,
            category,
            description,
            date
        });
        
        // Reset form
        expenseForm.reset();
        document.getElementById('expense-date').valueAsDate = new Date();
        
        // Update table
        updateExpenseTable();
        
        // Show success message
        alert('Expense added successfully!');
    });
    
    // Filter events
    applyFiltersBtn.addEventListener('click', updateExpenseTable);
    
    // Initial table load
    updateExpenseTable();
}

function updateExpenseTable() {
    const categoryFilter = document.getElementById('category-filter').value;
    const monthFilter = document.getElementById('month-filter').value;
    const transactions = getTransactions();
    
    let filteredTransactions = transactions.filter(t => t.type === 'expense');
    
    if (categoryFilter) {
        filteredTransactions = filteredTransactions.filter(t => t.category === categoryFilter);
    }
    
    if (monthFilter) {
        filteredTransactions = filteredTransactions.filter(t => {
            const transactionDate = new Date(t.date);
            const filterDate = new Date(monthFilter);
            return transactionDate.getFullYear() === filterDate.getFullYear() && 
                   transactionDate.getMonth() === filterDate.getMonth();
        });
    }
    
    const tableBody = document.querySelector('#expense-table tbody');
    tableBody.innerHTML = '';
    
    filteredTransactions.forEach(transaction => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${formatDate(transaction.date)}</td>
            <td>${transaction.description || 'No description'}</td>
            <td>${transaction.category}</td>
            <td class="amount expense">${formatCurrency(transaction.amount)}</td>
            <td>
                <button class="btn btn-secondary btn-sm">Edit</button>
                <button class="btn btn-danger btn-sm">Delete</button>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
}

// Budget Page Functions
function initBudgetPage() {
    const budgetForm = document.getElementById('budget-form');
    const totalBudgetInput = document.getElementById('total-budget');
    const categoryInputs = document.querySelectorAll('.category-budget');
    
    // Load current budget
    const budget = getBudget();
    
    if (budget.total) {
        totalBudgetInput.value = budget.total;
    }
    
    categoryInputs.forEach(input => {
        const category = input.dataset.category;
        if (budget.categories[category]) {
            input.value = budget.categories[category];
        }
    });
    
    // Form submission
    budgetForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const totalBudget = parseFloat(totalBudgetInput.value) || 0;
        const categories = {};
        
        categoryInputs.forEach(input => {
            const category = input.dataset.category;
            categories[category] = parseFloat(input.value) || 0;
        });
        
        saveBudget({
            total: totalBudget,
            categories
        });
        
        // Update progress bars
        updateBudgetProgress();
        
        // Show success message
        alert('Budget saved successfully!');
    });
    
    // Initial progress bars load
    updateBudgetProgress();
}

function updateBudgetProgress() {
    const budget = getBudget();
    const transactions = getTransactions();
    const progressBarsContainer = document.querySelector('.progress-bars');
    
    if (!progressBarsContainer) return;
    
    progressBarsContainer.innerHTML = '';
    
    // Calculate spent amounts per category
    const spentAmounts = {};
    const now = new Date();
    const currentMonth = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
    
    transactions.forEach(transaction => {
        if (transaction.type === 'expense') {
            const transactionDate = new Date(transaction.date);
            const transactionMonth = transactionDate.getFullYear() + '-' + String(transactionDate.getMonth() + 1).padStart(2, '0');
            
            if (transactionMonth === currentMonth) {
                if (!spentAmounts[transaction.category]) {
                    spentAmounts[transaction.category] = 0;
                }
                spentAmounts[transaction.category] += transaction.amount;
            }
        }
    });
    
    // Create progress bars for each category
    for (const category in budget.categories) {
        const allocated = budget.categories[category] || 0;
        const spent = spentAmounts[category] || 0;
        const percentage = allocated > 0 ? Math.min(100, (spent / allocated) * 100) : 0;
        
        const progressBar = document.createElement('div');
        progressBar.className = 'progress-item';
        
        progressBar.innerHTML = `
            <div class="progress-header">
                <span>${category}</span>
                <span>${formatCurrency(spent)} / ${formatCurrency(allocated)}</span>
            </div>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${percentage}%; background-color: ${getCategoryColor(category)};"></div>
            </div>
        `;
        
        progressBarsContainer.appendChild(progressBar);
    }
    
    // Update summary
    const totalBudget = budget.total || 0;
    const totalSpent = Object.values(spentAmounts).reduce((sum, amount) => sum + amount, 0);
    const totalRemaining = totalBudget - totalSpent;
    
    document.getElementById('total-budget-amount').textContent = formatCurrency(totalBudget);
    document.getElementById('budget-used-amount').textContent = formatCurrency(totalSpent);
    document.getElementById('budget-remaining-amount').textContent = formatCurrency(totalRemaining);
}

// History Page Functions
function initHistoryPage() {
    const typeFilter = document.getElementById('history-type-filter');
    const categoryFilter = document.getElementById('history-category-filter');
    const monthFilter = document.getElementById('history-month-filter');
    const applyFiltersBtn = document.getElementById('apply-history-filters');
    const exportBtn = document.getElementById('export-history');
    const prevPageBtn = document.getElementById('prev-page');
    const nextPageBtn = document.getElementById('next-page');
    
    let currentPage = 1;
    const transactionsPerPage = 10;
    
    // Load categories
    loadCategories();
    
    // Set default month to current
    const now = new Date();
    monthFilter.value = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
    
    // Filter events
    applyFiltersBtn.addEventListener('click', function() {
        currentPage = 1;
        updateHistoryTable();
    });
    
    // Pagination events
    prevPageBtn.addEventListener('click', function() {
        if (currentPage > 1) {
            currentPage--;
            updateHistoryTable();
        }
    });
    
    nextPageBtn.addEventListener('click', function() {
        currentPage++;
        updateHistoryTable();
    });
    
    // Export event
    exportBtn.addEventListener('click', exportHistoryToCSV);
    
    // Initial table load
    updateHistoryTable();
}

function updateHistoryTable() {
    const typeFilter = document.getElementById('history-type-filter').value;
    const categoryFilter = document.getElementById('history-category-filter').value;
    const monthFilter = document.getElementById('history-month-filter').value;
    const transactions = getTransactions();
    
    let filteredTransactions = [...transactions];
    
    // Apply filters
    if (typeFilter !== 'all') {
        filteredTransactions = filteredTransactions.filter(t => t.type === typeFilter);
    }
    
    if (categoryFilter) {
        filteredTransactions = filteredTransactions.filter(t => t.category === categoryFilter);
    }
    
    if (monthFilter) {
        filteredTransactions = filteredTransactions.filter(t => {
            const transactionDate = new Date(t.date);
            const filterDate = new Date(monthFilter);
            return transactionDate.getFullYear() === filterDate.getFullYear() && 
                   transactionDate.getMonth() === filterDate.getMonth();
        });
    }
    
    // Sort by date (newest first)
    filteredTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Pagination
    const totalPages = Math.ceil(filteredTransactions.length / transactionsPerPage);
    const startIndex = (currentPage - 1) * transactionsPerPage;
    const endIndex = startIndex + transactionsPerPage;
    const paginatedTransactions = filteredTransactions.slice(startIndex, endIndex);
    
    // Update table
    const tableBody = document.querySelector('#history-table tbody');
    tableBody.innerHTML = '';
    
    paginatedTransactions.forEach(transaction => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${formatDate(transaction.date)}</td>
            <td>${transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}</td>
            <td>${transaction.description || 'No description'}</td>
            <td>${transaction.category}</td>
            <td class="amount ${transaction.type}">${formatCurrency(transaction.amount)}</td>
        `;
        
        tableBody.appendChild(row);
    });
    
    // Update pagination controls
    document.getElementById('page-info').textContent = `Page ${currentPage} of ${totalPages}`;
    document.getElementById('prev-page').disabled = currentPage <= 1;
    document.getElementById('next-page').disabled = currentPage >= totalPages;
}

function exportHistoryToCSV() {
    // Implementation for exporting to CSV
    alert('Export to CSV functionality would be implemented here');
}

// Settings Page Functions
function initSettingsPage() {
    const profileForm = document.getElementById('profile-form');
    const addCategoryForm = document.getElementById('add-category-form');
    const exportBtn = document.getElementById('export-data');
    const importBtn = document.getElementById('import-data');
    const importFile = document.getElementById('import-file');
    const resetBtn = document.getElementById('reset-data');
    
    // Load current profile
    const user = getUserProfile();
    document.getElementById('user-name').value = user.name || '';
    document.getElementById('user-email').value = user.email || '';
    document.getElementById('user-currency').value = user.currency || '$';
    
    // Load categories
    updateCategoriesList();
    
    // Profile form submission
    profileForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        saveUserProfile({
            name: document.getElementById('user-name').value,
            email: document.getElementById('user-email').value,
            currency: document.getElementById('user-currency').value
        });
        
        // Update welcome message
        loadUserProfile();
        
        alert('Profile updated successfully!');
    });
    
    // Add category form submission
    addCategoryForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const newCategory = document.getElementById('new-category').value.trim();
        
        if (newCategory) {
            addCustomCategory(newCategory);
            document.getElementById('new-category').value = '';
            updateCategoriesList();
            
            // Also update any category selects on the page
            loadCategories();
        }
    });
    
    // Data management buttons
    exportBtn.addEventListener('click', exportAllData);
    importBtn.addEventListener('click', function() {
        importFile.click();
    });
    
    importFile.addEventListener('change', importData);
    resetBtn.addEventListener('click', resetAllData);
}

function updateCategoriesList() {
    const categoriesList = document.getElementById('categories-list');
    const categories = getCategories();
    
    categoriesList.innerHTML = '';
    
    categories.forEach(category => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span>${category}</span>
            <button class="btn btn-danger btn-sm delete-category" data-category="${category}">Delete</button>
        `;
        categoriesList.appendChild(li);
    });
    
    // Add event listeners to delete buttons
    document.querySelectorAll('.delete-category').forEach(button => {
        button.addEventListener('click', function() {
            const category = this.dataset.category;
            if (confirm(`Are you sure you want to delete the category "${category}"?`)) {
                deleteCustomCategory(category);
                updateCategoriesList();
                loadCategories();
            }
        });
    });
}

function exportAllData() {
    const data = {
        transactions: getTransactions(),
        budget: getBudget(),
        user: getUserProfile(),
        categories: getCategories()
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'budget-data.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
}

function importData(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            
            if (confirm('This will overwrite all your current data. Continue?')) {
                if (data.transactions) {
                    localStorage.setItem('transactions', JSON.stringify(data.transactions));
                }
                
                if (data.budget) {
                    localStorage.setItem('budget', JSON.stringify(data.budget));
                }
                
                if (data.user) {
                    localStorage.setItem('user', JSON.stringify(data.user));
                }
                
                if (data.categories) {
                    localStorage.setItem('categories', JSON.stringify(data.categories));
                }
                
                alert('Data imported successfully!');
                window.location.reload();
            }
        } catch (error) {
            alert('Error importing data: ' + error.message);
        }
    };
    reader.readAsText(file);
}

function resetAllData() {
    if (confirm('Are you sure you want to reset ALL data? This cannot be undone.')) {
        localStorage.clear();
        alert('All data has been reset.');
        window.location.reload();
    }
}

// Helper Functions
function formatCurrency(amount) {
    const user = getUserProfile();
    const currency = user.currency || '$';
    return currency + amount.toFixed(2);
}

function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

function getCategoryColor(category) {
    // Simple hash function to generate consistent colors for categories
    let hash = 0;
    for (let i = 0; i < category.length; i++) {
        hash = category.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const hue = Math.abs(hash % 360);
    return `hsl(${hue}, 70%, 60%)`;
}

function loadCategories() {
    const categories = getCategories();
    const categorySelects = document.querySelectorAll('select[id$="category-filter"], #expense-category');
    
    categorySelects.forEach(select => {
        // Save the current value
        const currentValue = select.value;
        
        // Clear all options except the first one
        while (select.options.length > 1) {
            select.remove(1);
        }
        
        // Add categories
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            select.appendChild(option);
        });
        
        // Restore the current value if it still exists
        if (currentValue && categories.includes(currentValue)) {
            select.value = currentValue;
        }
    });
}