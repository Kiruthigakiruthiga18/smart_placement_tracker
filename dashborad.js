// =========================
// Keys & Helpers
// =========================
const USER_KEY = "spt-user";
const PROFILE_KEY = "spt-profile";
const SKILLS_KEY = "spt-skills";
const ASSESS_KEY = "spt-assessments";
const RESUME_KEY = "spt-resume";
const JOBS_KEY = "spt-jobs";
const APPS_KEY = "spt-applications";
const INTS_KEY = "spt-interviews";
const ROADMAP_KEY = "spt-roadmap";
const GOALS_KEY = "spt-goals";
const NOTIF_KEY = "spt-notifications";
const SETTINGS_KEY = "spt-settings";

function getJSON(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}
function setJSON(key, val) {
  localStorage.setItem(key, JSON.stringify(val));
}
function normalizeSkills(str) {
  return (str || "")
    .toLowerCase()
    .split(",")
    .map(s => s.trim())
    .filter(Boolean);
}

// =========================
// Auth Guard
// =========================
(function authGuard() {
  const user = getJSON(USER_KEY, null);

  if (!user || !user.loggedIn) {
    window.location.href = "index.html";
    return;
  }

  const displayName =
    user.name ||
    user.fullName ||
    user.username ||
    (user.email ? user.email.split("@")[0] : "Student");

  const userNameEl = document.getElementById("userName");
  const welcomeTextEl = document.getElementById("welcomeText");

  if (userNameEl) {
    userNameEl.textContent = displayName;
  }

  if (welcomeTextEl) {
    welcomeTextEl.textContent = `Welcome, ${displayName}`;
  }
})();

// =========================
// Navigation
// =========================
const navItems = document.querySelectorAll(".nav-item[data-section]");
const sections = document.querySelectorAll(".section");
const pageTitle = document.getElementById("pageTitle");

function showSection(id) {
  sections.forEach(sec => sec.classList.remove("active"));
  const target = document.getElementById("section-" + id);
  if (target) target.classList.add("active");
  navItems.forEach(item => {
    item.classList.toggle("active", item.getAttribute("data-section") === id);
  });
  const labelMap = {
    overview: "Dashboard",
    profile: "My Profile",
    skills: "Skills",
    assessment: "Skill Assessment",
    resume: "Resume",
    jobs: "Job Recommendations",
    applications: "Applications",
    interviews: "Interview Tracker",
    roadmap: "Preparation Roadmap",
    goals: "Goals",
    notifications: "Notifications",
    analytics: "Analytics",
    settings: "Settings"
  };
  pageTitle.textContent = labelMap[id] || "Dashboard";
  // Refresh dynamic data when entering sections
  if (id === "overview") renderOverview();
  if (id === "profile") loadProfile();
  if (id === "skills") renderSkills();
  if (id === "jobs") renderJobs();
  if (id === "applications") renderApplications();
  if (id === "interviews") renderInterviews();
  if (id === "roadmap") renderRoadmap();
  if (id === "goals") renderGoals();
  if (id === "notifications") renderNotifications();
  if (id === "analytics") renderAnalytics();
}

navItems.forEach(item => {
  item.addEventListener("click", (e) => {
    e.preventDefault();
    const sec = item.getAttribute("data-section");
    if (sec === "logout") {
      doLogout();
      return;
    }
    showSection(sec);
  });
});

// Quick action buttons in overview
document.querySelectorAll("[data-nav]").forEach(btn => {
  btn.addEventListener("click", () => {
    const sec = btn.getAttribute("data-nav");
    showSection(sec);
  });
});

// Sidebar responsive
const sidebar = document.getElementById("sidebar");
const hamburgerBtn = document.getElementById("hamburgerBtn");
const topHamburgerBtn = document.getElementById("topHamburgerBtn");

function toggleSidebar() {
  sidebar.classList.toggle("open");
}
hamburgerBtn?.addEventListener("click", toggleSidebar);
topHamburgerBtn?.addEventListener("click", toggleSidebar);
document.addEventListener("click", (e) => {
  if (window.innerWidth <= 900 &&
      sidebar.classList.contains("open") &&
      !sidebar.contains(e.target) &&
      !hamburgerBtn?.contains(e.target) &&
      !topHamburgerBtn?.contains(e.target)) {
    sidebar.classList.remove("open");
  }
});

// =========================
// Overview
// =========================
function renderOverview() {
  const profile = getJSON(PROFILE_KEY, {});
  const skills = getJSON(SKILLS_KEY, []);
  const apps = getJSON(APPS_KEY, []);
  const ints = getJSON(INTS_KEY, []);
  const roadmap = getJSON(ROADMAP_KEY, getDefaultRoadmap());

  // Profile completion
  const pfCompletion = computeProfileCompletion(profile);
  document.getElementById("ovProfileCompletion").textContent = pfCompletion + "%";

  // Skills completed (example: count skills with Advanced/Expert)
  const skilled = skills.filter(s => ["Advanced","Expert"].includes(s.level)).length;
  const totalSkills = skills.length || 1;
  document.getElementById("ovSkillsCompleted").textContent = `${skilled}/${totalSkills}`;

  // Applications
  const appliedCount = apps.length;
  document.getElementById("ovJobsApplied").textContent = appliedCount;

  // Interviews
  const interviewCount = ints.length;
  document.getElementById("ovInterviews").textContent = interviewCount;

  // Shortlisted
  const shortlisted = apps.filter(a => a.status === "Shortlisted").length;
  document.getElementById("ovShortlisted").textContent = shortlisted;

  // Placement readiness (simple heuristic)
  const readiness = computePlacementReadiness(profile, skills, apps, ints, roadmap);
  document.getElementById("ovPlacementReadiness").textContent = readiness + "%";

  // Prep progress from roadmap
  const rmProgress = computeRoadmapProgress(roadmap);
  document.getElementById("ovPrepProgress").textContent = rmProgress + "%";

  updateNotifPill();
}
navItems.forEach(item => {
  item.addEventListener("click", e => {
    e.preventDefault();

    const sec = item.getAttribute("data-section");

    if (sec === "logout") {
      doLogout();
      return;
    }

    showSection(sec);
  });
});
// =========================
// Profile Module
// =========================
const profileForm = document.getElementById("profileForm");
const pfMsg = document.getElementById("pfMsg");
const pfProgressFill = document.getElementById("pfProgressFill");
const pfProgressText = document.getElementById("pfProgressText");

