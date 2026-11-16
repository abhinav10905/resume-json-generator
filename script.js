
'use strict';

const STORAGE_KEY = 'resume-json-generator-v1';
const THEME_STORAGE_KEY = 'resume-json-generator-theme';

const form = document.getElementById("resume-form");
const outputContent = document.getElementById("output-content");
const outputLabel = document.getElementById("output-label");
const outputCount = document.getElementById("output-count");
const themeToggle = document.getElementById("theme-toggle");
const phoneCountrySelect = document.getElementById("phoneCountry");
const phoneInput = document.getElementById("phone");
const fullNameInput = document.getElementById("fullName");

let currentFormat = 'json';
let saveTimeout;

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  const ariaLabel = `Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`;
  themeToggle.setAttribute('aria-label', ariaLabel);
  themeToggle.setAttribute('title', ariaLabel);
  themeToggle.querySelector('.theme-icon').textContent = theme === 'dark' ? '☼' : '☾';
}

try {
  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  applyTheme(savedTheme === 'light' ? 'light' : 'dark');
} catch (error) {
  console.error('Could not restore theme preference:', error);
  applyTheme('dark');
}

themeToggle.addEventListener('click', () => {
  const nextTheme = document.documentElement.dataset.theme === 'dark'
    ? 'light'
    : 'dark';
  applyTheme(nextTheme);

  try {
    localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
  } catch (error) {
    console.error('Could not save theme preference:', error);
  }
});

function initPhoneCountrySelect() {
  COUNTRY_CODES.forEach(([iso, name, dialCode]) => {
    const option = document.createElement('option');
    option.value = iso;
    option.textContent = `${name} (+${dialCode})`;
    phoneCountrySelect.appendChild(option);
  });

  const userRegion = (navigator.language || 'en-IN').split('-')[1] || 'IN';
  const defaultCountry = COUNTRY_CODES.find(([iso]) => iso === userRegion)
    ? userRegion
    : 'IN';

  const defaultOption = phoneCountrySelect.querySelector(`option[value="${defaultCountry}"]`);
  if (defaultOption) {
    defaultOption.defaultSelected = true;
    defaultOption.selected = true;
  }
}

function getDialCode(iso) {
  const country = COUNTRY_CODES.find(([code]) => code === iso);
  return country ? country[2] : '';
}

function findCountryByDialCode(dialCode, preferredIso = null) {
  const matches = COUNTRY_CODES.filter(([, , code]) => code === dialCode);
  if (matches.length === 0) return null;
  if (preferredIso) {
    const preferred = matches.find(([iso]) => iso === preferredIso);
    if (preferred) return preferred[0];
  }
  return matches[0][0];
}

function validatePhoneNumber() {
  const number = phoneInput.value.trim();
  
  if (!number) {
    phoneInput.setCustomValidity('');
    phoneInput.classList.remove('invalid');
    return;
  }

  const cleaned = number.replace(/[\s()\.\-]/g, '');
  
  if (!/^\d+$/.test(cleaned)) {
    phoneInput.setCustomValidity('Phone number can only contain digits, spaces, ( ) . -');
    phoneInput.classList.add('invalid');
    return;
  }

  if (cleaned.length < 4) {
    phoneInput.setCustomValidity('Phone number must have at least 4 digits');
    phoneInput.classList.add('invalid');
    return;
  }

  const dialCode = getDialCode(phoneCountrySelect.value);
  const totalDigits = dialCode.length + cleaned.length;

  if (totalDigits > 15) {
    phoneInput.setCustomValidity(`Phone number with country code (+${dialCode}) cannot exceed 15 digits (currently ${totalDigits})`);
    phoneInput.classList.add('invalid');
    return;
  }

  phoneInput.setCustomValidity('');
  phoneInput.classList.remove('invalid');
}

function validateFullName() {
  const name = fullNameInput.value.trim();

  if (!name) {
    fullNameInput.setCustomValidity('');
    fullNameInput.classList.remove('invalid');
    return;
  }

  if (/\d/.test(name)) {
    fullNameInput.setCustomValidity('Full name cannot contain numbers');
    fullNameInput.classList.add('invalid');
    return;
  }

  fullNameInput.setCustomValidity('');
  fullNameInput.classList.remove('invalid');
}

