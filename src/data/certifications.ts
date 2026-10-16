/**
 * Metadata for the freeCodeCamp certifications that make up the practice
 * catalog. The slug is the certification's URL segment on freecodecamp.org
 * (e.g. https://www.freecodecamp.org/learn/responsive-web-design-v9).
 *
 * Block-level structure for each certification is sourced from the official
 * open-source curriculum in the freeCodeCamp GitHub repository:
 * https://github.com/freeCodeCamp/freeCodeCamp/tree/main/curriculum/structure/superblocks
 */

export interface CertMeta {
  /** URL slug on freecodecamp.org/learn */
  slug: string
  /** Full display name */
  name: string
  /** Short label used in chips and filters */
  shortName: string
  /** One-line pitch */
  tagline: string
  /** Longer description for detail pages */
  description: string
  /** Topics covered */
  skills: string[]
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
  /** Approximate hours of content, or null when unknown */
  estimatedHours: number | null
  /** Accent color (hex) used for dots, bars and glows */
  accent: string
}

export const CERT_META: CertMeta[] = [
  {
    slug: 'responsive-web-design-v9',
    name: 'Responsive Web Design',
    shortName: 'Web Design',
    tagline: 'HTML, CSS, Flexbox, Grid and accessibility — build pages that work everywhere.',
    description:
      'Learn the languages that build every website: HTML for structure and CSS for layout and design. You will build real pages using semantic HTML, forms, flexbox, CSS grid, and responsive design principles.',
    skills: ['HTML', 'CSS', 'Semantic HTML', 'Flexbox', 'CSS Grid', 'Accessibility', 'Responsive Design'],
    difficulty: 'Beginner',
    estimatedHours: 300,
    accent: '#38bdf8',
  },
  {
    slug: 'javascript-v9',
    name: 'JavaScript',
    shortName: 'JavaScript',
    tagline: 'Core JavaScript from variables to async — the language of the web.',
    description:
      'Master core JavaScript programming: variables, strings, numbers, functions, objects, arrays, loops, higher-order functions, DOM manipulation, events, classes, recursion, and asynchronous JavaScript. Every module ends with a workshop or lab where you build something real.',
    skills: ['Variables', 'Functions', 'Objects & Arrays', 'DOM', 'Events', 'Classes', 'Async/Await', 'RegEx', 'Recursion'],
    difficulty: 'Beginner',
    estimatedHours: 300,
    accent: '#fbbf24',
  },
  {
    slug: 'front-end-development-libraries-v9',
    name: 'Front-End Development Libraries',
    shortName: 'Frontend Libs',
    tagline: 'React, TypeScript, Tailwind and modern front-end tooling.',
    description:
      'Build modern interactive user interfaces with React and TypeScript: components, props, state, hooks, events, forms, routing, data fetching, memoization, performance, and testing — plus CSS libraries like Tailwind.',
    skills: ['React', 'TypeScript', 'Hooks', 'Routing', 'Data Fetching', 'Performance', 'Testing', 'Tailwind'],
    difficulty: 'Intermediate',
    estimatedHours: 300,
    accent: '#22d3ee',
  },
  {
    slug: 'python-v9',
    name: 'Python',
    shortName: 'Python',
    tagline: 'Python fundamentals to algorithms and data structures.',
    description:
      'Learn Python from scratch: variables, strings, conditions, loops, functions, error handling, classes and objects, object-oriented programming, data structures, recursion, searching and sorting, graphs and trees, and dynamic programming.',
    skills: ['Python', 'OOP', 'Error Handling', 'Data Structures', 'Recursion', 'Algorithms', 'Graphs', 'Dynamic Programming'],
    difficulty: 'Beginner',
    estimatedHours: 300,
    accent: '#34d399',
  },
  {
    slug: 'relational-databases-v9',
    name: 'Relational Databases',
    shortName: 'Databases',
    tagline: 'Bash, SQL, PostgreSQL and Git — work with real data.',
    description:
      'Work like a back-end engineer: the command line, Bash scripting, Nano, Git and GitHub, SQL, and PostgreSQL. Build databases and scripts that store, query, and transform real data.',
    skills: ['Bash', 'Command Line', 'SQL', 'PostgreSQL', 'Git', 'Nano', 'Data Modeling'],
    difficulty: 'Intermediate',
    estimatedHours: 300,
    accent: '#a78bfa',
  },
  {
    slug: 'back-end-development-and-apis-v9',
    name: 'Back-End Development and APIs',
    shortName: 'Backend',
    tagline: 'Node.js, Express, REST APIs, WebSockets and JWT auth.',
    description:
      'Build servers and APIs with Node.js and Express: core modules, npm, HTTP, the request/response model, middleware, REST APIs, error handling and health checks, WebSockets, JWT authentication, and security and privacy.',
    skills: ['Node.js', 'npm', 'Express', 'HTTP', 'REST APIs', 'WebSockets', 'JWT', 'Security'],
    difficulty: 'Intermediate',
    estimatedHours: 300,
    accent: '#f472b6',
  },
  {
    slug: 'full-stack-developer-v9',
    name: 'Certified Full-Stack Developer',
    shortName: 'Full-Stack',
    tagline: 'The capstone credential that ties the whole curriculum together.',
    description:
      'The capstone certification that ties the entire curriculum together. Complete the individual certifications as you progress, then pass the Certified Full-Stack Developer exam to earn freeCodeCamp\u2019s full-stack credential.',
    skills: ['Front-End', 'Back-End', 'Databases', 'Full-Stack Architecture'],
    difficulty: 'Advanced',
    estimatedHours: null,
    accent: '#facc15',
  },
]