const pfFields = [
  "pfName","pfEmail","pfPhone","pfCollege","pfDegree","pfDept",
  "pfYear","pfCgpa","pfLocation","pfObjective","pfGithub","pfLinkedin","pfPortfolio"
];

function computeProfileCompletion(profile) {
  const keys = [
    "name","email","phone","college","degree","department",
    "gradYear","cgpa","location","objective","github","linkedin","portfolio"
  ];
  let filled = 0;
  keys.forEach(k => {
    const v = profile[k];
    if (v !== undefined && v !== null && String(v).trim() !== "") filled++;
  });
  return Math.round((filled / keys.length) * 100);
}

function loadProfile() {
  const p = getJSON(PROFILE_KEY, {});
  document.getElementById("pfName").value = p.name || "";
  document.getElementById("pfEmail").value = p.email || "";
  document.getElementById("pfPhone").value = p.phone || "";
  document.getElementById("pfCollege").value = p.college || "";
  document.getElementById("pfDegree").value = p.degree || "";
  document.getElementById("pfDept").value = p.department || "";
  document.getElementById("pfYear").value = p.gradYear || "";
  document.getElementById("pfCgpa").value = p.cgpa || "";
  document.getElementById("pfLocation").value = p.location || "";
  document.getElementById("pfObjective").value = p.objective || "";
  document.getElementById("pfGithub").value = p.github || "";
  document.getElementById("pfLinkedin").value = p.linkedin || "";
  document.getElementById("pfPortfolio").value = p.portfolio || "";

  const comp = computeProfileCompletion(p);
  pfProgressFill.style.width = comp + "%";
  pfProgressText.textContent = comp + "%";
}

profileForm?.addEventListener("submit", (e) => {
  e.preventDefault();
  const p = {
    name: document.getElementById("pfName").value.trim(),
    email: document.getElementById("pfEmail").value.trim(),
    phone: document.getElementById("pfPhone").value.trim(),
    college: document.getElementById("pfCollege").value.trim(),
    degree: document.getElementById("pfDegree").value.trim(),
    department: document.getElementById("pfDept").value.trim(),
    gradYear: document.getElementById("pfYear").value.trim(),
    cgpa: document.getElementById("pfCgpa").value.trim(),
    location: document.getElementById("pfLocation").value.trim(),
    objective: document.getElementById("pfObjective").value.trim(),
    github: document.getElementById("pfGithub").value.trim(),
    linkedin: document.getElementById("pfLinkedin").value.trim(),
    portfolio: document.getElementById("pfPortfolio").value.trim()
  };
  setJSON(PROFILE_KEY, p);
  pfMsg.textContent = "Profile saved!";
  const comp = computeProfileCompletion(p);
  pfProgressFill.style.width = comp + "%";
  pfProgressText.textContent = comp + "%";
  addNotification(`Your profile is now ${comp}% complete.`);
  renderOverview();
});

// =========================
// Skills Module
// =========================
const skCategory = document.getElementById("skCategory");
const skName = document.getElementById("skName");
const skLevel = document.getElementById("skLevel");
const skAddBtn = document.getElementById("skAddBtn");
const skillsList = document.getElementById("skillsList");

function renderSkills() {
  const skills = getJSON(SKILLS_KEY, []);
  skillsList.innerHTML = "";
  if (skills.length === 0) {
    skillsList.innerHTML = '<div class="muted">No skills added yet. Add your first skill above.</div>';
    return;
  }
  skills.forEach((s, idx) => {
    const card = document.createElement("div");
    card.className = "skill-card";
    card.innerHTML = `
      <div class="skill-header">
        <div>
          <div class="skill-name">${s.name} <span class="tag">${s.category}</span></div>
          <div class="skill-meta">Level: ${s.level}</div>
        </div>
        <div class="skill-actions">
          <button class="btn-outline" data-edit="${idx}">Edit</button>
          <button class="btn-outline" data-del="${idx}">Delete</button>
        </div>
      </div>
      <div class="progress-wrap">
        <div class="progress-bar"><div class="progress-fill" style="width:${levelToPercent(s.level)}%"></div></div>
        <div class="muted">${levelToPercent(s.level)}%</div>
      </div>
    `;
    skillsList.appendChild(card);
  });

  skillsList.querySelectorAll("[data-edit]").forEach(btn => {
    btn.addEventListener("click", () => {
      const idx = +btn.getAttribute("data-edit");
      const skills = getJSON(SKILLS_KEY, []);
      const s = skills[idx];
      skCategory.value = s.category;
      skName.value = s.name;
      skLevel.value = s.level;
      // delete old then user can add edited
      skills.splice(idx, 1);
      setJSON(SKILLS_KEY, skills);
      renderSkills();
    });
  });
  skillsList.querySelectorAll("[data-del]").forEach(btn => {
    btn.addEventListener("click", () => {
      const idx = +btn.getAttribute("data-del");
      const skills = getJSON(SKILLS_KEY, []);
      skills.splice(idx, 1);
      setJSON(SKILLS_KEY, skills);
      renderSkills();
      renderOverview();
    });
  });
}

function levelToPercent(level) {
  switch(level) {
    case "Beginner": return 25;
    case "Intermediate": return 50;
    case "Advanced": return 75;
    case "Expert": return 100;
    default: return 0;
  }
}

skAddBtn?.addEventListener("click", () => {
  const category = skCategory.value;
  const name = skName.value.trim();
  const level = skLevel.value;
  if (!name) {
    alert("Enter a skill name.");
    return;
  }
  const skills = getJSON(SKILLS_KEY, []);
  // avoid duplicate same name+category
  const exists = skills.some(s => s.name.toLowerCase() === name.toLowerCase() && s.category === category);
  if (exists) {
    alert("This skill already exists.");
    return;
  }
  skills.push({ name, category, level });
  setJSON(SKILLS_KEY, skills);
  skName.value = "";
  renderSkills();
  renderOverview();
  addNotification("New skill added: " + name);
});

// =========================
// Assessment Module (Demo)
// =========================
const asSubject = document.getElementById("asSubject");
const asStartBtn = document.getElementById("asStartBtn");
const asArea = document.getElementById("asArea");
const asQNum = document.getElementById("asQNum");
const asQTotal = document.getElementById("asQTotal");
const asTimer = document.getElementById("asTimer");
const asQuestionText = document.getElementById("asQuestionText");
const asOptions = document.getElementById("asOptions");
const asPrevBtn = document.getElementById("asPrevBtn");
const asNextBtn = document.getElementById("asNextBtn");
const asSubmitBtn = document.getElementById("asSubmitBtn");
const asResult = document.getElementById("asResult");

