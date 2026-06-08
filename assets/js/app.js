const months = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

const SUPABASE_URL = "https://ippfvdzmnsxyxawijjjs.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_d1IH3PrVEkz3MoHDWfPIew_V5LFQcSh";
const VARIABLE_EXPENSES_TABLE = "variable_expenses";

const variableCategories = {
  Mercado: {
    budget: 800,
    detailsId: "marketDetails",
    percentId: "marketPercent",
    progressId: "marketProgress",
    usedId: "marketUsed"
  },
  Extras: {
    budget: 400,
    detailsId: "extrasDetails",
    percentId: "extrasPercent",
    progressId: "extrasProgress",
    usedId: "extrasUsed"
  },
  Gasolina: {
    budget: 450,
    detailsId: "gasDetails",
    percentId: "gasPercent",
    progressId: "gasProgress",
    usedId: "gasUsed"
  }
};

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD"
});

const currentMonth = document.getElementById("currentMonth");

if (currentMonth) {
  currentMonth.textContent = months[new Date().getMonth()];
}

const toggleButton = document.getElementById("toggleExpenses");
const expenseGrid = document.getElementById("expenseGrid");

toggleButton.addEventListener("click", () => {
  expenseGrid.classList.toggle("is-hidden");

  toggleButton.textContent = expenseGrid.classList.contains("is-hidden")
    ? "Expandir"
    : "Ocultar";
});

const detailToggleButtons = document.querySelectorAll(".detail-toggle-btn");

detailToggleButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const detailList = document.getElementById(button.dataset.target);

    detailList.classList.toggle("is-hidden");

    button.textContent = detailList.classList.contains("is-hidden")
      ? "⌄"
      : "⌃";
  });
});

const floatingAddButton = document.querySelector(".floating-add-btn");
const expenseModal = document.getElementById("expenseModal");
const expenseForm = document.getElementById("expenseForm");
const expenseDate = document.getElementById("expenseDate");
const expenseDescription = document.getElementById("expenseDescription");
const expenseAmount = document.getElementById("expenseAmount");
const cancelExpenseButton = document.getElementById("cancelExpense");
const saveExpenseButton = expenseForm.querySelector(".modal-btn.primary");

const supabaseHeaders = {
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  "Content-Type": "application/json"
};

const getTodayInputValue = () => {
  const today = new Date();
  const timezoneOffset = today.getTimezoneOffset() * 60000;

  return new Date(today.getTime() - timezoneOffset).toISOString().slice(0, 10);
};

const getMonthRange = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  return {
    start: formatDateInputValue(start),
    end: formatDateInputValue(end)
  };
};

const formatDateInputValue = (date) => {
  const timezoneOffset = date.getTimezoneOffset() * 60000;

  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 10);
};

const formatExpenseDate = (dateValue) => {
  const [year, month, day] = dateValue.split("-");

  return `${month}/${day}`;
};

const getOwnerInitial = (owner) => owner.slice(0, 1).toUpperCase();

const getProgressStatus = (percentage) => {
  if (percentage >= 81) {
    return "danger";
  }

  if (percentage >= 61) {
    return "warning";
  }

  return "safe";
};

const setSaveState = (isSaving) => {
  saveExpenseButton.disabled = isSaving;
  saveExpenseButton.textContent = isSaving ? "Salvando..." : "Salvar";
};

const openExpenseModal = () => {
  expenseDate.value = getTodayInputValue();
  expenseModal.classList.remove("is-hidden");
  expenseDescription.focus();
};

const closeExpenseModal = () => {
  expenseModal.classList.add("is-hidden");
  expenseForm.reset();
  setSaveState(false);
};

floatingAddButton.addEventListener("click", openExpenseModal);
cancelExpenseButton.addEventListener("click", closeExpenseModal);

expenseModal.addEventListener("click", (event) => {
  if (event.target === expenseModal) {
    closeExpenseModal();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !expenseModal.classList.contains("is-hidden")) {
    closeExpenseModal();
  }
});

