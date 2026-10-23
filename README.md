# Resume JSON Generator

A lightweight, browser-based tool for building structured resume data and exporting it as JSON. Fill in your details through a guided form, review the generated output, and download it as `resume.json` for use in other projects or workflows.

## Features

- **Guided 10-step form** covering personal information, summary, education, skills, experience, projects, certifications, achievements, leadership positions, and export.
- **Repeatable sections** for entries such as education, work experience, projects, certifications, achievements, and positions.
- **Live JSON generation** to review the structured resume data before exporting.
- **Download or copy** the generated JSON.
- **Automatic draft saving** in the browser using `localStorage`, so your progress remains available in the same browser.
- **Responsive interface** with a dark theme for desktop and mobile screens.
- **Reset option** to clear the saved draft and start over.

## Interview Questions
1. What problem does this project solve??
2. Why did you build this??
3. What exactly did you implement??
4. What is the Tech stack??
5. What about database??
6. How are users Authorised??
7. How did you deploy this project??
8. What was the hardest bug??
9. What if the users increase to 100x than usual??
10. What is the trade-off??
11. How would you redesign/new feature/Future ideas??  

## Preview

<img width="1516" height="750" alt="image" src="https://github.com/user-attachments/assets/730cfb4c-1b1c-43c7-955a-42ffbced56e0" />


## Getting Started

### Run locally

1. Clone the repository:

   ```bash
   git clone https://github.com/Rohan-Shridhar/resume-json-generator.git
   ```

2. Open the project folder:

   ```bash
   cd resume-json-generator
   ```

3. Open `index.html` in your browser.

You can also use a local development server, such as the **Live Server** extension in VS Code.

## How to Use

1. Open the application in your browser.
2. Fill in each resume section using **Next** and **Previous** to navigate.
3. Add or remove entries where needed.
4. Go to **Review & Export** to inspect the generated JSON.
5. Select **Copy JSON** to copy the data, or **Download resume.json** to save it as a file.

Your draft is automatically saved in your browser. Drafts are stored locally and are not synced between browsers or devices. Clearing the browser's site data may remove the saved draft.

## Output Structure

The exported file is a JSON object with the following top-level fields:

| Field | Description |
| --- | --- |
| `personal` | Name, email, phone, location, LinkedIn, GitHub, and portfolio |
| `summary` | Professional summary text |
| `education` | Array of education entries |
| `skills` | Programming languages, web technologies, databases, tools/platforms, and other skills |
| `experience` | Array of work, internship, or freelance experience entries |
| `projects` | Array of projects, including technologies, descriptions, and links |
| `certifications` | Array of certification entries |
| `achievements` | Array of achievements |
| `positions` | Array of leadership and other position entries |

Example output:

```json
{
  "personal": {
    "name": "Alex Morgan",
    "email": "alex@example.com",
    "phone": "",
    "location": "Bengaluru, India",
    "linkedin": "",
    "github": "",
    "portfolio": ""
  },
  "summary": "Computer Science student interested in software development.",
  "education": [],
  "skills": {
    "programmingLanguages": ["Java", "Python", "JavaScript"],
    "webTechnologies": ["HTML", "CSS", "React"],
    "databases": ["MongoDB"],
    "toolsAndPlatforms": ["Git", "GitHub"],
    "other": ["Problem Solving"]
  },
  "experience": [],
  "projects": [],
  "certifications": [],
  "achievements": [],
  "positions": []
}
```

The example is illustrative; fields are populated based on the information entered in the form. Skills and project technologies are entered as comma-separated values and exported as arrays.

## Project Structure

```text
resume-json-generator/
├── index.html   # Form structure and page layout
├── style.css    # Styling and responsive layout
├── script.js    # Form navigation, data collection, autosave, and JSON export
└── README.md    # Project documentation
└── LICENSE      # MIT Lincense
```

## Technologies

- HTML
- CSS
- Vanilla JavaScript
- Browser APIs: Local Storage, Clipboard API, and Blob downloads

No framework, backend, database, or third-party package is required.

## Privacy

Resume information and saved drafts are handled in your browser by this application. Drafts are stored in `localStorage`; avoid using a shared or public device for sensitive personal information, and clear the saved draft when finished.

## Contributing

Issues and pull requests for bug fixes, usability improvements, and additional export formats are welcome.

## License

[MIT LICENSE](LICENSE)