const questionBank = {
  Java: [
    { q: "Which is not a primitive type in Java?", opts: ["int","boolean","String","char"], a: 2 },
    { q: "Keyword to inherit a class?", opts: ["extends","implements","inherits","uses"], a: 0 },
    { q: "Default value of boolean?", opts: ["true","false","null","0"], a: 1 },
    { q: "Collection that allows duplicates?", opts: ["Set","List","Map","Queue"], a: 1 },
    { q: "Access modifier visible within same package?", opts: ["private","protected","public","default"], a: 3 }
  ],
  Python: [
    { q: "Mutable data structure?", opts: ["tuple","list","str","int"], a: 1 },
    { q: "Keyword to define function?", opts: ["func","def","function","lambda"], a: 1 },
    { q: "Output of len('hello')?", opts: ["4","5","6","hello"], a: 1 },
    { q: "Used for OOP?", opts: ["class","struct","interface","enum"], a: 0 },
    { q: "Package manager?", opts: ["npm","pip","gem","maven"], a: 1 }
  ],
  SQL: [
    { q: "Command to fetch data?", opts: ["GET","FETCH","SELECT","READ"], a: 2 },
    { q: "JOIN that returns only matching rows?", opts: ["INNER JOIN","LEFT JOIN","RIGHT JOIN","FULL JOIN"], a: 0 },
    { q: "Clause to filter groups?", opts: ["WHERE","HAVING","ORDER BY","GROUP"], a: 1 },
    { q: "Key that uniquely identifies row?", opts: ["Foreign Key","Primary Key","Candidate Key","Super Key"], a: 1 },
    { q: "DDL command?", opts: ["INSERT","UPDATE","CREATE","DELETE"], a: 2 }
  ],
  JavaScript: [
    { q: "Not a data type?", opts: ["number","boolean","array","string"], a: 2 },
    { q: "Keyword for constant?", opts: ["var","let","const","fixed"], a: 2 },
    { q: "Event loop belongs to?", opts: ["Engine","Runtime","Heap","Stack"], a: 1 },
    { q: "Promise state?", opts: ["Pending","Waiting","Holding","Paused"], a: 0 },
    { q: "Array method to transform elements?", opts: ["map","filter","reduce","every"], a: 0 }
  ],
  "HTML/CSS": [
    { q: "Tag for largest heading?", opts: ["<h6>","<head>","<h1>","<header>"], a: 2 },
    { q: "CSS property for text color?", opts: ["font-color","text-color","color","background"], a: 2 },
    { q: "Box model does NOT include?", opts: ["Margin","Border","Padding","Gradient"], a: 3 },
    { q: "Inline element?", opts: ["div","p","span","section"], a: 2 },
    { q: "Selector with highest specificity?", opts: [".class","#id","element","*"], a: 1 }
  ],
  DBMS: [
    { q: "Normal form for transitive dependency removal?", opts: ["1NF","2NF","3NF","BCNF"], a: 2 },
    { q: "ACID stands for?", opts: ["Atomicity, Consistency, Isolation, Durability","Accuracy, Consistency, Integrity, Durability","Atomicity, Clarity, Isolation, Durability","Atomicity, Consistency, Integrity, Dependency"], a: 0 },
    { q: "Not a DBMS?", opts: ["MySQL","MongoDB","Oracle","Excel"], a: 3 },
    { q: "Schema defines?", opts: ["Data","Structure","Queries","Users"], a: 1 },
    { q: "Transaction ends with?", opts: ["START","COMMIT","BEGIN","OPEN"], a: 1 }
  ],
  Aptitude: [
    { q: "2 + 2 × 2 = ?", opts: ["6","8","4","10"], a: 0 },
    { q: "Next: 2,4,8,16,...", opts: ["24","32","20","30"], a: 1 },
    { q: "20% of 150?", opts: ["25","30","35","40"], a: 1 },
    { q: "Train 60 km/h, distance in 2h?", opts: ["100","120","140","160"], a: 1 },
    { q: "Odd one out?", opts: ["Square","Rectangle","Circle","Triangle"], a: 2 }
  ]
};

let currentAssessment = null;

asStartBtn?.addEventListener("click", () => {
  const subject = asSubject.value;
  const qs = questionBank[subject] || [];
  if (qs.length === 0) {
    alert("No questions for this subject.");
    return;
  }
  currentAssessment = {
    subject,
    questions: qs,
    answers: new Array(qs.length).fill(null),
    index: 0,
    startTime: Date.now(),
    timerId: null
  };
  asArea.style.display = "block";
  asResult.style.display = "none";
  asQTotal.textContent = qs.length;
  startTimer();
  showQuestion(0);
});

function startTimer() {
  clearInterval(currentAssessment.timerId);
  currentAssessment.timerId = setInterval(() => {
    const sec = Math.floor((Date.now() - currentAssessment.startTime)/1000);
    const m = String(Math.floor(sec/60)).padStart(2,"0");
    const s = String(sec%60).padStart(2,"0");
    asTimer.textContent = `${m}:${s}`;
  }, 1000);
}

function showQuestion(idx) {
  const a = currentAssessment;
  const q = a.questions[idx];
  a.index = idx;
  asQNum.textContent = idx+1;
  asQuestionText.textContent = q.q;
  asOptions.innerHTML = "";
  q.opts.forEach((opt, i) => {
    const div = document.createElement("div");
    div.className = "as-option" + (a.answers[idx] === i ? " selected" : "");
    div.textContent = opt;
    div.addEventListener("click", () => {
      a.answers[idx] = i;
      Array.from(asOptions.children).forEach((c, j) => {
        c.classList.toggle("selected", j === i);
      });
    });
    asOptions.appendChild(div);
  });
  asPrevBtn.disabled = idx === 0;
  asNextBtn.style.display = idx === a.questions.length-1 ? "none" : "inline-block";
  asSubmitBtn.style.display = idx === a.questions.length-1 ? "inline-block" : "none";
}

asPrevBtn?.addEventListener("click", () => {
  if (currentAssessment.index > 0) showQuestion(currentAssessment.index - 1);
});
asNextBtn?.addEventListener("click", () => {
  if (currentAssessment.index < currentAssessment.questions.length - 1)
    showQuestion(currentAssessment.index + 1);
});

