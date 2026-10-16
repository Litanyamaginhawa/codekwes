export interface PlaygroundTemplate {
  id: string
  name: string
  html: string
  css: string
  js: string
}

export const TEMPLATES: PlaygroundTemplate[] = [
  {
    id: 'starter',
    name: 'Starter',
    html: `<main class="stage">
  <h1>Hello, CodeKwes!</h1>
  <p>Edit the HTML, CSS and JS panes — the preview updates live.</p>
  <button id="cheer">Cheer me on</button>
  <p id="output"></p>
</main>`,
    css: `body {
  margin: 0;
  font-family: system-ui, sans-serif;
  background: #0b0b1e;
  color: #e2e8f0;
  display: grid;
  place-items: center;
  min-height: 100vh;
}

.stage {
  text-align: center;
  padding: 2rem;
}

h1 {
  background: linear-gradient(90deg, #38bdf8, #34d399);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

button {
  margin-top: 1rem;
  padding: 0.6rem 1.2rem;
  border: none;
  border-radius: 0.6rem;
  background: linear-gradient(135deg, #38bdf8, #34d399);
  color: #04121f;
  font-weight: 700;
  cursor: pointer;
}`,
    js: `const cheers = ['Nice!', 'Keep going!', 'You got this!', 'Ship it!'];

document.getElementById('cheer').addEventListener('click', () => {
  const pick = cheers[Math.floor(Math.random() * cheers.length)];
  document.getElementById('output').textContent = pick;
  console.log('Cheer clicked:', pick);
});

console.log('Starter loaded. Open the console panel to see output.');`,
  },
  {
    id: 'js-functions',
    name: 'JS functions practice',
    html: `<h1>Function practice</h1>
<p>Open the console panel to see the results.</p>`,
    css: `body {
  margin: 0;
  padding: 2rem;
  font-family: system-ui, sans-serif;
  background: #101026;
  color: #e2e8f0;
}`,
    js: `// 1. Write a function that returns the sum of two numbers.
function add(a, b) {
  return a + b;
}

// 2. TODO: make multiply() work.
function multiply(a, b) {
  return 0; // <-- change me
}

// 3. TODO: reverse a string without using .reverse().
function reverseString(text) {
  let out = '';
  for (let i = text.length - 1; i >= 0; i--) {
    out += text[i];
  }
  return out;
}

console.log('add(2, 3) =', add(2, 3));
console.log('multiply(4, 5) =', multiply(4, 5));
console.log('reverseString("hello") =', reverseString('hello'));`,
  },
  {
    id: 'dom',
    name: 'DOM manipulation',
    html: `<main>
  <h1>Todo list</h1>
  <form id="todo-form">
    <input id="todo-input" placeholder="Add a task..." autocomplete="off" />
    <button type="submit">Add</button>
  </form>
  <ul id="todo-list"></ul>
</main>`,
    css: `body {
  margin: 0;
  font-family: system-ui, sans-serif;
  background: #0f0f24;
  color: #e2e8f0;
}
main { max-width: 480px; margin: 2rem auto; padding: 0 1rem; }
form { display: flex; gap: 0.5rem; }
input {
  flex: 1;
  padding: 0.55rem 0.8rem;
  border-radius: 0.5rem;
  border: 1px solid #333355;
  background: #1a1a36;
  color: inherit;
}
button {
  padding: 0.55rem 1rem;
  border: none;
  border-radius: 0.5rem;
  background: #38bdf8;
  color: #04121f;
  font-weight: 700;
  cursor: pointer;
}
li { padding: 0.5rem 0; border-bottom: 1px solid #2a2a4a; cursor: pointer; }
li.done { opacity: 0.5; text-decoration: line-through; }`,
    js: `const form = document.getElementById('todo-form');
const input = document.getElementById('todo-input');
const list = document.getElementById('todo-list');

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const text = input.value.trim();
  if (!text) return;

  const item = document.createElement('li');
  item.textContent = text;
  item.addEventListener('click', () => item.classList.toggle('done'));
  list.appendChild(item);

  console.log('Added todo:', text);
  input.value = '';
  input.focus();
});`,
  },
  {
    id: 'css-layout',
    name: 'CSS grid layout',
    html: `<div class="layout">
  <header>Header</header>
  <aside>Sidebar</aside>
  <main>Main content</main>
  <footer>Footer</footer>
</div>`,
    css: `body {
  margin: 0;
  font-family: system-ui, sans-serif;
  background: #0b0b1e;
  color: #e2e8f0;
}

.layout {
  display: grid;
  gap: 0.75rem;
  padding: 0.75rem;
  min-height: 100vh;
  grid-template-areas:
    'header header'
    'sidebar main'
    'footer footer';
  grid-template-columns: 200px 1fr;
  grid-template-rows: auto 1fr auto;
}

header, aside, main, footer {
  display: grid;
  place-items: center;
  border-radius: 0.75rem;
  padding: 1rem;
  font-weight: 600;
}

header { grid-area: header; background: #1d4ed8; }
aside  { grid-area: sidebar; background: #7c3aed; }
main   { grid-area: main; background: #0f766e; }
footer { grid-area: footer; background: #b45309; }

@media (max-width: 600px) {
  .layout {
    grid-template-areas:
      'header'
      'main'
      'sidebar'
      'footer';
    grid-template-columns: 1fr;
  }
}`,
    js: `console.log('Try rearranging the grid-template-areas to change the layout.');`,
  },
]
