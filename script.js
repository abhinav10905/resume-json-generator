
'use strict';

const STORAGE_KEY = 'resume-json-generator-v1';
const THEME_STORAGE_KEY = 'resume-json-generator-theme';

const form = document.getElementById('resume-form');
const outputContent = document.getElementById('output-content');
const outputLabel = document.getElementById('output-label');
const outputCount = document.getElementById('output-count');
const themeToggle = document.getElementById('theme-toggle');
const themeLabel = document.getElementById('theme-label');

let currentFormat = 'json';
let saveTimeout;

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  themeLabel.textContent = theme === 'dark' ? 'Light theme' : 'Dark theme';
  themeToggle.setAttribute(
    'aria-label',
    `Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`
  );
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
    'phone',
    'location',
    'linkedin',
    'github',
    'portfolio'
  ];

  optionalPersonalFields.forEach((key) => {
    const value = data.get(key).trim();
    if (value) personal[key] = value;
  });

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
    localStorage.setItem(STORAGE_KEY, JSON.stringify(collectResume()));
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
    const input = form.elements.namedItem(key);
    if (input && typeof value === 'string') input.value = value;
  });

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

document.getElementById('reset-btn').addEventListener('click', () => {
  const confirmed = window.confirm(
    'Clear all resume information saved in this browser? This cannot be undone.'
  );

  if (!confirmed) return;

  form.reset();

  Object.values(sections).forEach((section) => {
    document.getElementById(section.container).replaceChildren();
  });

  clearTimeout(saveTimeout);
  clearSavedResume();
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