asSubmitBtn?.addEventListener("click", () => {
  clearInterval(currentAssessment.timerId);
  const a = currentAssessment;
  let correct = 0;
  a.questions.forEach((q, i) => {
    if (a.answers[i] === q.a) correct++;
  });
  const total = a.questions.length;
  const pct = Math.round((correct/total)*100);
  let perf = "Average";
  if (pct >= 80) perf = "Strong";
  else if (pct >= 60) perf = "Good";
  else if (pct >= 40) perf = "Moderate";
  else perf = "Needs Improvement";

  const recs = getAssessmentRecommendations(a.subject, pct);

  asResult.style.display = "block";
  asResult.innerHTML = `
    <div><strong>Subject:</strong> ${a.subject}</div>
    <div><strong>Score:</strong> ${correct}/${total} (${pct}%)</div>
    <div><strong>Performance:</strong> ${perf}</div>
    <div style="margin-top:0.5rem;"><strong>Recommendations:</strong></div>
    <ul>${recs.map(r => `<li>${r}</li>`).join("")}</ul>
  `;

  // Save assessment result
  const assessments = getJSON(ASSESS_KEY, []);
  assessments.push({ subject, score: correct, total, percent: pct, date: new Date().toISOString() });
  setJSON(ASSESS_KEY, assessments);

  addNotification(`Assessment completed: ${subject} – ${pct}%`);
  renderOverview();
});

function getAssessmentRecommendations(subject, pct) {
  if (subject === "Java") {
    if (pct < 60) return ["Revise OOP concepts", "Practice collections and exceptions"];
    if (pct < 80) return ["Practice multithreading", "Work on streams and lambdas"];
    return ["Focus on advanced concurrency", "Solve real-world design problems"];
  }
  if (subject === "SQL") {
    if (pct < 60) return ["Practice basic SELECT/WHERE", "Learn JOINs thoroughly"];
    if (pct < 80) return ["Practice subqueries", "Study indexing and normalization"];
    return ["Advanced query optimization", "Window functions and CTEs"];
  }
  if (pct < 60) return ["Strengthen fundamentals", "Solve more basic problems"];
  if (pct < 80) return ["Practice medium-level problems", "Focus on weak topics"];
  return ["Attempt advanced problems", "Take mock tests regularly"];
}

// =========================
// Resume Module
// =========================
const rsUseProfileBtn = document.getElementById("rsUseProfileBtn");
const rsPreviewBtn = document.getElementById("rsPreviewBtn");
const rsPrintBtn = document.getElementById("rsPrintBtn");
const resumePreview = document.getElementById("resumePreview");

rsUseProfileBtn?.addEventListener("click", () => {
  const p = getJSON(PROFILE_KEY, {});
  const skills = getJSON(SKILLS_KEY, []);
  const resumeData = {
    name: p.name || "Your Name",
    email: p.email || "",
    phone: p.phone || "",
    location: p.location || "",
    objective: p.objective || "",
    education: `${p.degree || ""} in ${p.department || ""}, ${p.college || ""}, ${p.gradYear || ""}`,
    cgpa: p.cgpa || "",
    skills: skills.map(s => `${s.name} (${s.level})`),
    projects: [],
    certifications: []
  };
  setJSON(RESUME_KEY, resumeData);
  alert("Resume data created from profile. Click 'Preview Resume'.");
});

rsPreviewBtn?.addEventListener("click", () => {
  const r = getJSON(RESUME_KEY, {});
  const skillsHtml = (r.skills || []).map(s => `<li>${s}</li>`).join("");
  const projHtml = (r.projects || []).map(p => `<li><strong>${p.title}</strong> – ${p.desc}</li>`).join("") || "<li>No projects added.</li>";
  const certHtml = (r.certifications || []).map(c => `<li>${c}</li>`).join("") || "<li>No certifications added.</li>";

  resumePreview.innerHTML = `
    <div style="text-align:center;">
      <h2 style="margin:0;">${r.name || "Your Name"}</h2>
      <div class="muted">${r.email || ""} | ${r.phone || ""} | ${r.location || ""}</div>
    </div>
    <h3>Objective</h3>
    <div>${r.objective || "Objective not provided."}</div>
    <h3>Education</h3>
    <div>${r.education || ""} ${r.cgpa ? "(CGPA: " + r.cgpa + ")" : ""}</div>
    <h3>Skills</h3>
    <ul>${skillsHtml || "<li>No skills added.</li>"}</ul>
    <h3>Projects</h3>
    <ul>${projHtml}</ul>
    <h3>Certifications</h3>
    <ul>${certHtml}</ul>
  `;
});

rsPrintBtn?.addEventListener("click", () => {
  window.print();
});

// =========================
// Jobs Module + Smart Matching
// =========================
const jobSearch = document.getElementById("jobSearch");
const jobLocationFilter = document.getElementById("jobLocationFilter");
const jobsList = document.getElementById("jobsList");

// Demo jobs
function getDefaultJobs() {
  return [
    {
      id: 1,
      company: "ABC Tech",
      role: "Backend Developer",
      location: "Chennai",
      mode: "Hybrid",
      skills: ["Java","SQL","Spring Boot","REST API"],
      salary: "4–6 LPA",
      exp: "0–1 yrs"
    },
    {
      id: 2,
      company: "XYZ Solutions",
      role: "Frontend Developer",
      location: "Bangalore",
      mode: "Remote",
      skills: ["HTML","CSS","JavaScript","React"],
      salary: "3.5–5 LPA",
      exp: "0–1 yrs"
    },
    {
      id: 3,
      company: "DataWorks",
      role: "Data Analyst",
      location: "Coimbatore",
      mode: "On-site",
      skills: ["Python","SQL","Power BI","Excel"],
      salary: "3–4.5 LPA",
      exp: "Fresher"
    },
    {
      id: 4,
      company: "CloudNine",
      role: "Full Stack Developer",
      location: "Remote",
      mode: "Remote",
      skills: ["JavaScript","Node.js","React","MongoDB"],
      salary: "5–8 LPA",
      exp: "1–2 yrs"
    }
  ];
}

function computeMatchPercent(jobReqSkills, studentSkills) {
  if (studentSkills.length === 0) return 0;
  const req = jobReqSkills.map(s => s.toLowerCase());
  const matched = req.filter(s => studentSkills.includes(s)).length;
  return Math.round((matched / req.length) * 100);
}

