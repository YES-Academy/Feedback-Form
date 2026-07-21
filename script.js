/* ==========================================================
   YES ACADEMY — Student Feedback Form logic
   ========================================================== */

// ---- CONFIG: Google Apps Script Web App URL ----
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxgtHu1xbFWlc3OevkNZjt4nll1K-fNz8sLRsgmdq9UerQe7RvlbBj_ursaEgvEkQBSdA/exec";

// ---- Numeric rating scale ----
const RATING_SCALE = [
  { value: 1, label: "Bad" },
  { value: 2, label: "Average" },
  { value: 3, label: "Good" },
  { value: 4, label: "Very Good" },
  { value: 5, label: "Excellent" }
];

// ---- Rating question sets ----
const RATING_SETS = {
  "PTE Mock Test": [
    { id: "difficulty", label: "Mock Test Difficulty Level" },
    { id: "questionQuality", label: "Mock Test Question Quality" },
    { id: "accuracy", label: "Accuracy of Evaluation" },
    { id: "speakingWriting", label: "Speaking & Writing Feedback Satisfaction" },
    { id: "facility", label: "Equipment Quality & Facility Satisfaction" },
    { id: "comparison", label: "Our Mock Test Compared to Other Institutes" },
    { id: "overall", label: "Overall Satisfaction" }
  ],

  "IELTS Mock Test": [
    { id: "quality", label: "Mock Test Quality" },
    { id: "questionQuality", label: "Mock Test Question Quality" },
    { id: "bandAccuracy", label: "Band Score Accuracy" },
    { id: "speakingWriting", label: "Speaking & Writing Feedback Satisfaction" },
    { id: "facility", label: "Equipment Quality & Facility Satisfaction" },
    { id: "comparison", label: "Our Mock Test Compared to Other Institutes" },
    { id: "overall", label: "Overall Satisfaction" }
  ],

  "Class Experience": [
    { id: "teacherGuidance", label: "Teacher Guidance Satisfaction" },
    { id: "classroomEnvironment", label: "Classroom Environment & Facility" },
    { id: "learningMaterials", label: "Learning Materials (PDFs & Videos)" },
    { id: "overall", label: "Overall Learning Experience" }
  ],

  "Service Experience": [
    { id: "frontOffice", label: "Front Office Behaviour" },
    { id: "admissionProcess", label: "Admission Process" },
    { id: "staffCommunication", label: "Staff Communication" },
    { id: "teacherBehaviour", label: "Teacher Behaviour" },
    { id: "overall", label: "Overall Service Satisfaction" }
  ]
};

// ---- State ----
const ratingValues = {};

// ---- DOM references ----
const courseSelect = document.getElementById("course");
const categorySelect = document.getElementById("category");
const ratingsSection = document.getElementById("section-ratings");
const ratingsContainer = document.getElementById("ratingsContainer");
const suggestionsSection = document.getElementById("section-suggestions");
const suggestionsField = document.getElementById("suggestions");
const charCountEl = document.getElementById("charCount");
const form = document.getElementById("feedbackForm");
const sendBtn = document.getElementById("sendBtn");
const successOverlay = document.getElementById("successOverlay");
const ribbonSteps = document.querySelectorAll(".ribbon-step");
const batchWrap = document.getElementById("batchWrap");

document.getElementById("year").textContent = new Date().getFullYear();

// ----------------------------

function buildRatingGroup(question) {

  const wrap = document.createElement("div");
  wrap.className = "rating-group";
  wrap.dataset.qid = question.id;

  const labelRow = document.createElement("div");
  labelRow.className = "rating-group-label";
  labelRow.innerHTML =
    `<span>${question.label}</span><i class="bi bi-check-circle-fill status-icon"></i>`;

  const numericRow = document.createElement("div");
  numericRow.className = "numeric-row";
  numericRow.setAttribute("role", "radiogroup");

  RATING_SCALE.forEach(({ value, label }) => {

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "numeric-btn";
    btn.dataset.value = value;

    btn.innerHTML =
      `<span class="numeric-number">${value}</span>
       <span class="numeric-text">${label}</span>`;

    btn.addEventListener("click", () => {

      ratingValues[question.id] = value;

      [...numericRow.children].forEach(b => {
        b.classList.toggle(
          "selected",
          Number(b.dataset.value) === value
        );
      });

      labelRow.querySelector(".status-icon").classList.add("show");

      checkRatingsComplete();

    });

    numericRow.appendChild(btn);

  });

  wrap.appendChild(labelRow);
  wrap.appendChild(numericRow);

  return wrap;
}