export const CERT_META_BY_SLUG: Record<string, CertMeta> = Object.fromEntries(
  CERT_META.map((c) => [c.slug, c]),
)

/** Extra freeCodeCamp destinations shown on the Resources page. */
export interface ExtraResource {
  name: string
  url: string
  note: string
}

export const LEGACY_CERTIFICATIONS: ExtraResource[] = [
  { name: 'JavaScript Algorithms and Data Structures (v8)', url: 'https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures-v8', note: 'Legacy edition of the JavaScript certification' },
  { name: 'JavaScript Algorithms and Data Structures (v7)', url: 'https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures', note: 'Original JavaScript certification' },
  { name: 'Responsive Web Design (v8)', url: 'https://www.freecodecamp.org/learn/2022/responsive-web-design', note: 'Project-based HTML & CSS certification' },
  { name: 'Responsive Web Design (v7)', url: 'https://www.freecodecamp.org/learn/responsive-web-design', note: 'Original HTML & CSS challenges' },
  { name: 'Front-End Development Libraries (v8)', url: 'https://www.freecodecamp.org/learn/front-end-development-libraries', note: 'React, Redux, Sass, Bootstrap, jQuery' },
  { name: 'Relational Database (v8)', url: 'https://www.freecodecamp.org/learn/relational-database', note: 'Bash, PostgreSQL and Git projects' },
  { name: 'Data Visualization', url: 'https://www.freecodecamp.org/learn/data-visualization', note: 'Charts and graphs with D3.js' },
  { name: 'Machine Learning with Python', url: 'https://www.freecodecamp.org/learn/machine-learning-with-python', note: 'TensorFlow, neural networks and NLP' },
  { name: 'Data Analysis with Python', url: 'https://www.freecodecamp.org/learn/data-analysis-with-python', note: 'NumPy, Pandas, Matplotlib and Seaborn' },
  { name: 'Scientific Computing with Python', url: 'https://www.freecodecamp.org/learn/scientific-computing-with-python', note: 'Python fundamentals and projects' },
  { name: 'Information Security', url: 'https://www.freecodecamp.org/learn/information-security', note: 'HelmetJS, TCP and penetration testing basics' },
  { name: 'Quality Assurance', url: 'https://www.freecodecamp.org/learn/quality-assurance', note: 'Testing with Chai, Pug, Passport and Socket.io' },
  { name: 'College Algebra with Python', url: 'https://www.freecodecamp.org/learn/college-algebra-with-python', note: 'Math foundations with Python' },
  { name: 'Foundational C# with Microsoft', url: 'https://www.freecodecamp.org/learn/foundational-c-sharp-with-microsoft', note: 'C# fundamentals with Microsoft' },
  { name: 'A2 English for Developers', url: 'https://www.freecodecamp.org/learn/a2-english-for-developers', note: 'Technical English for developers' },
]

export const MORE_PRACTICE: ExtraResource[] = [
  { name: 'Coding Interview Prep', url: 'https://www.freecodecamp.org/learn/coding-interview-prep', note: 'Algorithms, data structures and interview practice' },
  { name: 'Project Euler', url: 'https://www.freecodecamp.org/learn/project-euler', note: 'Math and programming challenges' },
  { name: 'Rosetta Code', url: 'https://www.freecodecamp.org/learn/rosetta-code', note: 'Classic problems solved in many ways' },
  { name: 'Python for Everybody', url: 'https://www.freecodecamp.org/learn/python-for-everybody', note: 'Dr. Chuck\u2019s popular Python course' },
]