function getSkillGaps(jobReqSkills, studentSkills) {
  const req = jobReqSkills.map(s => s.toLowerCase());
  return req.filter(s => !studentSkills.includes(s));
}

function renderJobs() {
  const jobs = getJSON(JOBS_KEY, getDefaultJobs());
  const profile = getJSON(PROFILE_KEY, {});
  const skills = getJSON(SKILLS_KEY, []);
  const studentSkills = [
    ...(profile.department ? [profile.department.toLowerCase()] : []),
    ...skills.map(s => s.name.toLowerCase())
  ];

  const term = (jobSearch?.value || "").toLowerCase();
  const loc = jobLocationFilter?.value || "";

  jobsList.innerHTML = "";
  const filtered = jobs.filter(j => {
    const matchTerm = !term ||
      j.company.toLowerCase().includes(term) ||
      j.role.toLowerCase().includes(term);
    const matchLoc = !loc || j.location === loc;
    return matchTerm && matchLoc;
  });

  if (filtered.length === 0) {
    jobsList.innerHTML = '<div class="muted">No matching jobs found.</div>';
    return;
  }

  filtered.forEach(j => {
    const matchPct = computeMatchPercent(j.skills, studentSkills);
    const gaps = getSkillGaps(j.skills, studentSkills);
    const card = document.createElement("div");
    card.className = "job-card";
    const skillsHtml = j.skills.map(s => `<span class="tag">${s}</span>`).join("");
    const gapsHtml = gaps.length ?
      `<div class="muted" style="margin-top:0.4rem;"><strong>Skill gap:</strong> ${gaps.join(", ")}</div>` : "";

    card.innerHTML = `
      <h3>${j.role} – ${j.company}</h3>
      <div class="muted">${j.location} | ${j.mode} | ${j.salary} | ${j.exp}</div>
      <div style="margin:0.4rem 0;">${skillsHtml}</div>
      <div class="muted">Match: <strong>${matchPct}%</strong></div>
      ${gapsHtml}
      <div style="margin-top:0.5rem;">
        <button class="btn-primary" data-apply="${j.id}">Apply</button>
      </div>
    `;
    jobsList.appendChild(card);
  });

  jobsList.querySelectorAll("[data-apply]").forEach(btn => {
    btn.addEventListener("click", () => {
      const jobId = +btn.getAttribute("data-apply");
      const job = jobs.find(j => j.id === jobId);
      if (!job) return;
      const apps = getJSON(APPS_KEY, []);
      const exists = apps.some(a => a.company === job.company && a.role === job.role);
      if (exists) {
        alert("You already applied to this job.");
        return;
      }
      apps.push({
        company: job.company,
        role: job.role,
        date: new Date().toISOString().slice(0,10),
        status: "Applied",
        notes: ""
      });
      setJSON(APPS_KEY, apps);
      addNotification(`Applied to ${job.role} at ${job.company}`);
      renderOverview();
      alert("Application added! Check the Applications tab.");
    });
  });

  jobSearch?.addEventListener("input", renderJobs);
  jobLocationFilter?.addEventListener("change", renderJobs);
}

// =========================
// Applications Module
// =========================
const appCompany = document.getElementById("appCompany");
const appRole = document.getElementById("appRole");
const appDate = document.getElementById("appDate");
const appStatus = document.getElementById("appStatus");
const appAddBtn = document.getElementById("appAddBtn");
const appFilterStatus = document.getElementById("appFilterStatus");
const appList = document.getElementById("appList");
const appStats = document.getElementById("appStats");

function renderApplications() {
  const apps = getJSON(APPS_KEY, []);
  const filter = appFilterStatus?.value || "";
  const filtered = filter ? apps.filter(a => a.status === filter) : apps;

  appList.innerHTML = "";
  if (filtered.length === 0) {
    appList.innerHTML = '<div class="muted">No applications found.</div>';
  } else {
    filtered.forEach((a, idx) => {
      const card = document.createElement("div");
      card.className = "app-card";
      const badgeClass = statusToClass(a.status);
      card.innerHTML = `
        <h3>${a.role} – ${a.company}</h3>
        <div class="muted">Applied: ${a.date} | Status: <span class="status-badge ${badgeClass}">${a.status}</span></div>
        <div class="form-inline" style="margin-top:0.4rem;">
          <select data-idx="${apps.indexOf(a)}" class="app-status-change">
            <option ${a.status==="Applied"?"selected":""}>Applied</option>
            <option ${a.status==="Under Review"?"selected":""}>Under Review</option>
            <option ${a.status==="Shortlisted"?"selected":""}>Shortlisted</option>
            <option ${a.status==="Interview"?"selected":""}>Interview</option>
            <option ${a.status==="Selected"?"selected":""}>Selected</option>
            <option ${a.status==="Rejected"?"selected":""}>Rejected</option>
          </select>
          <button class="btn-outline" data-del-app="${apps.indexOf(a)}">Delete</button>
        </div>
      `;
      appList.appendChild(card);
    });
  }

  appList.querySelectorAll(".app-status-change").forEach(sel => {
    sel.addEventListener("change", () => {
      const idx = +sel.getAttribute("data-idx");
      const apps = getJSON(APPS_KEY, []);
      apps[idx].status = sel.value;
      setJSON(APPS_KEY, apps);
      renderApplications();
      renderOverview();
    });
  });
  appList.querySelectorAll("[data-del-app]").forEach(btn => {
    btn.addEventListener("click", () => {
      const idx = +btn.getAttribute("data-del-app");
      const apps = getJSON(APPS_KEY, []);
      apps.splice(idx, 1);
      setJSON(APPS_KEY, apps);
      renderApplications();
      renderOverview();
    });
  });

  // Stats
  const total = apps.length;
  const byStatus = {};
  apps.forEach(a => byStatus[a.status] = (byStatus[a.status]||0)+1);
  appStats.innerHTML = `
    <div class="mini-stat"><div class="label">Total</div><div class="value">${total}</div></div>
    <div class="mini-stat"><div class="label">Applied</div><div class="value">${byStatus["Applied"]||0}</div></div>
    <div class="mini-stat"><div class="label">Shortlisted</div><div class="value">${byStatus["Shortlisted"]||0}</div></div>
    <div class="mini-stat"><div class="label">Interview</div><div class="value">${byStatus["Interview"]||0}</div></div>
    <div class="mini-stat"><div class="label">Selected</div><div class="value">${byStatus["Selected"]||0}</div></div>
    <div class="mini-stat"><div class="label">Rejected</div><div class="value">${byStatus["Rejected"]||0}</div></div>
  `;
}

