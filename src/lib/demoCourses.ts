import { Course } from "./types";

export const DEMO_COURSES: Course[] = [
  {
    id: "full-stack-web-dev",
    title: "Full-Stack Web Development Bootcamp",
    description: "Master modern web development from HTML, CSS & JavaScript to React, Node.js and REST APIs in structured daily lessons.",
    thumbnail: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80",
    author: "freeCodeCamp.org",
    sourceUrl: "https://www.youtube.com/watch?v=nu_pCVPKzTk",
    originalVideoId: "nu_pCVPKzTk",
    totalDurationSeconds: 14400, // 4 hours
    dailyCommitmentMinutes: 45,
    level: "Beginner",
    createdAt: new Date().toISOString(),
    placementTest: [
      {
        id: "pt-1",
        question: "What is the primary role of semantic HTML tags like <header>, <article>, and <nav>?",
        options: [
          "They improve accessibility (screen readers) and SEO by providing meaningful structure to the document",
          "They are strictly required for JavaScript DOM manipulation to function",
          "They automatically apply predefined responsive CSS styling across all browsers",
          "They encrypt sensitive payload contents before sending them over the network"
        ],
        correctIndex: 0,
        explanation: "Semantic HTML tags give meaning to the structure of web content, assisting screen readers, search engines, and developers.",
        associatedLessonIds: ["lesson-1", "lesson-2"]
      },
      {
        id: "pt-2",
        question: "In JavaScript, what happens when you use 'const' to declare an object?",
        options: [
          "The object becomes completely immutable; properties cannot be added, changed, or removed",
          "The binding/reference cannot be reassigned, but properties of the object can still be modified",
          "The object is automatically cloned into a deep copy across all worker threads",
          "It forces the object to be garbage collected as soon as the function returns"
        ],
        correctIndex: 1,
        explanation: "'const' creates a read-only reference to a value, meaning the variable identifier cannot be reassigned. However, the properties of the object can be mutated unless Object.freeze() is used.",
        associatedLessonIds: ["lesson-3", "lesson-4"]
      },
      {
        id: "pt-3",
        question: "In React, what is the core purpose of the 'key' prop when rendering dynamic lists?",
        options: [
          "It styles list elements using a unique CSS pseudo-selector",
          "It helps React identify which items have changed, been added, or removed for efficient DOM reconciliation",
          "It connects the React frontend directly to the database primary key",
          "It prevents the parent component from ever re-rendering when state updates"
        ],
        correctIndex: 1,
        explanation: "Keys help React track list item identities across renders, allowing the virtual DOM reconciler to reuse existing DOM nodes efficiently.",
        associatedLessonIds: ["lesson-5", "lesson-6"]
      }
    ],
    modules: [
      {
        id: "mod-1",
        title: "Module 1: Modern Frontend Foundations",
        description: "Understanding the web stack: HTML5 semantic architecture, responsive layouts with CSS Flexbox & Grid, and modern ES6+ JavaScript.",
        lessons: [
          {
            id: "lesson-1",
            title: "HTML5 Semantic Structure & Accessibility",
            description: "Learn how the browser parses markup and why accessible, semantic web architecture is essential for modern web applications.",
            durationSeconds: 1500,
            startSeconds: 0,
            endSeconds: 1500,
            videoId: "nu_pCVPKzTk",
            keyTakeaways: [
              "Semantic HTML conveys meaning to both the browser and assistive technology.",
              "Document Object Model (DOM) is a tree-based representation of the HTML document.",
              "Always prioritize native semantic elements (<button>, <nav>) over generic <div> tags."
            ],
            notes: `### HTML5 Architecture & Accessibility

#### 1. Why Semantics Matter
Using semantic elements such as \`<main>\`, \`<section>\`, \`<article>\`, and \`<aside>\` allows search engine crawlers and screen readers to understand the structural hierarchy of your web application without guessing.

\`\`\`html
<!-- Semantic Document Skeleton -->
<header>
  <nav aria-label="Main Navigation">
    <a href="/">Home</a>
    <a href="/courses">Courses</a>
  </nav>
</header>
<main>
  <article>
    <h1>Modern Web Architecture</h1>
    <p>Semantic tags improve accessibility and maintainability.</p>
  </article>
</main>
\`\`\`

#### 2. The Document Object Model (DOM)
When a browser downloads an HTML file, the HTML parser transforms the text into DOM nodes. The CSS parser creates the CSSOM (CSS Object Model). The combination of these two forms the Render Tree.`,
            quizzes: [
              {
                id: "q-1-1",
                question: "Which of the following is a semantic HTML element that indicates standalone, self-contained content?",
                options: ["<div>", "<span>", "<article>", "<font>"],
                correctIndex: 2,
                explanation: "<article> represents a self-contained composition in a document, page, application, or site that is independently distributable or reusable.",
                replayTimestamp: 340
              },
              {
                id: "q-1-2",
                question: "What two data structures does the browser combine to construct the final Render Tree?",
                options: [
                  "The DOM (Document Object Model) and the CSSOM (CSS Object Model)",
                  "The JavaScript AST and the JSON Web Token",
                  "The Service Worker cache and LocalStorage",
                  "The TCP Window and the HTTP/2 Frame"
                ],
                correctIndex: 0,
                explanation: "The browser combines the DOM and CSSOM to build the Render Tree, which calculates the visual layout of visible elements.",
                replayTimestamp: 720
              }
            ]
          },
          {
            id: "lesson-2",
            title: "Responsive Layouts: CSS Flexbox vs Grid",
            description: "Deep dive into 1D (Flexbox) and 2D (Grid) layout models to create responsive, fluid web interfaces without brittle media queries.",
            durationSeconds: 1800,
            startSeconds: 1500,
            endSeconds: 3300,
            videoId: "nu_pCVPKzTk",
            keyTakeaways: [
              "Flexbox is ideal for one-dimensional layouts (either a row OR a column).",
              "CSS Grid is designed for two-dimensional layouts (rows AND columns simultaneously).",
              "Use 'minmax()' and 'auto-fit' in CSS Grid for fluid, media-query-free responsive cards."
            ],
            notes: `### CSS Flexbox & CSS Grid Mastery

#### Flexbox: One-Dimensional Layouts
Flexbox aligns items along a main axis and a cross axis.

\`\`\`css
.nav-container {
  display: flex;
  justify-content: space-between; /* Main axis alignment */
  align-items: center;            /* Cross axis alignment */
  gap: 1.5rem;
}
\`\`\`

#### Grid: Two-Dimensional Layouts
CSS Grid allows defining tracks on both axes simultaneously:

\`\`\`css
.course-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
}
\`\`\``,
            quizzes: [
              {
                id: "q-2-1",
                question: "When should you prefer CSS Grid over CSS Flexbox?",
                options: [
                  "When aligning items in two dimensions (rows AND columns simultaneously)",
                  "When centering a single text string horizontally",
                  "Whenever JavaScript animations are required",
                  "CSS Grid is deprecated and should never be used"
                ],
                correctIndex: 0,
                explanation: "Flexbox handles 1D layouts (rows or columns), while CSS Grid handles 2D layouts (rows and columns together).",
                replayTimestamp: 1890
              }
            ]
          }
        ]
      },
      {
        id: "mod-2",
        title: "Module 2: JavaScript Mastery & Asynchronous Programming",
        description: "Master modern ES6+ features, closures, event loop mechanics, and Promises / async-await.",
        lessons: [
          {
            id: "lesson-3",
            title: "ES6+ Modern JavaScript, Scope & Closures",
            description: "Explore arrow functions, destructuring, rest/spread operators, lexical scope, and practical memory management with closures.",
            durationSeconds: 2100,
            startSeconds: 3300,
            endSeconds: 5400,
            videoId: "nu_pCVPKzTk",
            keyTakeaways: [
              "Lexical scope means inner functions have access to variables declared in their outer scope.",
              "A closure is formed when a function retains access to its enclosing lexical scope even when executed outside that scope.",
              "Arrow functions inherit 'this' lexically from their enclosing execution context."
            ],
            notes: `### Scope, Closures, and Modern Syntax

#### What is a Closure?
A closure is the combination of a function bundled together with references to its surrounding state (the lexical environment).

\`\`\`javascript
function createCounter(initialValue = 0) {
  let count = initialValue;
  return {
    increment: () => ++count,
    decrement: () => --count,
    getValue: () => count
  };
}

const counter = createCounter(10);
console.log(counter.increment()); // 11
console.log(counter.getValue());  // 11
\`\`\``,
            quizzes: [
              {
                id: "q-3-1",
                question: "What is a closure in JavaScript?",
                options: [
                  "A function that retains access to variables from its outer lexical scope even after the outer function has finished executing",
                  "A syntax error caused by forgetting to close a curly brace in a block",
                  "A method used to immediately terminate an asynchronous network request",
                  "A security vulnerability in the browser DOM"
                ],
                correctIndex: 0,
                explanation: "A closure allows an inner function to remember and access its parent function's variables even after the parent function has returned.",
                replayTimestamp: 3950
              }
            ]
          },
          {
            id: "lesson-4",
            title: "The Event Loop, Promises & Async/Await",
            description: "Demystify JavaScript single-threaded concurrency, the Call Stack, Web APIs, Microtask Queue (Promises), and Task Queue (setTimeout).",
            durationSeconds: 2400,
            startSeconds: 5400,
            endSeconds: 7800,
            videoId: "nu_pCVPKzTk",
            keyTakeaways: [
              "JavaScript is single-threaded: one Call Stack executes synchronous code.",
              "Microtasks (Promise .then callbacks, process.nextTick) have higher priority than Macrotasks (setTimeout, setInterval).",
              "Async/await is syntactic sugar over native Promises that makes asynchronous code look synchronous."
            ],
            notes: `### The Event Loop Architecture

1. **Call Stack**: Executes one function frame at a time (LIFO).
2. **Microtask Queue**: Resolved Promise handlers, queueMicrotask callbacks. Emptied *completely* after each call stack tick before any Macrotask is processed.
3. **Macrotask Queue**: setTimeout, setInterval, I/O callbacks.

\`\`\`javascript
async function fetchCourseData(courseId) {
  try {
    const res = await fetch(\`/api/courses/\${courseId}\`);
    if (!res.ok) throw new Error('Network error: ' + res.status);
    const data = await res.json();
    return data;
  } catch (err) {
    console.error('Failed to load course:', err);
    throw err;
  }
}
\`\`\``,
            quizzes: [
              {
                id: "q-4-1",
                question: "Which queue is given priority by the JavaScript Event Loop when the call stack clears?",
                options: [
                  "The Microtask Queue (Promises, queueMicrotask)",
                  "The Macrotask Queue (setTimeout, setInterval)",
                  "The Render Queue (requestIdleCallback)",
                  "All queues are executed randomly"
                ],
                correctIndex: 0,
                explanation: "The event loop always processes all pending microtasks before picking the next task from the macrotask queue.",
                replayTimestamp: 6200
              }
            ]
          }
        ]
      },
      {
        id: "mod-3",
        title: "Module 3: React Fundamentals & Component Lifecycle",
        description: "Build interactive, component-driven user interfaces using React Hooks, State, Effects, and Custom Hooks.",
        lessons: [
          {
            id: "lesson-5",
            title: "React Components, JSX, and State with useState",
            description: "Understand unidirectional data flow, declarative UI programming, and state management in modern React.",
            durationSeconds: 2700,
            startSeconds: 7800,
            endSeconds: 10500,
            videoId: "nu_pCVPKzTk",
            keyTakeaways: [
              "React components are pure functions of props and state.",
              "State updates trigger a re-render of the component and its children.",
              "Never mutate state directly; always use the state setter function."
            ],
            notes: `### React Declarative UI & useState

\`\`\`tsx
import { useState } from 'react';

export function LessonTracker({ totalLessons }: { totalLessons: number }) {
  const [completed, setCompleted] = useState(0);

  const markNext = () => {
    setCompleted((prev) => Math.min(prev + 1, totalLessons));
  };

  return (
    <div className="p-4 border rounded-lg">
      <p>Progress: {completed} / {totalLessons}</p>
      <button onClick={markNext} className="bg-indigo-600 text-white px-3 py-1 rounded">
        Complete Lesson
      </button>
    </div>
  );
}
\`\`\``,
            quizzes: [
              {
                id: "q-5-1",
                question: "Why should you pass a function to the state setter (e.g. setCount(prev => prev + 1)) when the new state depends on the previous state?",
                options: [
                  "Because state updates in React are batched and asynchronous, guaranteeing you read the freshest state value",
                  "Because arrow functions execute faster inside the browser engine",
                  "It is required by TypeScript to avoid compilation errors",
                  "It stops the component from re-rendering"
                ],
                correctIndex: 0,
                explanation: "Functional updates ensure you always compute the new state from the most recent pending state, avoiding stale closure bugs in batched updates.",
                replayTimestamp: 8650
              }
            ]
          },
          {
            id: "lesson-6",
            title: "Side Effects with useEffect & Custom Hooks",
            description: "Manage component lifecycles, subscriptions, API calls, and clean up functions with useEffect.",
            durationSeconds: 3900,
            startSeconds: 10500,
            endSeconds: 14400,
            videoId: "nu_pCVPKzTk",
            keyTakeaways: [
              "useEffect runs after the component renders to the screen.",
              "The dependency array dictates when the effect should re-run.",
              "Always return a cleanup function when subscribing to events or intervals."
            ],
            notes: `### useEffect Lifecycle & Cleanup

\`\`\`tsx
import { useEffect, useState } from 'react';

export function useVideoTimer(isPlaying: boolean) {
  const [secondsElapsed, setSecondsElapsed] = useState(0);

  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setSecondsElapsed((s) => s + 1);
    }, 1000);

    // Cleanup on unmount or when isPlaying changes
    return () => clearInterval(interval);
  }, [isPlaying]);

  return secondsElapsed;
}
\`\`\``,
            quizzes: [
              {
                id: "q-6-1",
                question: "When is the cleanup function returned by useEffect executed?",
                options: [
                  "Before the effect runs again on dependency change, and when the component unmounts",
                  "Only once when the browser window closes",
                  "Immediately before the component renders its initial JSX",
                  "Only if an unhandled JavaScript error occurs"
                ],
                correctIndex: 0,
                explanation: "React runs the cleanup function to tear down prior subscriptions before re-running the effect on dependency change, and when the component unmounts from the DOM.",
                replayTimestamp: 11400
              }
            ]
          }
        ]
      }
    ],
    schedule: [
      {
        dayNumber: 1,
        dateLabel: "Day 1: Foundations",
        estimatedMinutes: 55,
        lessonIds: ["lesson-1", "lesson-2"]
      },
      {
        dayNumber: 2,
        dateLabel: "Day 2: JavaScript Mastery",
        estimatedMinutes: 75,
        lessonIds: ["lesson-3", "lesson-4"]
      },
      {
        dayNumber: 3,
        dateLabel: "Day 3: React & Components",
        estimatedMinutes: 110,
        lessonIds: ["lesson-5", "lesson-6"]
      }
    ]
  },
  {
    id: "ai-llm-crash-course",
    title: "Large Language Models & Neural Networks from Scratch",
    description: "Understand Transformer architectures, attention mechanisms, tokenization, and fine-tuning from first principles.",
    thumbnail: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80",
    author: "Andrej Karpathy",
    sourceUrl: "https://www.youtube.com/watch?v=kCc8FmEb1nY",
    originalVideoId: "kCc8FmEb1nY",
    totalDurationSeconds: 7200, // 2 hours
    dailyCommitmentMinutes: 40,
    level: "Intermediate",
    createdAt: new Date().toISOString(),
    placementTest: [
      {
        id: "pt-ai-1",
        question: "What is the primary role of Self-Attention in the Transformer architecture?",
        options: [
          "It allows each token in a sequence to dynamically attend to and weigh the importance of all other tokens regardless of distance",
          "It compresses the input image into 8-bit quantized integers",
          "It acts as a firewall preventing adversarial prompt injections",
          "It converts continuous audio waves into spectrograms"
        ],
        correctIndex: 0,
        explanation: "Self-attention computes attention weights between all pairs of tokens in a sequence, allowing the model to capture long-range contextual relationships.",
        associatedLessonIds: ["ai-lesson-1"]
      }
    ],
    modules: [
      {
        id: "ai-mod-1",
        title: "Module 1: The Transformer Architecture",
        description: "Tokenization, embeddings, positional encoding, and self-attention.",
        lessons: [
          {
            id: "ai-lesson-1",
            title: "Tokenization & Byte-Pair Encoding (BPE)",
            description: "How raw text is transformed into integers through vocabulary dictionaries and BPE subword tokenizers.",
            durationSeconds: 3600,
            startSeconds: 0,
            endSeconds: 3600,
            videoId: "kCc8FmEb1nY",
            keyTakeaways: [
              "LLMs do not see characters or words directly; they process token integers.",
              "Byte-Pair Encoding (BPE) merges the most frequent pairs of bytes iteratively.",
              "Token boundaries affect model performance on arithmetic and foreign languages."
            ],
            notes: `### Tokenization & Byte-Pair Encoding

#### How Text Becomes Vectors
1. **Raw Text String**: "Hello world"
2. **Tokenizer**: Maps chunks of characters to integer token IDs (e.g., [15496, 995]).
3. **Embedding Matrix**: Each integer index looks up a dense vector in $R^d$ (e.g. 768 or 4096 dimensions).

\`\`\`python
# Conceptual BPE Tokenizer Step
def merge_vocab(tokens, pair_to_merge):
    new_tokens = []
    # Merge frequent adjacent token IDs into a new single token ID
    ...
\`\`\``,
            quizzes: [
              {
                id: "q-ai-1",
                question: "Why do modern LLMs use subword tokenization (like BPE) instead of whole-word or character-level tokenization?",
                options: [
                  "It strikes an optimal balance between vocabulary size and sequence length, handling rare words and typos gracefully",
                  "Because GPUs can only compute operations on subwords",
                  "Character-level models are mathematically impossible to train",
                  "Whole-word tokenization requires zero RAM"
                ],
                correctIndex: 0,
                explanation: "Subword tokenization prevents out-of-vocabulary (OOV) issues while keeping sequence lengths manageable.",
                replayTimestamp: 980
              }
            ]
          },
          {
            id: "ai-lesson-2",
            title: "Attention Mechanisms: Queries, Keys, and Values",
            description: "The mathematical intuition behind Scaled Dot-Product Attention: Q, K, and V matrix projections.",
            durationSeconds: 3600,
            startSeconds: 3600,
            endSeconds: 7200,
            videoId: "kCc8FmEb1nY",
            keyTakeaways: [
              "Query (Q): What am I looking for?",
              "Key (K): What do I contain?",
              "Value (V): What information do I pass along if selected?",
              "Attention formula: Softmax((Q * K^T) / sqrt(d_k)) * V"
            ],
            notes: `### Scaled Dot-Product Attention

$$\\text{Attention}(Q, K, V) = \\text{softmax}\\left(\\frac{QK^T}{\\sqrt{d_k}}\\right)V$$

- **Q (Query)**: Represents the token currently asking for information.
- **K (Key)**: Represents each token advertising its relevance.
- **$\\sqrt{d_k}$**: Scaling factor to prevent dot products from growing excessively large, which pushes softmax into vanishing gradient regions.`,
            quizzes: [
              {
                id: "q-ai-2",
                question: "Why is the dot product of Q and K scaled by 1/sqrt(d_k)?",
                options: [
                  "To prevent the dot products from growing large in high dimensions, which would cause softmax gradients to vanish",
                  "To convert the matrix into an integer format",
                  "To remove bias from training data",
                  "To enforce causal masking in encoder-decoder layers"
                ],
                correctIndex: 0,
                explanation: "As dimension d_k grows large, dot products grow in magnitude, driving the softmax function into regions with extremely small gradients. Dividing by sqrt(d_k) counteracts this.",
                replayTimestamp: 4200
              }
            ]
          }
        ]
      }
    ],
    schedule: [
      {
        dayNumber: 1,
        dateLabel: "Day 1: Tokenization",
        estimatedMinutes: 60,
        lessonIds: ["ai-lesson-1"]
      },
      {
        dayNumber: 2,
        dateLabel: "Day 2: Attention Deep Dive",
        estimatedMinutes: 60,
        lessonIds: ["ai-lesson-2"]
      }
    ]
  }
];
