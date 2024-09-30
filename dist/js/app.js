"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
//@ts-ignore
const $overlay = document.querySelector("#overlay");
//@ts-ignore
const $incomeBtn = document.querySelector("#incomeBtn");
//@ts-ignore
const $expenseBtn = document.querySelector("#expenseBtn");
//@ts-ignore
const $closeBtn = document.querySelector("#closeBtn");
//@ts-ignore
const $transactionForm = document.querySelector("#transactionForm");
//@ts-ignore
const $displayIncomes = document.querySelector("#displayIncomes");
//@ts-ignore
const $displayExpenses = document.querySelector("#displayExpenses");
//@ts-ignore
const $transactionList = document.querySelector("#transactionList");
//@ts-ignore
const $clearBtn = document.querySelector("#clearBtn");
const url = new URL(location.href);
const INCOMES = JSON.parse(localStorage.getItem("incomes")) || [];
const EXPENSES = JSON.parse(localStorage.getItem("expenses")) || [];
$clearBtn.addEventListener("click", () => {
    localStorage.clear();
    location.reload();
});
String.prototype.seperateCurrency = function () {
    return this.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};
const getCurrentQuery = () => {
    return new URLSearchParams(location.search).get('modal') || "";
};
let totalIncome = 0;
let totalExpense = 0;
const checkBalance = () => {
    totalIncome = INCOMES.reduce((acc, cur) => acc + cur.transactionAmount, 0);
    totalExpense = EXPENSES.reduce((acc, cur) => acc + cur.transactionAmount, 0);
    $displayIncomes.innerHTML = `${(totalIncome - totalExpense).toString().seperateCurrency()} UZS`;
    $displayExpenses.innerHTML = `${(totalExpense).toString().seperateCurrency()} UZS`;
};
checkBalance();
//@ts-ignore
let myChartInstance = null;
//@ts-ignore
let myBarChartInstance = null;
const renderChart = () => {
    //@ts-ignore
    const $myChart = document.querySelector("#myChart");
    if (myChartInstance) {
        myChartInstance.destroy();
    }
    //@ts-ignore
    myChartInstance = new Chart($myChart, {
        type: 'doughnut',
        data: {
            datasets: [{
                    data: [totalIncome - totalExpense, totalExpense],
                    backgroundColor: ['#4CAF50', '#F44336'],
                }],
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                },
            }
        }
    });
};
const getTopCategories = () => {
    const categoryTotals = {};
    EXPENSES.forEach((expense) => {
        const { transactionType, transactionAmount } = expense;
        if (transactionType) {
            if (!categoryTotals[transactionType]) {
                categoryTotals[transactionType] = 0;
            }
            categoryTotals[transactionType] += transactionAmount;
        }
    });
    const sortedCategories = Object.entries(categoryTotals)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
    return sortedCategories;
};
const renderBarChart = () => {
    if (myBarChartInstance) {
        myBarChartInstance.destroy();
    }
    const topCategories = getTopCategories();
    const labels = topCategories.map(([type]) => type);
    const data = topCategories.map(([_, total]) => total);
    //@ts-ignore
    const $myBarChart = document.querySelector("#myBarChart");
    //@ts-ignore
    myBarChartInstance = new Chart($myBarChart, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                    label: 'Total Expenses by Category',
                    data: data,
                    backgroundColor: '#F44336',
                    borderColor: '#D32F2F',
                    borderWidth: 1
                }],
        },
        options: {
        // responsive: false,
        // scales: {
        //     y: {
        //         beginAtZero: true
        //     }
        // }
        }
    });
};
renderChart();
renderBarChart();
const checkModalOpen = () => {
    let openModal = getCurrentQuery();
    let $select = $transactionForm.querySelector("select");
    if (openModal === "income") {
        $overlay.classList.remove("hidden");
        $select.classList.add("hidden");
    }
    else if (openModal === "expense") {
        $overlay.classList.remove("hidden");
        $select.classList.remove("hidden");
    }
    else {
        $overlay.classList.add("hidden");
    }
};
class Transaction {
    transactionName;
    transactionType;
    transactionAmount;
    type;
    date;
    constructor(transactionName, transactionAmount, transactionType, type) {
        this.transactionName = transactionName;
        this.transactionType = transactionType;
        this.transactionAmount = transactionAmount;
        this.type = type;
        this.date = new Date().getTime();
    }
}
const renderTransactions = () => {
    //@ts-ignore
    const $transactionTableBody = document.querySelector("#transactionTableBody");
    $transactionTableBody.innerHTML = "";
    INCOMES.forEach((income) => {
        $transactionTableBody.innerHTML += `
                <tr class="transactionTable transactionIncome">
                    <td>${income.transactionName}</td>
                    <td>${income.transactionAmount.toString().seperateCurrency()} UZS</td>
                    <td>Income</td>
                    <td>${new Date(income.date).toLocaleDateString()}</td>
                </tr>
            `;
    });
    EXPENSES.forEach((expense) => {
        $transactionTableBody.innerHTML += `
                <tr class="transactionTable transactionExpense">
                    <td>${expense.transactionName}</td>
                    <td>${expense.transactionAmount.toString().seperateCurrency()} UZS</td>
                    <td>Expense</td>
                    <td>${new Date(expense.date).toLocaleDateString()}</td>
                </tr>
            `;
    });
};
renderTransactions();
const createNewTransaction = (e) => {
    e.preventDefault();
    const inputs = Array.from($transactionForm.querySelectorAll("input, select"));
    const values = inputs.map((input) => {
        if (input.type === "number") {
            return +input.value;
        }
        return input.value ? input.value : undefined;
    });
    if (values.slice(0, getCurrentQuery() === "income" ? -1 : undefined).every((value) => typeof value === "string" ? value?.trim().length > 0 : value && value > 0)) {
        const newTransaction = new Transaction(...values, getCurrentQuery());
        if (getCurrentQuery() === "income") {
            INCOMES.push(newTransaction);
            localStorage.setItem("incomes", JSON.stringify(INCOMES));
        }
        else {
            EXPENSES.push(newTransaction);
            localStorage.setItem("expenses", JSON.stringify(EXPENSES));
        }
        window.history.pushState({ path: location.href.split("?")[0] }, "", location.href.split("?")[0]);
        checkModalOpen();
        checkBalance();
        inputs.forEach((input) => {
            input.value = "";
        });
        renderChart();
        renderBarChart();
        renderTransactions();
    }
    else {
        alert("Please fill in all fields correctly!");
    }
};
$incomeBtn.addEventListener("click", () => {
    url.searchParams.set("modal", "income");
    window.history.pushState({ path: location.href + "?" + url.searchParams }, "", location.href + "?" + url.searchParams);
    checkModalOpen();
});
$expenseBtn.addEventListener("click", () => {
    url.searchParams.set("modal", "expense");
    window.history.pushState({ path: location.href + "?" + url.searchParams }, "", location.href + "?" + url.searchParams);
    checkModalOpen();
});
$closeBtn.addEventListener("click", () => {
    window.history.pushState({ path: location.href.split("?")[0] }, "", location.href.split("?")[0]);
    checkModalOpen();
});
checkModalOpen();
$transactionForm.addEventListener("submit", createNewTransaction);