function statusToClass(s) {
  switch(s) {
    case "Applied": return "status-applied";
    case "Under Review": return "status-review";
    case "Shortlisted": return "status-shortlisted";
    case "Interview": return "status-interview";
    case "Selected": return "status-selected";
    case "Rejected": return "status-rejected";
    default: return "status-applied";
  }
}

appAddBtn?.addEventListener("click", () => {
  const company = appCompany.value.trim();
  const role = appRole.value.trim();
  const date = appDate.value || new Date().toISOString().slice(0,10);
  const status = appStatus.value;
  if (!company || !role) {
    alert("Company and Role are required.");
    return;
  }
  const apps = getJSON(APPS_KEY, []);
  apps.push({ company, role, date, status, notes: "" });
  setJSON(APPS_KEY, apps);
  appCompany.value = "";
  appRole.value = "";
  renderApplications();
  renderOverview();
  addNotification(`Application added: ${role} at ${company}`);
});
appFilterStatus?.addEventListener("change", renderApplications);

// =========================
// Interviews Module
// =========================
const intCompany = document.getElementById("intCompany");
const intRole = document.getElementById("intRole");
const intDate = document.getElementById("intDate");
const intType = document.getElementById("intType");
const intStatus = document.getElementById("intStatus");
const intAddBtn = document.getElementById("intAddBtn");
const intFilterStatus = document.getElementById("intFilterStatus");
const intList = document.getElementById("intList");

function renderInterviews() {
  const ints = getJSON(INTS_KEY, []);
  const filter = intFilterStatus?.value || "";
  const filtered = filter ? ints.filter(i => i.status === filter) : ints;

  intList.innerHTML = "";
  if (filtered.length === 0) {
    intList.innerHTML = '<div class="muted">No interviews found.</div>';
  } else {
    filtered.forEach((i, idx) => {
      const card = document.createElement("div");
      card.className = "int-card";
      card.innerHTML = `
        <h3>${i.role} – ${i.company}</h3>
        <div class="muted">Date: ${i.date} | Type: ${i.type} | Status: ${i.status}</div>
        <div class="form-inline" style="margin-top:0.4rem;">
          <button class="btn-outline" data-del-int="${ints.indexOf(i)}">Delete</button>
        </div>
      `;
      intList.appendChild(card);
    });
  }

  intList.querySelectorAll("[data-del-int]").forEach(btn => {
    btn.addEventListener("click", () => {
      const idx = +btn.getAttribute("data-del-int");
      const ints = getJSON(INTS_KEY, []);
      ints.splice(idx, 1);
      setJSON(INTS_KEY, ints);
      renderInterviews();
      renderOverview();
    });
  });
}

intAddBtn?.addEventListener("click", () => {
  const company = intCompany.value.trim();
  const role = intRole.value.trim();
  const date = intDate.value || new Date().toISOString().slice(0,10);
  const type = intType.value;
  const status = intStatus.value;
  if (!company || !role) {
    alert("Company and Role are required.");
    return;
  }
  const ints = getJSON(INTS_KEY, []);
  ints.push({ company, role, date, type, status, notes: "" });
  setJSON(INTS_KEY, ints);
  intCompany.value = "";
  intRole.value = "";
  renderInterviews();
  renderOverview();
  addNotification(`Interview scheduled: ${role} at ${company} on ${date}`);
});
intFilterStatus?.addEventListener("change", renderInterviews);

// =========================
// Roadmap Module
// =========================
function getDefaultRoadmap() {
  return [
    { id: 1, title: "Complete Profile", status: "Not Started" },
    { id: 2, title: "Build Resume", status: "Not Started" },
    { id: 3, title: "Improve Technical Skills", status: "Not Started" },
    { id: 4, title: "Take Skill Assessments", status: "Not Started" },
    { id: 5, title: "Practice Aptitude", status: "Not Started" },
    { id: 6, title: "Practice Coding", status: "Not Started" },
    { id: 7, title: "Mock Interview", status: "Not Started" },
    { id: 8, title: "Apply for Jobs", status: "Not Started" },
    { id: 9, title: "Attend Interviews", status: "Not Started" },
    { id: 10, title: "Get Placed", status: "Not Started" }
  ];
}

function computeRoadmapProgress(roadmap) {
  if (!roadmap || roadmap.length === 0) return 0;
  const completed = roadmap.filter(r => r.status === "Completed").length;
  return Math.round((completed / roadmap.length) * 100);
}

function renderRoadmap() {
  let roadmap = getJSON(ROADMAP_KEY, null);
  if (!roadmap) {
    roadmap = getDefaultRoadmap();
    setJSON(ROADMAP_KEY, roadmap);
  }

  const list = document.getElementById("roadmapList");
  list.innerHTML = "";
  roadmap.forEach((r, idx) => {
    const item = document.createElement("div");
    item.className = "roadmap-item";
    item.innerHTML = `
      <div class="roadmap-info">
        <div><strong>Step ${r.id}:</strong> ${r.title}</div>
        <div class="muted">Status: ${r.status}</div>
      </div>
      <div class="roadmap-actions">
        <button class="btn-outline" data-rm-set="${idx}" data-val="Not Started">Not Started</button>
        <button class="btn-outline" data-rm-set="${idx}" data-val="In Progress">In Progress</button>
        <button class="btn-primary" data-rm-set="${idx}" data-val="Completed">Completed</button>
      </div>
    `;
    list.appendChild(item);
  });

  list.querySelectorAll("[data-rm-set]").forEach(btn => {
    btn.addEventListener("click", () => {
      const idx = +btn.getAttribute("data-rm-set");
      const val = btn.getAttribute("data-val");
      const rm = getJSON(ROADMAP_KEY, getDefaultRoadmap());
      rm[idx].status = val;
      setJSON(ROADMAP_KEY, rm);
      renderRoadmap();
      renderOverview();
    });
  });

  const rmProgress = computeRoadmapProgress(roadmap);
  document.getElementById("rmProgressFill").style.width = rmProgress + "%";
  document.getElementById("rmProgressText").textContent = rmProgress + "%";
}

// =========================
// Goals Module
// =========================
const goalTitle = document.getElementById("goalTitle");
const goalDesc = document.getElementById("goalDesc");
const goalDeadline = document.getElementById("goalDeadline");
const goalAddBtn = document.getElementById("goalAddBtn");
const goalList = document.getElementById("goalList");

