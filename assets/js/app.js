const months = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

const SUPABASE_URL = "https://ippfvdzmnsxyxawijjjs.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_d1IH3PrVEkz3MoHDWfPIew_V5LFQcSh";
const VARIABLE_EXPENSES_TABLE = "variable_expenses";
const FIXED_EXPENSES_TABLE = "fixed_expenses";
const FIXED_EXPENSES_STORAGE_KEY = "home-finance-fixed-expenses";
const FIXED_EXPENSES_DATA_VERSION_KEY = "home-finance-fixed-expenses-version";
const FIXED_EXPENSES_DATA_VERSION = 2;

const defaultFixedExpenses = [
  { id: "rent", icon: "🏠", name: "Aluguel", description: "Dia 1 a 3 de cada mês", amount: 1797 },
  { id: "school", icon: "🎓", name: "Escola", description: "Até dia 3", amount: 577 },
  { id: "utilities", icon: "💡", name: "Utilities", description: "Água, luz e trash", amount: 190 },
  { id: "phone", icon: "📱", name: "Telefone", description: "Mensal", amount: 50 },
  { id: "camila", icon: "👤", name: "Camila", description: "Gastos pessoais", amount: 170 },
  { id: "jiujitsu", icon: "🥋", name: "Jiujitsu", description: "Mensal", amount: 155 },
  { id: "car-insurance", icon: "🚗", name: "Seguro dos Carros", description: "Mensal", amount: 245 },
  { id: "business-insurance", icon: "🏢", name: "Seguro da Empresa", description: "Mensal", amount: 50 },
  { id: "la-fitness", icon: "🏋️", name: "LA Fitness", description: "Camila e Eduardo", amount: 67 },
  { id: "market", icon: "🛒", name: "Mercado", description: "Estimativa mensal", amount: 800 },
  { id: "oportun", icon: "💳", name: "Oportun", description: "Mensal", amount: 70 },
  { id: "gas", icon: "⛽", name: "Gasolina", description: "Estimativa mensal", amount: 300 },
  { id: "extras", icon: "➕", name: "Extras", description: "Margem mensal", amount: 400 },
  { id: "savings", icon: "🚗", name: "Parcela do carro", description: "Valor mensal", amount: 500 }
];

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
    budget: 300,
    detailsId: "gasDetails",
    percentId: "gasPercent",
    progressId: "gasProgress",
    usedId: "gasUsed"
  },
  Trabalho: {
    budget: 1200,
    detailsId: "workDetails",
    percentId: "workPercent",
    progressId: "workProgress",
    usedId: "workUsed"
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
const addFixedExpenseButton = document.getElementById("addFixedExpense");
const expenseGrid = document.getElementById("expenseGrid");
const fixedExpensesTotal = document.getElementById("fixedExpensesTotal");
const fixedExpensesCount = document.getElementById("fixedExpensesCount");
let fixedExpenses = [];
let editingFixedExpenseId = null;
let isAddingFixedExpense = false;

const isValidFixedExpense = (expense) => (
  expense
  && typeof expense.id === "string"
  && typeof expense.icon === "string"
  && typeof expense.name === "string"
  && typeof expense.description === "string"
  && Number.isFinite(Number(expense.amount))
  && Number(expense.amount) >= 0
);

const migrateFixedExpenses = (expenses) => expenses.map((expense) => {
  if (expense.id === "school") {
    return { ...expense, amount: 577 };
  }

  if (expense.id === "gas") {
    return { ...expense, amount: 300 };
  }

  if (expense.id === "savings") {
    return { ...expense, icon: "🚗", name: "Parcela do carro", amount: 500 };
  }

  return expense;
});

const loadFixedExpenses = () => {
  try {
    const storedExpenses = JSON.parse(localStorage.getItem(FIXED_EXPENSES_STORAGE_KEY));

    if (Array.isArray(storedExpenses) && storedExpenses.every(isValidFixedExpense)) {
      let expenses = storedExpenses.map((expense) => ({
        ...expense,
        amount: Number(expense.amount)
      }));

      const storedVersion = Number(localStorage.getItem(FIXED_EXPENSES_DATA_VERSION_KEY) || 1);

      if (storedVersion < FIXED_EXPENSES_DATA_VERSION) {
        expenses = migrateFixedExpenses(expenses);
        localStorage.setItem(FIXED_EXPENSES_STORAGE_KEY, JSON.stringify(expenses));
        localStorage.setItem(FIXED_EXPENSES_DATA_VERSION_KEY, String(FIXED_EXPENSES_DATA_VERSION));
      }

      return expenses;
    }
  } catch (error) {
    console.error("Nao foi possivel carregar as despesas fixas salvas.", error);
  }

  return defaultFixedExpenses.map((expense) => ({ ...expense }));
};

const persistFixedExpenses = () => {
  localStorage.setItem(FIXED_EXPENSES_STORAGE_KEY, JSON.stringify(fixedExpenses));
  localStorage.setItem(FIXED_EXPENSES_DATA_VERSION_KEY, String(FIXED_EXPENSES_DATA_VERSION));
};

const normalizeFixedExpense = (expense) => ({
  id: expense.id,
  icon: expense.icon,
  name: expense.name,
  description: expense.description,
  amount: Number(expense.amount),
  sortOrder: Number(expense.sort_order ?? expense.sortOrder ?? 0)
});

const getNextFixedExpenseSortOrder = () => fixedExpenses.reduce(
  (highestOrder, expense, index) => Math.max(highestOrder, expense.sortOrder || index + 1),
  0
) + 1;

const createFixedExpenseId = () => {
  const uniquePart = globalThis.crypto?.randomUUID?.() || Date.now().toString(36);

  return `fixed-${uniquePart}`;
};

const updateFixedExpensesSummary = () => {
  const total = fixedExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const count = fixedExpenses.length;

  fixedExpensesTotal.textContent = currencyFormatter.format(total);
  fixedExpensesCount.textContent = `${count} ${count === 1 ? "item" : "itens"}`;
};

const createFixedExpenseView = (expense) => {
  const item = document.createElement("article");
  item.className = "expense-item";
  item.dataset.id = expense.id;

  const icon = document.createElement("div");
  icon.className = "icon";
  icon.textContent = expense.icon;

  const info = document.createElement("div");
  info.className = "expense-info";

  const name = document.createElement("h3");
  name.textContent = expense.name;

  const description = document.createElement("p");
  description.textContent = expense.description;

  info.append(name, description);

  const side = document.createElement("div");
  side.className = "expense-side";

  const value = document.createElement("div");
  value.className = "expense-value";
  value.textContent = currencyFormatter.format(expense.amount);

  const actions = document.createElement("div");
  actions.className = "expense-actions";

  const editButton = document.createElement("button");
  editButton.type = "button";
  editButton.className = "expense-action-btn edit-fixed-expense";
  editButton.setAttribute("aria-label", `Editar ${expense.name}`);
  editButton.textContent = "Editar";

  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.className = "expense-action-btn delete-fixed-expense";
  deleteButton.setAttribute("aria-label", `Excluir ${expense.name}`);
  deleteButton.textContent = "Excluir";

  actions.append(editButton, deleteButton);

  side.append(value, actions);
  item.append(icon, info, side);

  return item;
};

const createFixedExpenseForm = (expense, isNew = false) => {
  const item = document.createElement("article");
  item.className = `expense-item is-editing${isNew ? " is-new" : ""}`;
  item.dataset.id = expense.id;

  const form = document.createElement("form");
  form.className = "fixed-expense-form";
  form.dataset.mode = isNew ? "create" : "update";

  form.innerHTML = `
    <label class="fixed-expense-field icon-field">
      <span>Ícone</span>
      <input name="icon" type="text" maxlength="8" value="" required aria-label="Ícone" />
    </label>
    <label class="fixed-expense-field name-field">
      <span>Nome</span>
      <input name="name" type="text" maxlength="60" value="" required />
    </label>
    <label class="fixed-expense-field description-field">
      <span>Descrição</span>
      <input name="description" type="text" maxlength="100" value="" required />
    </label>
    <label class="fixed-expense-field amount-field">
      <span>Valor</span>
      <input name="amount" type="number" min="0" step="0.01" value="" required inputmode="decimal" />
    </label>
    <div class="fixed-expense-form-actions">
      <button type="button" class="fixed-expense-btn cancel-fixed-expense">Cancelar</button>
      <button type="submit" class="fixed-expense-btn save-fixed-expense">${isNew ? "Adicionar" : "Salvar"}</button>
    </div>
  `;

  form.elements.icon.value = expense.icon;
  form.elements.name.value = expense.name;
  form.elements.description.value = expense.description;
  form.elements.amount.value = isNew ? "" : expense.amount.toFixed(2);
  item.appendChild(form);

  requestAnimationFrame(() => form.elements.name.focus());

  return item;
};

const renderFixedExpenses = () => {
  expenseGrid.innerHTML = "";

  if (fixedExpenses.length === 0 && !isAddingFixedExpense) {
    const emptyMessage = document.createElement("div");
    emptyMessage.className = "fixed-expenses-empty";
    emptyMessage.textContent = "Nenhuma despesa fixa cadastrada.";
    expenseGrid.appendChild(emptyMessage);
  } else {
    fixedExpenses.forEach((expense) => {
      const item = expense.id === editingFixedExpenseId
        ? createFixedExpenseForm(expense)
        : createFixedExpenseView(expense);

      expenseGrid.appendChild(item);
    });

    if (isAddingFixedExpense) {
      expenseGrid.appendChild(createFixedExpenseForm({
        id: "",
        icon: "💳",
        name: "",
        description: "",
        amount: 0
      }, true));
    }
  }

  updateFixedExpensesSummary();
};

fixedExpenses = loadFixedExpenses();
renderFixedExpenses();

addFixedExpenseButton.addEventListener("click", () => {
  editingFixedExpenseId = null;
  isAddingFixedExpense = true;
  expenseGrid.classList.remove("is-hidden");
  toggleButton.textContent = "Ocultar";
  renderFixedExpenses();
});

toggleButton.addEventListener("click", () => {
  expenseGrid.classList.toggle("is-hidden");

  toggleButton.textContent = expenseGrid.classList.contains("is-hidden")
    ? "Expandir"
    : "Ocultar";
});

expenseGrid.addEventListener("click", async (event) => {
  const item = event.target.closest(".expense-item");

  if (!item) {
    return;
  }

  if (event.target.closest(".edit-fixed-expense")) {
    editingFixedExpenseId = item.dataset.id;
    isAddingFixedExpense = false;
    renderFixedExpenses();
    return;
  }

  if (event.target.closest(".cancel-fixed-expense")) {
    editingFixedExpenseId = null;
    isAddingFixedExpense = false;
    renderFixedExpenses();
    return;
  }

  if (event.target.closest(".delete-fixed-expense")) {
    const expense = fixedExpenses.find(({ id }) => id === item.dataset.id);
    const shouldDelete = confirm(`Tem certeza que deseja excluir "${expense.name}"?`);

    if (!shouldDelete) {
      return;
    }

    const deleteButton = event.target.closest(".delete-fixed-expense");
    deleteButton.disabled = true;

    try {
      await deleteFixedExpense(item.dataset.id);
      fixedExpenses = fixedExpenses.filter(({ id }) => id !== item.dataset.id);
      editingFixedExpenseId = null;
      persistFixedExpenses();
      renderFixedExpenses();
      showSuccessFeedback("Despesa excluída");
    } catch (error) {
      alert(error.message);
      deleteButton.disabled = false;
    }
  }
});

expenseGrid.addEventListener("submit", async (event) => {
  if (!event.target.matches(".fixed-expense-form")) {
    return;
  }

  event.preventDefault();

  const item = event.target.closest(".expense-item");
  const isCreating = event.target.dataset.mode === "create";
  const formData = new FormData(event.target);
  const updatedExpense = {
    icon: formData.get("icon").trim(),
    name: formData.get("name").trim(),
    description: formData.get("description").trim(),
    amount: Number(formData.get("amount"))
  };

  if (!updatedExpense.icon || !updatedExpense.name || !updatedExpense.description) {
    return;
  }

  if (!Number.isFinite(updatedExpense.amount) || updatedExpense.amount < 0) {
    event.target.elements.amount.focus();
    return;
  }

  const saveButton = event.target.querySelector(".save-fixed-expense");
  saveButton.disabled = true;
  saveButton.textContent = isCreating ? "Adicionando..." : "Salvando...";

  try {
    if (isCreating) {
      const createdExpense = await createFixedExpense({
        id: createFixedExpenseId(),
        ...updatedExpense,
        sort_order: getNextFixedExpenseSortOrder()
      });

      fixedExpenses.push(createdExpense);
      isAddingFixedExpense = false;
    } else {
      await updateFixedExpense(item.dataset.id, updatedExpense);
      fixedExpenses = fixedExpenses.map((expense) => (
        expense.id === item.dataset.id
          ? { ...expense, ...updatedExpense }
          : expense
      ));
    }

    editingFixedExpenseId = null;
    persistFixedExpenses();
    renderFixedExpenses();
    showSuccessFeedback(isCreating ? "Despesa adicionada" : "Alterações salvas");
  } catch (error) {
    alert(error.message);
    saveButton.disabled = false;
    saveButton.textContent = isCreating ? "Adicionar" : "Salvar";
  }
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
const successFeedback = document.getElementById("successFeedback");
let pageScrollY = 0;
let successTimer;

const supabaseHeaders = {
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  "Content-Type": "application/json"
};

const loadFixedExpensesFromDatabase = async () => {
  const query = new URLSearchParams({
    select: "id,icon,name,description,amount,sort_order",
    order: "sort_order.asc"
  });
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${FIXED_EXPENSES_TABLE}?${query}`, {
    headers: supabaseHeaders
  });

  if (!response.ok) {
    throw new Error("Nao foi possivel carregar as despesas fixas do banco.");
  }

  const expenses = await response.json();

  if (!Array.isArray(expenses)) {
    throw new Error("O banco retornou despesas fixas invalidas.");
  }

  fixedExpenses = expenses.map(normalizeFixedExpense);
  persistFixedExpenses();
  renderFixedExpenses();
};

const createFixedExpense = async (expense) => {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${FIXED_EXPENSES_TABLE}`, {
    method: "POST",
    headers: {
      ...supabaseHeaders,
      Prefer: "return=representation"
    },
    body: JSON.stringify(expense)
  });

  if (!response.ok) {
    throw new Error("Nao foi possivel adicionar a despesa fixa.");
  }

  const createdExpenses = await response.json();

  if (!Array.isArray(createdExpenses) || createdExpenses.length !== 1) {
    throw new Error("O banco nao confirmou a nova despesa fixa.");
  }

  return normalizeFixedExpense(createdExpenses[0]);
};

const updateFixedExpense = async (id, expense) => {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${FIXED_EXPENSES_TABLE}?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: {
      ...supabaseHeaders,
      Prefer: "return=minimal"
    },
    body: JSON.stringify({
      ...expense,
      updated_at: new Date().toISOString()
    })
  });

  if (!response.ok) {
    throw new Error("Nao foi possivel salvar a despesa fixa.");
  }
};