const buildDetailRow = (expense) => {
  const row = document.createElement("div");
  row.className = "variable-detail-row";

  row.innerHTML = `
    <div class="detail-info">
      ${expense.description ? `<span>${expense.description}</span>` : ""}
      <small>${formatExpenseDate(expense.expense_date)}</small>
    </div>
    <span class="person-badge">${getOwnerInitial(expense.inserted_by)}</span>
    <strong>${currencyFormatter.format(Number(expense.amount))}</strong>
    <button class="delete-expense-btn" data-id="${expense.id}" aria-label="Excluir gasto">×</button>
  `;

  return row;
};

const deleteVariableExpense = async (id) => {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${VARIABLE_EXPENSES_TABLE}?id=eq.${id}`, {
    method: "DELETE",
    headers: {
      ...supabaseHeaders,
      Prefer: "return=minimal"
    }
  });

  if (!response.ok) {
    throw new Error("Nao foi possivel excluir o gasto.");
  }
};

const renderCategoryExpenses = (category, expenses) => {
  const config = variableCategories[category];
  const details = document.getElementById(config.detailsId);
  const percent = document.getElementById(config.percentId);
  const used = document.getElementById(config.usedId);
  const progress = document.getElementById(config.progressId);
  const total = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
  const percentage = Math.round((total / config.budget) * 100);
  const progressWidth = Math.min(percentage, 100);
  const status = getProgressStatus(percentage);

  details.innerHTML = "";

  if (expenses.length === 0) {
    const emptyMessage = document.createElement("div");
    emptyMessage.className = "empty-detail";
    emptyMessage.textContent = "Nenhum gasto lançado.";
    details.appendChild(emptyMessage);
  } else {
    expenses.forEach((expense) => {
      details.appendChild(buildDetailRow(expense));
    });
  }

  used.textContent = currencyFormatter.format(total);
  percent.textContent = `${percentage}%`;
  percent.className = `progress-percent is-${status}`;
  progress.style.width = `${progressWidth}%`;
  progress.className = `progress-fill is-${status}`;
};

document.addEventListener("click", async (event) => {
  const deleteButton = event.target.closest(".delete-expense-btn");

  if (!deleteButton) {
    return;
  }

  const shouldDelete = confirm("Tem certeza que deseja excluir este gasto?");

  if (!shouldDelete) {
    return;
  }

  deleteButton.disabled = true;

  try {
    await deleteVariableExpense(deleteButton.dataset.id);
    await loadVariableExpenses();
  } catch (error) {
    alert(error.message);
    deleteButton.disabled = false;
  }
});

const renderVariableExpenses = (expenses) => {
  Object.keys(variableCategories).forEach((category) => {
    const categoryExpenses = expenses.filter((expense) => expense.category === category);

    renderCategoryExpenses(category, categoryExpenses);
  });
};

const loadVariableExpenses = async () => {
  const { start, end } = getMonthRange();
  const query = new URLSearchParams({
    select: "id,category,description,expense_date,inserted_by,amount,created_at",
    expense_date: `gte.${start}`,
    order: "expense_date.desc,created_at.desc"
  });

  query.append("expense_date", `lt.${end}`);

  const response = await fetch(`${SUPABASE_URL}/rest/v1/${VARIABLE_EXPENSES_TABLE}?${query}`, {
    headers: supabaseHeaders
  });

  if (!response.ok) {
    throw new Error("Nao foi possivel carregar os gastos variaveis.");
  }

  const expenses = await response.json();

  renderVariableExpenses(expenses);
};

const saveVariableExpense = async (expense) => {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${VARIABLE_EXPENSES_TABLE}`, {
    method: "POST",
    headers: {
      ...supabaseHeaders,
      Prefer: "return=minimal"
    },
    body: JSON.stringify(expense)
  });

  if (!response.ok) {
    throw new Error("Nao foi possivel salvar o gasto.");
  }
};

expenseForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const formData = new FormData(expenseForm);
  const amount = Number(formData.get("amount"));
  const description = formData.get("description").trim();

  if (!amount || amount <= 0) {
    expenseAmount.focus();
    return;
  }

  if (!description) {
    expenseDescription.focus();
    return;
  }

  setSaveState(true);

  try {
    await saveVariableExpense({
      category: formData.get("category"),
      description,
      expense_date: formData.get("date"),
      inserted_by: formData.get("owner"),
      amount
    });

    closeExpenseModal();
    await loadVariableExpenses();
  } catch (error) {
    alert(error.message);
    setSaveState(false);
  }
});

loadVariableExpenses().catch((error) => {
  console.error(error);
});
