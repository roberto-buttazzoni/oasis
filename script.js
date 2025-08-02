const urlParams = new URLSearchParams(window.location.search);
const clientId = urlParams.get("client_id");
const endClientId = urlParams.get("end_client_id");
const theme = urlParams.get("theme") || "dark";

document.getElementById("themeStylesheet").href = `themes/${theme}.css`;

const isClient = !!clientId;
const supabaseTableRaw = isClient ? "client_survey_raw" : "end_client_survey_raw";
const supabaseTableResults = isClient ? "client_survey_results" : "end_client_survey_results";
const idField = isClient ? "client_id" : "end_client_id";
const idValue = isClient ? clientId : endClientId;

// UPDATE THIS WITH YOUR FULL TOKEN
const supabaseAuth = "Bearer YOUR_SUPABASE_ANON_KEY";
const supabaseEndpoint = "https://vhamddptyjmhkieiscml.functions.supabase.co/generic_crud";

const container = document.getElementById("formContainer");
let currentStep = 0;
const answers = {};
let formData = null;

// Fetch survey questions dynamically from Supabase
fetch(`${supabaseEndpoint}?table=${supabaseTableRaw}&select=questions,title`, {
  method: "PUT",
  headers: {
    "Authorization": supabaseAuth,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    match: { [idField]: idValue },
    update: {}
  })
})
.then(res => res.json())
.then(data => {
  const survey = data[0];
  if (!survey || !survey.questions) throw new Error("No questions found.");
  formData = {
    title: survey.title || "Customer Survey",
    welcome: "Please answer a few short questions.",
    completion: "Thank you! Your response has been submitted.",
    questions: Object.values(survey.questions)
  };
  renderStep();
})
.catch(err => {
  container.innerHTML = "<h2>Failed to load survey.</h2>";
  console.error("Load error:", err);
});

function renderStep() {
  container.innerHTML = "";

  if (!formData) return;

  if (currentStep === 0) {
    const title = document.createElement("h1");
    title.innerText = formData.title;

    const message = document.createElement("p");
    message.innerText = formData.welcome;

    const nextBtn = document.createElement("button");
    nextBtn.className = "btn";
    nextBtn.innerText = "Start";
    nextBtn.onclick = () => { currentStep++; renderStep(); };

    container.append(title, message, nextBtn);
  } 
  else if (currentStep <= formData.questions.length) {
    const question = formData.questions[currentStep - 1];

    const h2 = document.createElement("h2");
    h2.innerText = question;

    const textarea = document.createElement("textarea");
    textarea.id = "answerInput";
    textarea.value = answers[question] || "";

    const btnRow = document.createElement("div");
    btnRow.className = "button-row";

    const backBtn = document.createElement("button");
    backBtn.className = "btn";
    backBtn.innerText = "Back";
    backBtn.onclick = () => {
      currentStep--;
      renderStep();
    };

    const nextBtn = document.createElement("button");
    nextBtn.className = "btn";
    nextBtn.innerText = currentStep === formData.questions.length ? "Finish" : "Next";
    nextBtn.disabled = textarea.value.trim() === "";

    textarea.oninput = () => {
      nextBtn.disabled = textarea.value.trim() === "";
    };

    nextBtn.onclick = () => {
      answers[question] = textarea.value.trim();
      currentStep++;
      renderStep();
    };

    container.append(h2, textarea);
    btnRow.appendChild(backBtn);
    btnRow.appendChild(nextBtn);
    container.appendChild(btnRow);
  } 
  else {
    const done = document.createElement("h2");
    done.innerText = formData.completion;
    container.appendChild(done);
    submitResults();
  }
}

function submitResults() {
  fetch(`${supabaseEndpoint}?table=${supabaseTableResults}`, {
    method: "PUT",
    headers: {
      "Authorization": supabaseAuth,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      match: { [idField]: idValue },
      update: { results: answers }
    })
  })
  .then(res => res.json())
  .then(data => console.log("Saved:", data))
  .catch(err => console.error("Submit error:", err));
}