initPhoneCountrySelect();

phoneCountrySelect.addEventListener('change', validatePhoneNumber);
phoneInput.addEventListener('input', validatePhoneNumber);
fullNameInput.addEventListener('input', validateFullName);

const sections = {
  education: {
    container: 'education-list',
    template: 'education-template',
    output: 'education'
  },
  experience: {
    container: 'experience-list',
    template: 'experience-template',
    output: 'experience'
  },
  projects: {
    container: 'projects-list',
    template: 'projects-template',
    output: 'projects'
  },
  certifications: {
    container: 'certifications-list',
    template: 'certifications-template',
    output: 'certifications'
  },
  achievements: {
    container: 'achievements-list',
    template: 'achievements-template',
    output: 'achievements'
  },
  positions: {
    container: 'positions-list',
    template: 'positions-template',
    output: 'positions'
  }
};

function addEntry(sectionName, values = {}) {
  const section = sections[sectionName];
  if (!section) return;

  const container = document.getElementById(section.container);
  const template = document.getElementById(section.template);
  const fragment = template.content.cloneNode(true);
  const card = fragment.querySelector('.repeat-card');

  card.querySelectorAll('[data-key]').forEach((input) => {
    const key = input.dataset.key;
    input.value = values[key] ?? '';
  });

  container.appendChild(fragment);
  return container.lastElementChild;
}

function readEntry(card) {
  const entry = {};

  card.querySelectorAll('[data-key]').forEach((input) => {
    const key = input.dataset.key;
    const value = input.value.trim();

    if (value) {
      entry[key] = value;
    }
  });

  return entry;
}

function readEntries(sectionName) {
  const section = sections[sectionName];
  const container = document.getElementById(section.container);

  return Array.from(container.querySelectorAll('.repeat-card'))
    .map(readEntry)
    .filter((entry) => Object.keys(entry).length > 0);
}

function collectResume() {
  const data = new FormData(form);
  const personal = {
    fullName: data.get('fullName').trim(),
    email: data.get('email').trim()
  };

  const optionalPersonalFields = [
    'location',
    'linkedin',
    'github',
    'portfolio'
  ];

  optionalPersonalFields.forEach((key) => {
    const value = data.get(key).trim();
    if (value) personal[key] = value;
  });

  const phoneNumber = phoneInput.value.trim().replace(/\s+/g, ' ');
  if (phoneNumber) {
    const dialCode = getDialCode(phoneCountrySelect.value);
    personal.phone = `+${dialCode} ${phoneNumber}`;
  }

  const resume = {
    personal,
    summary: data.get('summary').trim(),
    education: readEntries('education'),
    skills: data.get('skills')
      .split(',')
      .map((skill) => skill.trim())
      .filter(Boolean),
    experience: readEntries('experience'),
    projects: readEntries('projects'),
    certifications: readEntries('certifications'),
    achievements: readEntries('achievements'),
    positions: readEntries('positions')
  };

  return resume;
}

function countFields(value) {
  if (Array.isArray(value)) {
    return value.reduce((total, item) => total + countFields(item), 0);
  }

  if (value !== null && typeof value === 'object') {
    return Object.values(value).reduce(
      (total, item) => total + countFields(item),
      0
    );
  }

  if (typeof value === 'string') return value.trim() ? 1 : 0;
  return 0;
}

