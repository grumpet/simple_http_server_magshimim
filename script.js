const form = document.getElementById("demo-form");
const fullNameInput = document.getElementById("fullName");
const ageInput = document.getElementById("age");
const emailInput = document.getElementById("email");
const phoneInput = document.getElementById("phone");
const birthDateInput = document.getElementById("birthDate");
const subjectSelect = document.getElementById("subject");
const genderInputs = Array.from(document.querySelectorAll('input[name="gender"]'));
const termsCheckbox = document.getElementById("terms");
const submitButtons = document.querySelectorAll(".field-submit");
const statusMessage = document.getElementById("status-message");
const resultCard = document.getElementById("result-card");
const resultOutput = document.getElementById("result-output");

function keepLettersOnly(value) {
  return value.replace(/[^\p{L} ]/gu, "").replace(/\s{2,}/g, " ");
}

function keepNumbersOnly(value) {
  return value.replace(/\D/g, "");
}

function createResultLine(label, value) {
  const line = document.createElement("p");
  updateResultLine(line, label, value);
  return line;
}

function updateResultLine(line, label, value) {
  const strong = document.createElement("strong");
  strong.textContent = `${label}: `;
  line.replaceChildren(strong, document.createTextNode(value));
}

function setResultValue(key, label, value) {
  let line = resultOutput.querySelector(`[data-result-key="${key}"]`);

  if (!line) {
    line = createResultLine(label, value);
    line.dataset.resultKey = key;
    resultOutput.appendChild(line);
  } else {
    updateResultLine(line, label, value);
  }

  resultCard.classList.remove("hidden");
}

async function sendFieldToBackend(key, label, value) {
  const response = await fetch("/submit-field", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      field: key,
      label,
      value,
    }),
  });

  const payload = await response.json();
  if (!response.ok || !payload.ok) {
    throw new Error(payload.message || "Request failed.");
  }

  return payload;
}

function clearGenderValidity() {
  genderInputs.forEach((input) => input.setCustomValidity(""));
}

function validateFullName() {
  fullNameInput.value = keepLettersOnly(fullNameInput.value.trim());

  if (!/^[\p{L} ]{2,}$/u.test(fullNameInput.value)) {
    fullNameInput.setCustomValidity("Full name must contain letters only.");
  } else {
    fullNameInput.setCustomValidity("");
  }

  if (!fullNameInput.reportValidity()) {
    return null;
  }

  return fullNameInput.value;
}

function validateAge() {
  ageInput.value = keepNumbersOnly(ageInput.value);
  const ageValue = Number(ageInput.value);

  if (!ageInput.value || Number.isNaN(ageValue) || ageValue < 1 || ageValue > 120) {
    ageInput.setCustomValidity("Age must be a number between 1 and 120.");
  } else {
    ageInput.setCustomValidity("");
  }

  if (!ageInput.reportValidity()) {
    return null;
  }

  return ageInput.value;
}

function validateEmail() {
  emailInput.value = emailInput.value.trim();
  emailInput.setCustomValidity("");

  if (!emailInput.reportValidity()) {
    return null;
  }

  return emailInput.value;
}

function validatePhone() {
  phoneInput.value = keepNumbersOnly(phoneInput.value);

  if (phoneInput.value.length !== 10) {
    phoneInput.setCustomValidity("Phone number must contain exactly 10 digits.");
  } else {
    phoneInput.setCustomValidity("");
  }

  if (!phoneInput.reportValidity()) {
    return null;
  }

  return phoneInput.value;
}

function validateBirthDate() {
  birthDateInput.setCustomValidity("");

  if (!birthDateInput.reportValidity()) {
    return null;
  }

  return birthDateInput.value;
}

function validateSubject() {
  if (!subjectSelect.value) {
    subjectSelect.setCustomValidity("Please choose a subject.");
  } else {
    subjectSelect.setCustomValidity("");
  }

  if (!subjectSelect.reportValidity()) {
    return null;
  }

  return subjectSelect.selectedOptions[0].textContent;
}

function validateGender() {
  clearGenderValidity();
  const selected = document.querySelector('input[name="gender"]:checked');

  if (!selected) {
    genderInputs[0].setCustomValidity("Please choose a gender.");
    genderInputs[0].reportValidity();
    return null;
  }

  return selected.value;
}

function validateTerms() {
  if (!termsCheckbox.checked) {
    termsCheckbox.setCustomValidity("Please confirm the information above.");
  } else {
    termsCheckbox.setCustomValidity("");
  }

  if (!termsCheckbox.reportValidity()) {
    return null;
  }

  return "Accepted";
}

const fieldConfig = {
  fullName: { label: "Full Name", validate: validateFullName },
  age: { label: "Age", validate: validateAge },
  email: { label: "Email", validate: validateEmail },
  phone: { label: "Phone Number", validate: validatePhone },
  birthDate: { label: "Birth Date", validate: validateBirthDate },
  subject: { label: "Favorite Subject", validate: validateSubject },
  gender: { label: "Gender", validate: validateGender },
  terms: { label: "Confirmation", validate: validateTerms },
};

async function submitSingleField(key, button) {
  const config = fieldConfig[key];
  if (!config) {
    return;
  }

  const value = config.validate();
  if (value === null) {
    statusMessage.textContent = `Please fix the ${config.label.toLowerCase()} field and try again.`;
    return;
  }

  button.disabled = true;
  statusMessage.textContent = `Sending ${config.label.toLowerCase()} to the backend...`;

  try {
    const payload = await sendFieldToBackend(key, config.label, value);
    setResultValue(key, config.label, payload.submission.value);
    statusMessage.textContent = `${config.label} submitted successfully and printed in the backend.`;
  } catch (error) {
    statusMessage.textContent = error instanceof Error
      ? error.message
      : "Could not send the request to the backend.";
  } finally {
    button.disabled = false;
  }
}

fullNameInput.addEventListener("input", () => {
  fullNameInput.value = keepLettersOnly(fullNameInput.value);
  fullNameInput.setCustomValidity("");
});

ageInput.addEventListener("input", () => {
  ageInput.value = keepNumbersOnly(ageInput.value).slice(0, 3);
  ageInput.setCustomValidity("");
});

phoneInput.addEventListener("input", () => {
  phoneInput.value = keepNumbersOnly(phoneInput.value).slice(0, 10);
  phoneInput.setCustomValidity("");
});

emailInput.addEventListener("input", () => {
  emailInput.setCustomValidity("");
});

birthDateInput.addEventListener("input", () => {
  birthDateInput.setCustomValidity("");
});

subjectSelect.addEventListener("change", () => {
  subjectSelect.setCustomValidity("");
});

genderInputs.forEach((input) => {
  input.addEventListener("change", clearGenderValidity);
});

termsCheckbox.addEventListener("change", () => {
  termsCheckbox.setCustomValidity("");
});

submitButtons.forEach((button) => {
  button.addEventListener("click", async () => {
    await submitSingleField(button.dataset.submitKey, button);
  });
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
});

form.addEventListener("reset", () => {
  fullNameInput.setCustomValidity("");
  ageInput.setCustomValidity("");
  emailInput.setCustomValidity("");
  phoneInput.setCustomValidity("");
  birthDateInput.setCustomValidity("");
  subjectSelect.setCustomValidity("");
  termsCheckbox.setCustomValidity("");
  clearGenderValidity();
  statusMessage.textContent = "";
  resultCard.classList.add("hidden");
  resultOutput.replaceChildren();
});