// ----------------------------

function renderRatings(category) {

  ratingsContainer.innerHTML = "";

  Object.keys(ratingValues).forEach(k => delete ratingValues[k]);

  const questions = RATING_SETS[category] || [];

  questions.forEach(q => {
    ratingsContainer.appendChild(buildRatingGroup(q));
  });

  const hasQuestions = questions.length > 0;

  ratingsSection.hidden = !hasQuestions;
  suggestionsSection.hidden = !hasQuestions;

  if (hasQuestions) setActiveStep(2);

}

function checkRatingsComplete() {

  const questions = RATING_SETS[categorySelect.value] || [];

  if (Object.keys(ratingValues).length === questions.length) {

    setActiveStep(3);

  }

}

function setActiveStep(stepNum) {

  ribbonSteps.forEach(step => {

    const n = Number(step.dataset.step);

    step.classList.remove("active", "done");

    if (n < stepNum) step.classList.add("done");

    if (n === stepNum) step.classList.add("active");

  });

}

categorySelect.addEventListener("change", () => {
  renderRatings(categorySelect.value);
});

function checkBasicsComplete() {

  batchWrap.hidden = !courseSelect.value;

  if (courseSelect.value && categorySelect.value) {

    setActiveStep(2);

  }

}

courseSelect.addEventListener("change", checkBasicsComplete);

suggestionsField.addEventListener("input", () => {

  charCountEl.textContent = suggestionsField.value.length;

});

function ratingText(value) {

  const r = RATING_SCALE.find(x => x.value === value);

  return r ? `${r.value} - ${r.label}` : "";

}

function buildPayload() {

  const ratingsData = {};

  const questions = RATING_SETS[categorySelect.value] || [];

  questions.forEach(q => {

    ratingsData[q.label] = ratingText(ratingValues[q.id]);

  });

  return {

    name:
      document.getElementById("studentName").value.trim() || "",

    course:
      courseSelect.value,

    batchNumber:
      document.getElementById("batchNumber").value.trim(),

    category:
      categorySelect.value,

    ratingsData:
      JSON.stringify(ratingsData),

    suggestions:
      suggestionsField.value.trim(),

    submittedAt:
      new Date().toISOString()

  };

}

function validateForm() {

  let valid = true;

  if (!courseSelect.value) {

    courseSelect.classList.add("is-invalid");

    valid = false;

  } else {

    courseSelect.classList.remove("is-invalid");

  }

  if (!categorySelect.value) {

    categorySelect.classList.add("is-invalid");

    valid = false;

  } else {

    categorySelect.classList.remove("is-invalid");

  }

  const questions = RATING_SETS[categorySelect.value] || [];

  if (Object.keys(ratingValues).length !== questions.length) {

    valid = false;

    alert("Please answer every rating question.");

  }

  return valid;

}

function resetForm() {

  form.reset();

  ratingsContainer.innerHTML = "";

  ratingsSection.hidden = true;

  suggestionsSection.hidden = true;

  batchWrap.hidden = true;

  charCountEl.textContent = "0";

  Object.keys(ratingValues).forEach(k => delete ratingValues[k]);

  setActiveStep(1);

}

// ----------------------------
// Submit
// ----------------------------

form.addEventListener("submit", async function(e){

  e.preventDefault();

  if(!validateForm()) return;

  sendBtn.disabled = true;

  sendBtn.innerHTML =
  `<i class="bi bi-hourglass-split"></i> Sending...`;

  const payload = buildPayload();

  try{

      const response = await fetch(SCRIPT_URL,{

          method:"POST",

          body:JSON.stringify(payload),

          headers:{
              "Content-Type":"application/json"
          }

      });

      const result = await response.json();

      if(result.success){

          successOverlay.classList.add("show");

          setTimeout(()=>{

              successOverlay.classList.remove("show");

              resetForm();

          },2200);

      }else{

          alert("Submission failed.");

      }

  }catch(err){

      console.error(err);

      alert("Network Error");

  }

  sendBtn.disabled=false;

  sendBtn.innerHTML=
  `<i class="bi bi-send-check"></i> Submit`;

});

// ----------------------------
// Loader
// ----------------------------

window.addEventListener("load", function(){

    const loader=document.getElementById("pageLoader");

    if(loader){

        setTimeout(function(){

            loader.classList.add("loaded");

        },600);

    }

});