const deleteFixedExpense = async (id) => {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${FIXED_EXPENSES_TABLE}?id=eq.${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: {
      ...supabaseHeaders,
      Prefer: "return=minimal"
    }
  });

  if (!response.ok) {
    throw new Error("Nao foi possivel excluir a despesa fixa.");
  }
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
  pageScrollY = window.scrollY;
  document.body.style.top = `-${pageScrollY}px`;
  document.body.classList.add("modal-open");
  expenseDate.value = getTodayInputValue();
  expenseModal.classList.remove("is-hidden");
};

const closeExpenseModal = () => {
  expenseModal.classList.add("is-hidden");
  expenseForm.reset();
  setSaveState(false);
  document.body.classList.remove("modal-open");
  document.body.style.top = "";
  window.scrollTo(0, pageScrollY);
};

const showSuccessFeedback = (message = "Despesa adicionada") => {
  clearTimeout(successTimer);
  successFeedback.querySelector("span").textContent = message;
  successFeedback.classList.remove("is-hidden");
  successFeedback.classList.remove("is-leaving");

  successTimer = setTimeout(() => {
    successFeedback.classList.add("is-leaving");

    setTimeout(() => {
      successFeedback.classList.add("is-hidden");
      successFeedback.classList.remove("is-leaving");
    }, 220);
  }, 1300);
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
  const available = config.budget - total;
  const percentage = Math.round((total / config.budget) * 100);
  const progressWidth = Math.min(percentage, 100);
  const status = getProgressStatus(percentage);
  const availableLabel = used
    .closest(".variable-item")
    .querySelector(".variable-topline p");

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
  availableLabel.textContent = `Total disponível: ${currencyFormatter.format(available)}`;
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
    showSuccessFeedback();
  } catch (error) {
    alert(error.message);
    setSaveState(false);
  }
});

loadVariableExpenses().catch((error) => {
  console.error(error);
});

loadFixedExpensesFromDatabase().catch((error) => {
  console.error(error);
});