function toPlainText(resume) {
  const lines = [];
  const add = (label, value) => {
    if (value) lines.push(`${label}: ${value}`);
  };

  const personal = resume.personal;

  lines.push(personal.fullName || 'Resume');
  lines.push('='.repeat(Math.max(6, (personal.fullName || 'Resume').length)));
  add('Email', personal.email);
  add('Phone', personal.phone);
  add('Location', personal.location);
  add('LinkedIn', personal.linkedin);
  add('GitHub', personal.github);
  add('Portfolio', personal.portfolio);

  if (resume.summary) {
    lines.push('', 'PROFESSIONAL SUMMARY', resume.summary);
  }

  if (resume.education.length) {
    lines.push('', 'EDUCATION');
    resume.education.forEach((item) => {
      lines.push(
        [item.degree, item.field].filter(Boolean).join(' — ') || 'Education'
      );
      add('Institution', item.institution);
      add('Duration', [item.startDate, item.endDate].filter(Boolean).join(' - '));
      add('Grade', item.grade);
      lines.push('');
    });
  }

  if (resume.skills.length) {
    lines.push('', 'SKILLS', resume.skills.join(', '));
  }

  const groups = [
    ['EXPERIENCE', resume.experience, (item) => item.title || 'Experience', [
      ['Company', 'company'],
      ['Duration', null],
      ['Description', 'description']
    ]],
    ['PROJECTS', resume.projects, (item) => item.name || 'Project', [
      ['Technologies', 'technologies'],
      ['Description', 'description'],
      ['Project URL', 'url'],
      ['Repository', 'repository']
    ]],
    ['CERTIFICATIONS', resume.certifications, (item) => item.name || 'Certification', [
      ['Issuer', 'issuer'],
      ['Date', 'date'],
      ['Credential URL', 'url']
    ]],
    ['ACHIEVEMENTS', resume.achievements, (item) => item.title || 'Achievement', [
      ['Description', 'description'],
      ['Date', 'date']
    ]],
    ['POSITIONS & LEADERSHIP', resume.positions, (item) => item.title || 'Position', [
      ['Organization', 'organization'],
      ['Duration', null],
      ['Description', 'description']
    ]]
  ];

  groups.forEach(([heading, entries, getTitle, fields]) => {
    if (!entries.length) return;

    lines.push('', heading);

    entries.forEach((item) => {
      lines.push('', getTitle(item));

      fields.forEach(([label, key]) => {
        if (key === null) {
          add('Duration', [item.startDate, item.endDate].filter(Boolean).join(' - '));
        } else {
          add(label, item[key]);
        }
      });
    });
  });

  return lines.join('\n').trim() + '\n';
}

function renderOutput() {
  const resume = collectResume();
  const text = currentFormat === 'json'
    ? JSON.stringify(resume, null, 2)
    : toPlainText(resume);

  outputContent.textContent = text;
  outputLabel.textContent = currentFormat === 'json'
    ? 'resume.json'
    : 'resume.txt';
  outputCount.textContent = `${countFields(resume)} values`;
}

function saveToStorage() {
  try {
    const data = collectResume();
    data.phoneCountry = phoneCountrySelect.value;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Could not save resume data:', error);
  }
}

function scheduleSave() {
  renderOutput();

  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(saveToStorage, 250);
}

function restoreResume(resume) {
  if (!resume || typeof resume !== 'object') return;

  const personal = resume.personal || {};

  Object.entries(personal).forEach(([key, value]) => {
    if (key === 'phone') return;
    const input = form.elements.namedItem(key);
    if (input && typeof value === 'string') input.value = value;
  });

  if (personal.phone && typeof personal.phone === 'string') {
    if (personal.phone.startsWith('+')) {
      const digitsAfterPlus = personal.phone.slice(1).match(/^\d+/);
      if (digitsAfterPlus) {
        const allDigits = digitsAfterPlus[0];
        const savedPhoneCountry = resume.phoneCountry || null;
        
        let matchedDialCode = '';
        let matchedCountryIso = null;
        
        for (let i = allDigits.length; i >= 1; i--) {
          const candidateDialCode = allDigits.slice(0, i);
          const matches = COUNTRY_CODES.filter(([, , code]) => code === candidateDialCode);
          
          if (matches.length > 0) {
            matchedDialCode = candidateDialCode;
            if (savedPhoneCountry) {
              const preferred = matches.find(([iso]) => iso === savedPhoneCountry);
              if (preferred) {
                matchedCountryIso = preferred[0];
                break;
              }
            }
            matchedCountryIso = matches[0][0];
            break;
          }
        }
        
        if (matchedCountryIso) {
          phoneCountrySelect.value = matchedCountryIso;
          const restAfterDialCode = personal.phone.slice(1 + matchedDialCode.length);
          phoneInput.value = restAfterDialCode.trimStart();
        } else {
          phoneInput.value = personal.phone;
        }
      } else {
        phoneInput.value = personal.phone;
      }
    } else {
      phoneInput.value = personal.phone;
    }
  }

  const summary = form.elements.namedItem('summary');
  if (summary) summary.value = resume.summary || '';

  const skills = form.elements.namedItem('skills');
  if (skills) {
    skills.value = Array.isArray(resume.skills)
      ? resume.skills.join(', ')
      : '';
  }

  Object.entries(sections).forEach(([name, section]) => {
    const container = document.getElementById(section.container);
    container.replaceChildren();

    const entries = Array.isArray(resume[section.output])
      ? resume[section.output]
      : [];

    entries.forEach((entry) => addEntry(name, entry));
  });

  validateFullName();
  validatePhoneNumber();
  renderOutput();
}