function renderGoals() {
  const goals = getJSON(GOALS_KEY, []);
  goalList.innerHTML = "";
  if (goals.length === 0) {
    goalList.innerHTML = '<div class="muted">No goals yet. Add your first placement goal.</div>';
    return;
  }
  goals.forEach((g, idx) => {
    const card = document.createElement("div");
    card.className = "goal-card";
    card.innerHTML = `
      <h3>${g.title}</h3>
      <div class="muted">${g.desc || ""} | Deadline: ${g.deadline || "—"}</div>
      <div class="form-inline" style="margin-top:0.4rem;">
        <input type="range" min="0" max="100" value="${g.progress||0}" data-g-idx="${idx}" class="goal-progress-range" />
        <button class="btn-outline" data-del-goal="${idx}">Delete</button>
      </div>
      <div class="muted">Progress: <span data-g-idx="${idx}" class="goal-progress-text">${g.progress||0}%</span></div>
    `;
    goalList.appendChild(card);
  });

  goalList.querySelectorAll(".goal-progress-range").forEach(range => {
    range.addEventListener("input", () => {
      const idx = +range.getAttribute("data-g-idx");
      const val = +range.value;
      const goals = getJSON(GOALS_KEY, []);
      goals[idx].progress = val;
      setJSON(GOALS_KEY, goals);
      goalList.querySelectorAll(`.goal-progress-text[data-g-idx="${idx}"]`).forEach(el => el.textContent = val + "%");
    });
  });
  goalList.querySelectorAll("[data-del-goal]").forEach(btn => {
    btn.addEventListener("click", () => {
      const idx = +btn.getAttribute("data-del-goal");
      const goals = getJSON(GOALS_KEY, []);
      goals.splice(idx, 1);
      setJSON(GOALS_KEY, goals);
      renderGoals();
    });
  });
}

goalAddBtn?.addEventListener("click", () => {
  const title = goalTitle.value.trim();
  const desc = goalDesc.value.trim();
  const deadline = goalDeadline.value || "";
  if (!title) {
    alert("Goal title is required.");
    return;
  }
  const goals = getJSON(GOALS_KEY, []);
  goals.push({ title, desc, deadline, progress: 0 });
  setJSON(GOALS_KEY, goals);
  goalTitle.value = "";
  goalDesc.value = "";
  goalDeadline.value = "";
  renderGoals();
  addNotification(`New goal added: ${title}`);
});

// =========================
// Notifications
// =========================
const notifList = document.getElementById("notifList");
const notifClearBtn = document.getElementById("notifClearBtn");
const notifPill = document.getElementById("notifPill");
const notifCount = document.getElementById("notifCount");

function addNotification(text) {
  const notifs = getJSON(NOTIF_KEY, []);
  notifs.unshift({ id: Date.now(), text, read: false, date: new Date().toISOString() });
  // keep last 20
  if (notifs.length > 20) notifs.length = 20;
  setJSON(NOTIF_KEY, notifs);
  renderNotifications();
  updateNotifPill();
}

function renderNotifications() {
  const notifs = getJSON(NOTIF_KEY, []);
  notifList.innerHTML = "";
  if (notifs.length === 0) {
    notifList.innerHTML = '<div class="muted">No notifications.</div>';
    return;
  }
  notifs.forEach(n => {
    const div = document.createElement("div");
    div.className = "notif-item" + (n.read ? "" : " unread");
    div.innerHTML = `
      <div>${n.text}</div>
      <div class="muted" style="font-size:0.75rem;">${new Date(n.date).toLocaleString()}</div>
    `;
    div.addEventListener("click", () => {
      n.read = true;
      setJSON(NOTIF_KEY, notifs);
      renderNotifications();
      updateNotifPill();
    });
    notifList.appendChild(div);
  });
}

notifClearBtn?.addEventListener("click", () => {
  setJSON(NOTIF_KEY, []);
  renderNotifications();
  updateNotifPill();
});

function updateNotifPill() {
  const notifs = getJSON(NOTIF_KEY, []);
  const unread = notifs.filter(n => !n.read).length;
  notifCount.textContent = unread;
}

// =========================
// Analytics Module
// =========================
function computePlacementReadiness(profile, skills, apps, ints, roadmap) {
  const pf = computeProfileCompletion(profile);
  const sk = Math.min(100, skills.length * 10); // rough
  const ap = Math.min(100, apps.length * 5);
  const in_ = Math.min(100, ints.length * 10);
  const rm = computeRoadmapProgress(roadmap);
  const score = Math.round((pf*0.25 + sk*0.25 + ap*0.15 + in_*0.15 + rm*0.2));
  return Math.min(100, score);
}

function renderAnalytics() {
  const apps = getJSON(APPS_KEY, []);
  const ints = getJSON(INTS_KEY, []);
  const profile = getJSON(PROFILE_KEY, {});
  const skills = getJSON(SKILLS_KEY, []);
  const roadmap = getJSON(ROADMAP_KEY, getDefaultRoadmap());

  const totalApps = apps.length;
  const totalInts = ints.length;
  const shortlisted = apps.filter(a => a.status === "Shortlisted").length;
  const selected = apps.filter(a => a.status === "Selected").length;
  const rejected = apps.filter(a => a.status === "Rejected").length;

  document.getElementById("anApplications").textContent = totalApps;
  document.getElementById("anInterviews").textContent = totalInts;
  document.getElementById("anShortlisted").textContent = shortlisted;
  document.getElementById("anSelected").textContent = selected;
  document.getElementById("anRejected").textContent = rejected;

  const appSuccess = totalApps ? Math.round((selected/totalApps)*100) : 0;
  const intSuccess = totalInts ? Math.round((selected/totalInts)*100) : 0;

  const pf = computeProfileCompletion(profile);
  const sk = Math.min(100, skills.length * 10);
  const rm = computeRoadmapProgress(roadmap);
  const readiness = computePlacementReadiness(profile, skills, apps, ints, roadmap);

  document.getElementById("anRates").innerHTML = `
    <div class="mini-stat"><div class="label">Application Success</div><div class="value">${appSuccess}%</div></div>
    <div class="mini-stat"><div class="label">Interview Success</div><div class="value">${intSuccess}%</div></div>
  `;
  document.getElementById("anReadiness").innerHTML = `
    <div class="mini-stat"><div class="label">Profile</div><div class="value">${pf}%</div></div>
    <div class="mini-stat"><div class="label">Skills</div><div class="value">${sk}%</div></div>
    <div class="mini-stat"><div class="label">Roadmap</div><div class="value">${rm}%</div></div>
    <div class="mini-stat"><div class="label">Overall Readiness</div><div class="value">${readiness}%</div></div>
  `;
}

