// Chart Rendering Functions

function renderCategoryChart(transactions) {
    const ctx = document.getElementById('categoryChart').getContext('2d');
    
    // Calculate expenses by category for current month
    const now = new Date();
    const currentMonth = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
    const categories = getCategories();
    
    const categoryExpenses = {};
    categories.forEach(category => {
        categoryExpenses[category] = 0;
    });
    
    transactions.forEach(transaction => {
        if (transaction.type === 'expense') {
            const transactionDate = new Date(transaction.date);
            const transactionMonth = transactionDate.getFullYear() + '-' + String(transactionDate.getMonth() + 1).padStart(2, '0');
            
            if (transactionMonth === currentMonth) {
                categoryExpenses[transaction.category] += transaction.amount;
            }
        }
    });
    
    // Filter out categories with 0 expenses
    const labels = [];
    const data = [];
    const backgroundColors = [];
    
    for (const category in categoryExpenses) {
        if (categoryExpenses[category] > 0) {
            labels.push(category);
            data.push(categoryExpenses[category]);
            backgroundColors.push(getCategoryColor(category));
        }
    }
    
    // Create chart
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: backgroundColors,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'right',
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = Math.round((value / total) * 100);
                            return `${label}: ${formatCurrency(value)} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

function renderMonthlyTrendChart(transactions) {
    const ctx = document.getElementById('monthlyTrendChart').getContext('2d');
    const now = new Date();
    const currentYear = now.getFullYear();
    
    // Prepare data for last 6 months
    const months = [];
    const incomeData = [];
    const expenseData = [];
    
    for (let i = 5; i >= 0; i--) {
        const date = new Date(currentYear, now.getMonth() - i, 1);
        const monthName = date.toLocaleString('default', { month: 'short' });
        const yearMonth = date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0');
        
        months.push(`${monthName} ${date.getFullYear()}`);
        
        let income = 0;
        let expenses = 0;
        
        transactions.forEach(transaction => {
            const transactionDate = new Date(transaction.date);
            const transactionMonth = transactionDate.getFullYear() + '-' + String(transactionDate.getMonth() + 1).padStart(2, '0');
            
            if (transactionMonth === yearMonth) {
                if (transaction.type === 'income') {
                    income += transaction.amount;
                } else {
                    expenses += transaction.amount;
                }
            }
        });
        
        incomeData.push(income);
        expenseData.push(expenses);
    }
    
    // Create chart
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: months,
            datasets: [
                {
                    label: 'Income',
                    data: incomeData,
                    backgroundColor: '#4bb543',
                    borderColor: '#4bb543',
                    borderWidth: 1
                },
                {
                    label: 'Expenses',
                    data: expenseData,
                    backgroundColor: '#ff3333',
                    borderColor: '#ff3333',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    stacked: false,
                },
                y: {
                    stacked: false,
                    beginAtZero: true
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.dataset.label || '';
                            const value = context.raw || 0;
                            return `${label}: ${formatCurrency(value)}`;
                        }
                    }
                }
            }
        }
    });
}