function clearSavedResume() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch (error) {
    console.error('Could not clear local storage:', error);
    return false;
  }
}

document.querySelectorAll('[data-add]').forEach((button) => {
  button.addEventListener('click', () => {
    addEntry(button.dataset.add);
    scheduleSave();
  });
});

document.addEventListener('click', (event) => {
  const button = event.target.closest('.remove-btn');
  if (!button) return;

  button.closest('.repeat-card').remove();
  scheduleSave();
});

form.addEventListener('input', scheduleSave);

form.addEventListener('submit', (event) => {
  event.preventDefault();

  if (!form.reportValidity()) return;

  renderOutput();
  saveToStorage();
});

document.querySelectorAll('[data-format]').forEach((button) => {
  button.addEventListener('click', () => {
    currentFormat = button.dataset.format;

    document.querySelectorAll('[data-format]').forEach((tab) => {
      const active = tab === button;
      tab.classList.toggle('active', active);
      tab.setAttribute('aria-selected', String(active));
    });

    renderOutput();
  });
});

document.getElementById('copy-btn').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(outputContent.textContent);
    const button = document.getElementById('copy-btn');
    const previousText = button.textContent;

    button.textContent = 'Copied!';
    setTimeout(() => {
      button.textContent = previousText;
    }, 1500);
  } catch (error) {
    console.error('Clipboard access failed:', error);
    window.prompt('Copy your resume output:', outputContent.textContent);
  }
});

document.getElementById('download-btn').addEventListener('click', () => {
  renderOutput();

  const extension = currentFormat === 'json' ? 'json' : 'txt';
  const mimeType = currentFormat === 'json'
    ? 'application/json'
    : 'text/plain';

  const blob = new Blob([outputContent.textContent], {
    type: `${mimeType};charset=utf-8`
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = `resume.${extension}`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
});


const resetDialog = document.getElementById("reset-dialog");
const cancelResetBtn = document.getElementById("cancel-reset-btn");
const confirmResetBtn = document.getElementById("confirm-reset-btn");
const resetBtn = document.getElementById("reset-btn");

// Open the confirmation dialog
resetBtn.addEventListener("click", () => {
    resetDialog.showModal();
});

// Close the dialog without resetting anything
cancelResetBtn.addEventListener("click", () => {
    resetDialog.close();
});

// Close the dialog when Escape is pressed
resetDialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    resetDialog.close();
});

// Reset the resume only after confirmation
confirmResetBtn.addEventListener("click", () => {
    resetDialog.close();

    form.reset();

    Object.values(sections).forEach((section) => {
        document.getElementById(section.container).replaceChildren();
    });

    clearTimeout(saveTimeout);
    clearSavedResume();
    validateFullName();
    validatePhoneNumber();
    renderOutput();
});


try {
  const saved = localStorage.getItem(STORAGE_KEY);

  if (saved) {
    restoreResume(JSON.parse(saved));
  } else {
    renderOutput();
  }
} catch (error) {
  console.error('Could not restore saved resume:', error);
  renderOutput();
}


// --- Back to Top Button ---
const backToTopBtn = document.getElementById('backToTopBtn');

if (backToTopBtn) {
  window.addEventListener('scroll', () => {
    if (window.scrollY > 300) {
      backToTopBtn.classList.remove('hidden'); 
    } else {
      backToTopBtn.classList.add('hidden');   
    }
  });

  backToTopBtn.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth' 
    });
  });
}