// =========================
// Settings Module
// =========================

const stTheme = document.getElementById("stTheme");
const stNotif = document.getElementById("stNotif");
const stSaveBtn = document.getElementById("stSaveBtn");
const stResetDemoBtn = document.getElementById("stResetDemoBtn");
const stClearDataBtn = document.getElementById("stClearDataBtn");
const stMsg = document.getElementById("stMsg");


function getDefaultSettings() {
  return {
    theme: "light",
    notifications: "on"
  };
}

function loadSettings() {
  const settings = getJSON(
    SETTINGS_KEY,
    getDefaultSettings()
  );

  if (stTheme) {
    stTheme.value = settings.theme || "light";
  }

  if (stNotif) {
    stNotif.value = settings.notifications || "on";
  }

  applyTheme(settings.theme || "light");
}

function saveSettings() {
  const settings = {
    theme: stTheme ? stTheme.value : "light",
    notifications: stNotif ? stNotif.value : "on"
  };

  try {
    setJSON(SETTINGS_KEY, settings);
    applyTheme(settings.theme);

    if (stMsg) {
      stMsg.textContent = "Settings saved successfully.";
      stMsg.style.color = "#10b981";
    }

    if (settings.notifications === "on") {
      addNotification("Notification preferences are enabled.");
    }
  } catch (error) {
    if (stMsg) {
      stMsg.textContent = "Unable to save settings.";
      stMsg.style.color = "#ef4444";
    }
  }
}

function applyTheme(theme) {
  if (theme === "dark") {
    document.body.classList.add("dark");
  } else {
    document.body.classList.remove("dark");
  }
}

function resetDemoData() {
  const confirmReset = confirm(
    "Reset all demo data? Your current profile, skills, applications and goals will be replaced."
  );

  if (!confirmReset) {
    return;
  }

  const demoProfile = {
    name: "Kiruthiga",
    email: "student@smartplacement.com",
    phone: "9876543210",
    college: "ABC College",
    degree: "MCA",
    department: "Computer Applications",
    gradYear: "2026",
    cgpa: "8.2",
    location: "Coimbatore",
    objective:
      "To obtain a challenging software development role where I can apply my technical skills and grow professionally.",
    github: "https://github.com/kiruthiga",
    linkedin: "https://linkedin.com/in/kiruthiga",
    portfolio: "https://kiruthiga.dev"
  };

  const demoSkills = [
    {
      name: "HTML",
      category: "Web",
      level: "Advanced"
    },
    {
      name: "CSS",
      category: "Web",
      level: "Intermediate"
    },
    {
      name: "JavaScript",
      category: "Web",
      level: "Intermediate"
    },
    {
      name: "Java",
      category: "Programming",
      level: "Beginner"
    },
    {
      name: "SQL",
      category: "Database",
      level: "Intermediate"
    }
  ];

  const demoApplications = [
    {
      company: "ABC Tech",
      role: "Frontend Developer",
      date: new Date().toISOString().slice(0, 10),
      status: "Applied",
      notes: ""
    }
  ];

  const demoInterviews = [
    {
      company: "ABC Tech",
      role: "Frontend Developer",
      date: new Date().toISOString().slice(0, 10),
      type: "Technical",
      status: "Scheduled",
      notes: ""
    }
  ];

  const demoGoals = [
    {
      title: "Complete JavaScript Course",
      desc: "Finish ES6 and DOM manipulation topics.",
      deadline: "2026-10-15",
      progress: 40
    },
    {
      title: "Apply for 5 Jobs",
      desc: "Apply for suitable frontend developer roles.",
      deadline: "2026-10-30",
      progress: 20
    }
  ];

  localStorage.setItem(
    PROFILE_KEY,
    JSON.stringify(demoProfile)
  );

  localStorage.setItem(
    SKILLS_KEY,
    JSON.stringify(demoSkills)
  );

  localStorage.setItem(
    APPS_KEY,
    JSON.stringify(demoApplications)
  );

  localStorage.setItem(
    INTS_KEY,
    JSON.stringify(demoInterviews)
  );

  localStorage.setItem(
    ROADMAP_KEY,
    JSON.stringify(getDefaultRoadmap())
  );

  localStorage.setItem(
    GOALS_KEY,
    JSON.stringify(demoGoals)
  );

  localStorage.setItem(
    NOTIF_KEY,
    JSON.stringify([
      {
        id: Date.now(),
        text: "Demo data has been restored.",
        read: false,
        date: new Date().toISOString()
      }
    ])
  );

  localStorage.setItem(
    RESUME_KEY,
    JSON.stringify({})
  );

  if (stMsg) {
    stMsg.textContent = "Demo data reset successfully.";
    stMsg.style.color = "#10b981";
  }

  loadProfile();
  renderSkills();
  renderApplications();
  renderInterviews();
  renderRoadmap();
  renderGoals();
  renderNotifications();
  renderOverview();
  renderAnalytics();
  updateNotifPill();
}

function clearApplicationData() {
  const confirmClear = confirm(
    "Are you sure you want to delete all application data?"
  );

  if (!confirmClear) {
    return;
  }

  localStorage.removeItem(APPS_KEY);
  localStorage.removeItem(INTS_KEY);
  localStorage.removeItem(GOALS_KEY);
  localStorage.removeItem(ASSESS_KEY);
  localStorage.removeItem(NOTIF_KEY);

  if (stMsg) {
    stMsg.textContent =
      "Application data cleared successfully.";
    stMsg.style.color = "#10b981";
  }

  renderApplications();
  renderInterviews();
  renderGoals();
  renderNotifications();
  renderOverview();
  renderAnalytics();
  updateNotifPill();
}

stSaveBtn?.addEventListener("click", saveSettings);
stResetDemoBtn?.addEventListener("click", resetDemoData);
stClearDataBtn?.addEventListener("click", clearApplicationData);

loadSettings();
function doLogout() {
  const confirmLogout = confirm("Are you sure you want to logout?");

  if (!confirmLogout) {
    return;
  }

  localStorage.removeItem("spt-user");
  window.location.href = "index.html";
}