const $transactionForm = document.querySelector("#transactionForm") as HTMLFormElement;
const $displayIncomes = document.querySelector("#displayIncomes") as HTMLElement;
const $displayExpenses = document.querySelector("#displayExpenses") as HTMLElement;
const $transactionList = document.querySelector("#transactionList") as HTMLDivElement;
const $overlay = document.querySelector("#overlay") as HTMLDivElement;
const $incomeBtn = document.querySelector("#incomeBtn") as HTMLButtonElement;
const $expenseBtn = document.querySelector("#expenseBtn") as HTMLButtonElement;
const $closeBtn = document.querySelector("#closeBtn") as HTMLButtonElement;

const url = new URL(location.href);
const INCOMES = JSON.parse(localStorage.getItem("incomes") as string) || [];
const EXPENSES = JSON.parse(localStorage.getItem("expenses") as string) || [];

type Tincome = {
    transactionName: string;
    transactionType: string | undefined;
    transactionAmount: number;
    type: string;
    date: number;
};

export {};

declare global {
    interface String {
        seperateCurrency(): string;
    }
}

String.prototype.seperateCurrency = function (): string {
    return this.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

const getCurrentQuery = () => {
    return new URLSearchParams(location.search).get('modal') || "";
};

let totalIncome = 0;
let totalExpense = 0;

const checkBalance = () => {
    totalIncome = INCOMES.reduce((acc: number, cur: Tincome) => acc + cur.transactionAmount, 0);
    totalExpense = EXPENSES.reduce((acc: number, cur: Tincome) => acc + cur.transactionAmount, 0);

    $displayIncomes.innerHTML = `${(totalIncome - totalExpense).toString().seperateCurrency()} UZS`;
    $displayExpenses.innerHTML = `${totalExpense.toString().seperateCurrency()} UZS`;
};

checkBalance();
let myChartInstance: Chart | null = null;
let myBarChartInstance: Chart | null = null;

const renderChart = () => {
    const $myChart = document.querySelector("#myChart") as HTMLCanvasElement;
    if (myChartInstance) {
        myChartInstance.destroy();
    }

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
    const categoryTotals: { [key: string]: number } = {};
    EXPENSES.forEach((expense: Tincome) => {
        const { transactionType, transactionAmount } = expense;
        if (transactionType) {
            categoryTotals[transactionType] = (categoryTotals[transactionType] || 0) + transactionAmount;
        }
    });

    return Object.entries(categoryTotals)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
};

const renderBarChart = () => {
    if (myBarChartInstance) {
        myBarChartInstance.destroy();
    }

    const topCategories = getTopCategories();
    const labels = topCategories.map(([type]) => type);
    const data = topCategories.map(([_, total]) => total);
    const $myBarChart = document.querySelector("#myBarChart") as HTMLCanvasElement;

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
        options: {}
    });
};

renderChart();
renderBarChart();

const checkModalOpen = () => {
    const openModal = getCurrentQuery();
    const $select = $transactionForm.querySelector("select") as HTMLSelectElement;
    $overlay.classList.toggle("hidden", openModal === "");
    $select.classList.toggle("hidden", openModal === "income");
};

enum TransactionType {
    Income = "income",
    Expense = "expense"
}

class Transaction {
    transactionName: string;
    transactionType: string | undefined;
    transactionAmount: number;
    type: string;
    date: number;
    constructor(transactionName: string, transactionAmount: number, transactionType: string | undefined, type: string) {
        this.transactionName = transactionName;
        this.transactionType = transactionType;
        this.transactionAmount = transactionAmount;
        this.type = type;
        this.date = new Date().getTime();
    }
}

const renderTransactions = () => {
    const $transactionTableBody = document.querySelector("#transactionTableBody") as HTMLTableSectionElement;
    $transactionTableBody.innerHTML = "";
    INCOMES.forEach((income: Tincome) => {
        $transactionTableBody.innerHTML += 
            `<tr class="transactionTable transactionIncome">
                <td>${income.transactionName}</td>
                <td>${income.transactionAmount.toString().seperateCurrency()} UZS</td>
                <td>Income</td>
                <td>${new Date(income.date).toLocaleDateString()}</td>
            </tr>`;
    });

    EXPENSES.forEach((expense: Tincome) => {
        $transactionTableBody.innerHTML += 
            `<tr class="transactionTable transactionExpense">
                <td>${expense.transactionName}</td>
                <td>${expense.transactionAmount.toString().seperateCurrency()} UZS</td>
                <td>Expense</td>
                <td>${new Date(expense.date).toLocaleDateString()}</td>
            </tr>`;
    });
};

renderTransactions();

const isValidTransaction = (values: (string | number | undefined)[]) => {
    return values.slice(0, getCurrentQuery() === TransactionType.Income ? -1 : undefined)
        .every((value) => typeof value === "string" ? value.trim().length > 0 : typeof value === "number" && value > 0);
};

const createNewTransaction = (e: Event) => {
    e.preventDefault();
    const inputs = Array.from($transactionForm.querySelectorAll("input, select")) as HTMLInputElement[];
    const values: (string | number | undefined)[] = inputs.map(input => input.type === "number" ? +input.value : input.value || undefined);
    
    if (isValidTransaction(values)) {
        const newTransaction = new Transaction(...values as [string, number, string | undefined, string]);
        if (getCurrentQuery() === TransactionType.Income) {
            INCOMES.push(newTransaction);
            localStorage.setItem("incomes", JSON.stringify(INCOMES));
        } else {
            EXPENSES.push(newTransaction);
            localStorage.setItem("expenses", JSON.stringify(EXPENSES));
        }
        updateUIAfterTransaction();
    } else {
        alert("Please fill in all fields correctly!");
    }
};

const updateUIAfterTransaction = () => {
    window.history.pushState({ path: location.href.split("?")[0] }, "", location.href.split("?")[0]);
    checkModalOpen();
    checkBalance();
    renderChart();
    renderBarChart();
    renderTransactions();
};

$incomeBtn.addEventListener("click", () => {
    toggleModal(TransactionType.Income);
});

$expenseBtn.addEventListener("click", () => {
    toggleModal(TransactionType.Expense);
});

$closeBtn.addEventListener("click", () => {
    window.history.pushState({ path: location.href.split("?")[0] }, "", location.href.split("?")[0]);
    checkModalOpen();
});

const toggleModal = (type: TransactionType) => {
    url.searchParams.set("modal", type);
    window.history.pushState({ path: location.href + "?" + url.searchParams }, "", location.href + "?" + url.searchParams);
    checkModalOpen();
};

checkModalOpen();

$transactionForm.addEventListener("submit", createNewTransaction);

