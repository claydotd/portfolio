import { useState, useCallback, useEffect } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CheckResult {
  pass: boolean;
  message: string;
}

interface TodoChecklistItem {
  id: string;
  text: string;
  validator: (code: string) => boolean;
}

interface Step {
  title: string;
  concept: string;
  goal: string;
  beginnerExplanation: string;
  hint: string;
  syntaxHint?: string;
  starterCode: string;
  solutionCode: string;
  checklist: TodoChecklistItem[];
  check: (code: string) => CheckResult;
}

// ─── Step definitions ─────────────────────────────────────────────────────────

const STEPS: Step[] = [
  {
    title: "Create your todo type",
    concept: "TypeScript basics",
    goal: "Create the Todo type that describes each task.",

    beginnerExplanation:
      "Before we can build a todo app, we need to describe what a todo looks like. In TypeScript we do that using a type or interface.",

    hint:
      "Create a `Todo` type with three properties: `id`, `text`, and `completed`.",

    syntaxHint: `type Todo = {
  id: number;
  text: string;
  completed: boolean;
};`,

    checklist: [
      {
        id: "todo-type",
        text: "Create a Todo type or interface",
        validator: (code) =>
          /type\s+Todo\s*=/.test(code) ||
          /interface\s+Todo\s*\{/.test(code),
      },
      {
        id: "todo-id",
        text: "Add an id field with type number",
        validator: (code) => /id\s*:\s*number/.test(code),
      },
      {
        id: "todo-text",
        text: "Add a text field with type string",
        validator: (code) => /text\s*:\s*string/.test(code),
      },
      {
        id: "todo-completed",
        text: "Add a completed field with type boolean",
        validator: (code) => /completed\s*:\s*boolean/.test(code),
      },
    ],

    starterCode: `import { useState } from "react";

// Create a Todo type here.
// It should contain:
// - id
// - text
// - completed

export const TodoList = () => {
  return <div>TodoList</div>;
};`,

    solutionCode: `import { useState } from "react";

type Todo = {
  id: number;
  text: string;
  completed: boolean;
};

export const TodoList = () => {
  return <div>TodoList</div>;
};`,

    check: (code) => {
      const hasType =
        /type\s+Todo\s*=/.test(code) ||
        /interface\s+Todo\s*\{/.test(code);

      const hasIdField = /id\s*:\s*number/.test(code);
      const hasTextField = /text\s*:\s*string/.test(code);
      const hasCompletedField = /completed\s*:\s*boolean/.test(code);

      if (!hasType) {
        return {
          pass: false,
          message: "Create a Todo type or interface first.",
        };
      }

      if (!hasIdField) {
        return {
          pass: false,
          message: "Add an id field with type number.",
        };
      }

      if (!hasTextField) {
        return {
          pass: false,
          message: "Add a text field with type string.",
        };
      }

      if (!hasCompletedField) {
        return {
          pass: false,
          message: "Add a completed field with type boolean.",
        };
      }

      return {
        pass: true,
        message: "Great! Your Todo type is complete.",
      };
    },
  },

  {
    title: "Create todo state",
    concept: "React useState",
    goal: "Store todos inside React state.",

    beginnerExplanation:
      "React state lets your component remember data. We'll create a todos array that React can update whenever tasks are added or changed.",

    hint:
      "Use `useState<Todo[]>([])` to create an empty todos array.",

    syntaxHint: `const [todos, setTodos] = useState<Todo[]>([]);`,

    checklist: [
      {
        id: "todos-state",
        text: "Create todos state using useState<Todo[]>([])",
        validator: (code) =>
          /useState\s*<\s*Todo\s*\[\s*\]\s*>/.test(code) &&
          /todos/.test(code),
      },
    ],

    starterCode: `import { useState } from "react";

type Todo = {
  id: number;
  text: string;
  completed: boolean;
};

export const TodoList = () => {

  // Create todos state here.

  return <div>TodoList</div>;
};`,

    solutionCode: `import { useState } from "react";

type Todo = {
  id: number;
  text: string;
  completed: boolean;
};

export const TodoList = () => {
  const [todos, setTodos] = useState<Todo[]>([]);

  return <div>TodoList</div>;
};`,

    check: (code) => {
      const hasTodosState =
        /useState\s*<\s*Todo\s*\[\s*\]\s*>/.test(code) &&
        /todos/.test(code);

      if (!hasTodosState) {
        return {
          pass: false,
          message: "Create todos state using useState<Todo[]>([]).",
        };
      }

      return {
        pass: true,
        message: "Nice! Your todos are now stored in React state.",
      };
    },
  },

  {
    title: "Create input state",
    concept: "Controlled inputs",
    goal: "Store what the user types into the input.",

    beginnerExplanation:
      "Controlled inputs keep form values inside React state. This lets React stay in sync with what the user types.",

    hint: "Create inputText state using useState(\"\")",

    syntaxHint: `const [inputText, setInputText] = useState("");`,

    checklist: [
      {
        id: "input-state",
        text: "Create inputText state",
        validator: (code) =>
          /inputText/.test(code) &&
          /useState\s*\(\s*["']{2}\s*\)/.test(code),
      },
    ],

    starterCode: `import { useState } from "react";

type Todo = {
  id: number;
  text: string;
  completed: boolean;
};

export const TodoList = () => {
  const [todos, setTodos] = useState<Todo[]>([]);

  // Create inputText state here.

  return <div>TodoList</div>;
};`,

    solutionCode: `import { useState } from "react";

type Todo = {
  id: number;
  text: string;
  completed: boolean;
};

export const TodoList = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [inputText, setInputText] = useState("");

  return <div>TodoList</div>;
};`,

    check: (code) => {
      const hasInputState =
        /inputText/.test(code) &&
        /useState\s*\(\s*["']{2}\s*\)/.test(code);

      if (!hasInputState) {
        return {
          pass: false,
          message: 'Create inputText state with useState("").',
        };
      }

      return {
        pass: true,
        message: "Awesome! Your input state is ready.",
      };
    },
  },

  {
    title: "Render an input field",
    concept: "JSX inputs",
    goal: "Display a text input where users can type a todo.",

    beginnerExplanation:
      "React components return JSX. We can render HTML elements like inputs directly inside the component.",

    hint:
      "Add an `input` element inside the return statement.",

    syntaxHint: `<input />`,

    checklist: [
      {
        id: "render-input",
        text: "Render an input element",
        validator: (code) => /<input/.test(code),
      },
    ],

    starterCode: `import { useState } from "react";

type Todo = {
  id: number;
  text: string;
  completed: boolean;
};

export const TodoList = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [inputText, setInputText] = useState("");

  return (
    <div>

      {/* Render an input here */}

    </div>
  );
};`,

    solutionCode: `import { useState } from "react";

type Todo = {
  id: number;
  text: string;
  completed: boolean;
};

export const TodoList = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [inputText, setInputText] = useState("");

  return (
    <div>
      <input />
    </div>
  );
};`,

    check: (code) => {
      if (!/<input/.test(code)) {
        return {
          pass: false,
          message: "Render an input element.",
        };
      }

      return {
        pass: true,
        message: "Nice! Your app now has an input field.",
      };
    },
  },

  {
    title: "Connect the input to state",
    concept: "Controlled inputs",
    goal: "Keep the input synced with React state.",

    beginnerExplanation:
      "Controlled inputs let React fully manage what appears inside the text field.",

    hint:
      "Use `value={inputText}` and update state with `onChange`.",

    syntaxHint: `value={inputText}
onChange={(e) => setInputText(e.target.value)}`,

    checklist: [
      {
        id: "input-value",
        text: "Add value={inputText}",
        validator: (code) =>
          /value=\{inputText\}/.test(code),
      },
      {
        id: "input-onchange",
        text: "Add an onChange handler",
        validator: (code) =>
          /onChange=/.test(code) &&
          /setInputText/.test(code),
      },
    ],

    starterCode: `import { useState } from "react";

type Todo = {
  id: number;
  text: string;
  completed: boolean;
};

export const TodoList = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [inputText, setInputText] = useState("");

  return (
    <div>
      <input />
    </div>
  );
};`,

    solutionCode: `import { useState } from "react";

type Todo = {
  id: number;
  text: string;
  completed: boolean;
};

export const TodoList = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [inputText, setInputText] = useState("");

  return (
    <div>
      <input
        placeholder="Add a todo..."
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
      />
    </div>
  );
};`,

    check: (code) => {
      const hasValue =
        /value=\{inputText\}/.test(code);

      const hasOnChange =
        /onChange=/.test(code) &&
        /setInputText/.test(code);

      if (!hasValue) {
        return {
          pass: false,
          message: "Connect the input value to inputText.",
        };
      }

      if (!hasOnChange) {
        return {
          pass: false,
          message: "Add an onChange handler.",
        };
      }

      return {
        pass: true,
        message: "Awesome! Your input is now controlled by React.",
      };
    },
  },

  {
    title: "Render an add button",
    concept: "Buttons in React",
    goal: "Add a button users can click to create todos.",

    beginnerExplanation:
      "Buttons trigger actions in React apps. Soon we'll connect this button to a function.",

    hint:
      "Render a `button` with the text Add Todo.",

    syntaxHint: `<button>Add Todo</button>`,

    checklist: [
      {
        id: "render-button",
        text: "Render a button",
        validator: (code) => /<button/.test(code),
      },
    ],

    starterCode: `import { useState } from "react";

type Todo = {
  id: number;
  text: string;
  completed: boolean;
};

export const TodoList = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [inputText, setInputText] = useState("");

  return (
    <div>
      <input
        placeholder="Add a todo..."
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
      />

      {/* Add button here */}
    </div>
  );
};`,

    solutionCode: `import { useState } from "react";

type Todo = {
  id: number;
  text: string;
  completed: boolean;
};

export const TodoList = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [inputText, setInputText] = useState("");

  return (
    <div>
      <input
        placeholder="Add a todo..."
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
      />

      <button>Add Todo</button>
    </div>
  );
};`,

    check: (code) => {
      if (!/<button/.test(code)) {
        return {
          pass: false,
          message: "Render a button element.",
        };
      }

      return {
        pass: true,
        message: "Great! Your app now has a button.",
      };
    },
  },

  {
    title: "Create the addTodo function",
    concept: "Functions",
    goal: "Create a function that will add new todos.",

    beginnerExplanation:
      "Functions let us organize logic into reusable actions.",

    hint:
      "Create a function named addTodo.",

    syntaxHint: `const addTodo = () => {

};`,

    checklist: [
      {
        id: "addtodo-function",
        text: "Create addTodo function",
        validator: (code) =>
          /const\s+addTodo\s*=\s*\(\s*\)\s*=>/.test(code),
      },
    ],

    starterCode: `import { useState } from "react";

type Todo = {
  id: number;
  text: string;
  completed: boolean;
};

export const TodoList = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [inputText, setInputText] = useState("");

  return (
    <div>
      <input
        placeholder="Add a todo..."
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
      />

      <button>Add Todo</button>
    </div>
  );
};`,

    solutionCode: `import { useState } from "react";

type Todo = {
  id: number;
  text: string;
  completed: boolean;
};

export const TodoList = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [inputText, setInputText] = useState("");

  const addTodo = () => {

  };

  return (
    <div>
      <input
        placeholder="Add a todo..."
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
      />

      <button>Add Todo</button>
    </div>
  );
};`,

    check: (code) => {
      const hasFunction =
        /const\s+addTodo\s*=\s*\(\s*\)\s*=>/.test(code);

      if (!hasFunction) {
        return {
          pass: false,
          message: "Create an addTodo function.",
        };
      }

      return {
        pass: true,
        message: "Nice! Your addTodo function is ready.",
      };
    },
  },

  {
    title: "Add a new todo",
    concept: "Updating arrays in state",
    goal: "Add a new todo object into the todos array.",

    beginnerExplanation:
      "When working with arrays in React state, we create a new array instead of changing the old one.",

    hint:
      "Use `setTodos([...todos, newTodo])`",

    syntaxHint: `setTodos([
  ...todos,
  {
    id: Date.now(),
    text: inputText,
    completed: false,
  },
]);`,

    checklist: [
      {
        id: "set-todos",
        text: "Call setTodos",
        validator: (code) => /setTodos/.test(code),
      },
      {
        id: "spread-todos",
        text: "Use ...todos",
        validator: (code) => /\.\.\.todos/.test(code),
      },
    ],

    starterCode: `import { useState } from "react";

type Todo = {
  id: number;
  text: string;
  completed: boolean;
};

export const TodoList = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [inputText, setInputText] = useState("");

  const addTodo = () => {

  };

  return (
    <div>
      <input
        placeholder="Add a todo..."
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
      />

      <button onClick={addTodo}>
        Add Todo
      </button>
    </div>
  );
};`,

    solutionCode: `import { useState } from "react";

type Todo = {
  id: number;
  text: string;
  completed: boolean;
};

export const TodoList = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [inputText, setInputText] = useState("");

  const addTodo = () => {
    setTodos([
      ...todos,
      {
        id: Date.now(),
        text: inputText,
        completed: false,
      },
    ]);
  };

  return (
    <div>
      <input
        placeholder="Add a todo..."
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
      />

      <button onClick={addTodo}>
        Add Todo
      </button>
    </div>
  );
};`,

    check: (code) => {
      const hasSetTodos = /setTodos/.test(code);

      const hasSpread = /\.\.\.todos/.test(code);

      if (!hasSetTodos) {
        return {
          pass: false,
          message: "Use setTodos to update state.",
        };
      }

      if (!hasSpread) {
        return {
          pass: false,
          message: "Use ...todos to keep existing items.",
        };
      }

      return {
        pass: true,
        message: "Amazing! Your app can now create todos.",
      };
    },
  },

  {
    title: "Render the todo list",
    concept: "Rendering arrays",
    goal: "Display todos on the page.",

    beginnerExplanation:
      "React can render arrays using the map method.",

    hint:
      "Use `todos.map(...)` to render each todo.",

    syntaxHint: `{todos.map((todo) => (
  <p key={todo.id}>{todo.text}</p>
))}`,

    checklist: [
      {
        id: "todos-map",
        text: "Use todos.map()",
        validator: (code) => /\.map\(/.test(code),
      },
    ],

    starterCode: `import { useState } from "react";

type Todo = {
  id: number;
  text: string;
  completed: boolean;
};

export const TodoList = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [inputText, setInputText] = useState("");

  const addTodo = () => {
    setTodos([
      ...todos,
      {
        id: Date.now(),
        text: inputText,
        completed: false,
      },
    ]);
  };

  return (
    <div>
      <input
        placeholder="Add a todo..."
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
      />

      <button onClick={addTodo}>
        Add Todo
      </button>

      {/* Render todos here */}

    </div>
  );
};`,

    solutionCode: `import { useState } from "react";

type Todo = {
  id: number;
  text: string;
  completed: boolean;
};

export const TodoList = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [inputText, setInputText] = useState("");

  const addTodo = () => {
    setTodos([
      ...todos,
      {
        id: Date.now(),
        text: inputText,
        completed: false,
      },
    ]);
  };

  return (
    <div>
      <input
        placeholder="Add a todo..."
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
      />

      <button onClick={addTodo}>
        Add Todo
      </button>

      {todos.map((todo) => (
        <p key={todo.id}>
          {todo.text}
        </p>
      ))}
    </div>
  );
};`,

    check: (code) => {
      if (!/\.map\(/.test(code)) {
        return {
          pass: false,
          message: "Use todos.map() to render todos.",
        };
      }

      return {
        pass: true,
        message: "Fantastic! Your todos now appear on the page.",
      };
    },
  },

  {
    title: "Clear the input after adding",
    concept: "Updating state",
    goal: "Reset the input after a todo is added.",

    beginnerExplanation:
      "After adding a todo, we usually clear the input so the user can type another one.",

    hint:
      "Call `setInputText(\"\")` after adding the todo.",

    syntaxHint: `setInputText("");`,

    checklist: [
      {
        id: "clear-input",
        text: "Clear inputText",
        validator: (code) =>
          /setInputText\s*\(\s*["']{2}\s*\)/.test(code),
      },
    ],

    starterCode: `import { useState } from "react";

type Todo = {
  id: number;
  text: string;
  completed: boolean;
};

export const TodoList = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [inputText, setInputText] = useState("");

  const addTodo = () => {
    setTodos([
      ...todos,
      {
        id: Date.now(),
        text: inputText,
        completed: false,
      },
    ]);
  };

  return (
    <div>
      <input
        placeholder="Add a todo..."
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
      />

      <button onClick={addTodo}>
        Add Todo
      </button>

      {todos.map((todo) => (
        <p key={todo.id}>
          {todo.text}
        </p>
      ))}
    </div>
  );
};`,

    solutionCode: `import { useState } from "react";

type Todo = {
  id: number;
  text: string;
  completed: boolean;
};

export const TodoList = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [inputText, setInputText] = useState("");

  const addTodo = () => {
    setTodos([
      ...todos,
      {
        id: Date.now(),
        text: inputText,
        completed: false,
      },
    ]);

    setInputText("");
  };

  return (
    <div>
      <input
        placeholder="Add a todo..."
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
      />

      <button onClick={addTodo}>
        Add Todo
      </button>

      {todos.map((todo) => (
        <p key={todo.id}>
          {todo.text}
        </p>
      ))}
    </div>
  );
};`,

    check: (code) => {
      const cleared =
        /setInputText\s*\(\s*["']{2}\s*\)/.test(code);

      if (!cleared) {
        return {
          pass: false,
          message: "Clear the input after adding a todo.",
        };
      }

      return {
        pass: true,
        message: "Perfect! Your todo app is complete.",
      };
    },
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const clamp = (n: number, min: number, max: number) =>
  Math.min(Math.max(n, min), max);

const renderHint = (raw: string) =>
  raw.replace(/`([^`]+)`/g, "<code>$1</code>");

// ─── Inline SVG icons ─────────────────────────────────────────────────────────

const CheckIcon = () => (
  <svg
    width="11"
    height="11"
    viewBox="0 0 11 11"
    aria-hidden="true"
    style={{ flexShrink: 0 }}
  >
    <polyline
      points="1.5,5.5 4.5,8.5 9.5,2.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const CrossIcon = () => (
  <svg
    width="11"
    height="11"
    viewBox="0 0 11 11"
    aria-hidden="true"
    style={{ flexShrink: 0 }}
  >
    <line
      x1="2.5"
      y1="2.5"
      x2="8.5"
      y2="8.5"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
    />
    <line
      x1="8.5"
      y1="2.5"
      x2="2.5"
      y2="8.5"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
    />
  </svg>
);

const ArrowRightIcon = () => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 12 12"
    aria-hidden="true"
    style={{ flexShrink: 0 }}
  >
    <polyline
      points="2.5,6 9.5,6"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />

    <polyline
      points="7,3 10,6 7,9"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// ─── Main component ───────────────────────────────────────────────────────────

export const TodoListPractice = () => {
  const [stepIndex, setStepIndex] = useState(0);

  const [completedSteps, setCompletedSteps] = useState<Set<number>>(
    new Set()
  );

  const [codeByStep, setCodeByStep] = useState<Record<number, string>>(
    () =>
      Object.fromEntries(
        STEPS.map((step, index) => [
          index,
          step.starterCode,
        ])
      )
  );

  const [code, setCode] = useState(STEPS[0].starterCode);

  const [checkResult, setCheckResult] = useState<CheckResult | null>(
    null
  );

  const [hintOpen, setHintOpen] = useState(false);

  const [showSolution, setShowSolution] = useState(false);

  const [hasCheckedCurrentStep, setHasCheckedCurrentStep] =
    useState(false);

  const step = STEPS[stepIndex];

  const isLastStep = stepIndex === STEPS.length - 1;

  const validatedChecklist = step.checklist.map((item) => ({
    ...item,
    complete: item.validator(code),
  }));

  const currentStepPassed = validatedChecklist.every(
    (item) => item.complete
  );

  const allDone = completedSteps.size === STEPS.length;

  const lineCount = code.split("\n").length;

  useEffect(() => {
    setCode(
      codeByStep[stepIndex] ??
        STEPS[stepIndex].starterCode
    );

    setCheckResult(null);
    setHintOpen(false);
    setShowSolution(false);
    setHasCheckedCurrentStep(
      completedSteps.has(stepIndex)
    );
  }, [stepIndex]);

  const goToStep = useCallback((index: number) => {
    setStepIndex(clamp(index, 0, STEPS.length - 1));
  }, []);

  const handleCheck = () => {
    const result = step.check(code);

    setCheckResult(result);

    setHasCheckedCurrentStep(true);

    const allChecklistItemsComplete = step.checklist.every(
      (item) => item.validator(code)
    );

    if (result.pass && allChecklistItemsComplete) {
      setCompletedSteps((prev) => new Set([...prev, stepIndex]));
    }
  };

  const handleNext = () => {
    if (!isLastStep) {
      goToStep(stepIndex + 1);
    }
  };

  const handleShowSolution = () => {
    setShowSolution(true);
    setCode(step.solutionCode);

    setCodeByStep((prev) => ({
      ...prev,
      [stepIndex]: step.solutionCode,
    }));

    setCheckResult(null);
  };

  const handleTabKey = (
    e: React.KeyboardEvent<HTMLTextAreaElement>
  ) => {
    if (e.key === "Tab") {
      e.preventDefault();

      const el = e.currentTarget;

      const start = el.selectionStart;
      const end = el.selectionEnd;

      const next =
        code.substring(0, start) +
        "  " +
        code.substring(end);

      setCode(next);

      setCodeByStep((prev) => ({
        ...prev,
        [stepIndex]: next,
      }));

      requestAnimationFrame(() => {
        el.selectionStart = el.selectionEnd = start + 2;
      });
    }
  };

  return (
    <section className="page">
      <header className="hero">
        <p className="pill">React Practice Pal · Applet</p>

        <h1>Build a Todo List</h1>

        <p className="subtitle">
          Learn React step-by-step by building a real todo
          list app.
        </p>
      </header>

      <div className="practice-progress">
        <div style={{ display: "flex", gap: "6px" }}>
          {STEPS.map((s, i) => {
            const isDone = completedSteps.has(i);

            const isActive = i === stepIndex;

            return (
              <button
                key={i}
                type="button"
                onClick={() => goToStep(i)}
                aria-label={`Go to step ${i + 1}: ${s.title}`}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  border: isDone
                    ? "1.5px solid rgba(134,239,172,0.8)"
                    : isActive
                    ? "1.5px solid var(--yellow)"
                    : "1.5px solid var(--border)",

                  background: isDone
                    ? "rgba(134,239,172,0.2)"
                    : isActive
                    ? "var(--yellow-soft)"
                    : "var(--cream-mid)",

                  color: isDone
                    ? "#2d6a35"
                    : isActive
                    ? "#3a2800"
                    : "var(--ink-muted)",

                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "11px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {isDone ? <CheckIcon /> : i + 1}
              </button>
            );
          })}
        </div>

        <div className="practice-progress-bar">
          <div
            className="practice-progress-fill"
            style={{
              width: `${
                (completedSteps.size / STEPS.length) * 100
              }%`,
            }}
          />
        </div>

        <span
          style={{
            fontSize: "12px",
            color: "var(--ink-muted)",
          }}
        >
          {completedSteps.size}/{STEPS.length} done
        </span>
      </div>

      <div className="practice-layout">
        <aside className="section practice-sidebar">
          <div className="practice-sidebar-inner">
            <div style={{ padding: "1.4rem" }}>
              <span
                className="pill"
                style={{
                  background: "var(--yellow-soft)",
                  borderColor: "var(--border-warm)",
                  color: "#3a2800",
                  marginBottom: "0.75rem",
                }}
              >
                {step.concept}
              </span>

              <h2
                style={{
                  marginTop: "0.6rem",
                  marginBottom: "0.5rem",
                }}
              >
                Step {stepIndex + 1}: {step.title}
              </h2>

              <p className="section-subtitle">
                {step.goal}
              </p>

              <div
                className="k2k-block"
                style={{
                  marginTop: "1rem",
                  marginBottom: "1rem",
                }}
              >
                <strong>What you're learning</strong>

                <p
                  style={{
                    marginTop: "0.6rem",
                    marginBottom: 0,
                  }}
                >
                  {step.beginnerExplanation}
                </p>
              </div>

              <button
                type="button"
                className="btn ghost"
                onClick={() => setHintOpen((v) => !v)}
                style={{
                  marginBottom: hintOpen ? "0.8rem" : 0,
                }}
              >
                {hintOpen ? "Hide hints" : "Show hints"}
              </button>

              {hintOpen && (
                <>
                  <div
                    className="k2k-block"
                    style={{
                      background: "var(--yellow-soft)",
                      borderColor: "var(--border-warm)",
                      marginBottom: "1rem",
                    }}
                  >
                    <strong>Hint</strong>

                    <div
                      style={{ marginTop: "0.6rem" }}
                      dangerouslySetInnerHTML={{
                        __html: renderHint(step.hint),
                      }}
                    />
                  </div>

                  {step.syntaxHint && (
                    <div
                      className="k2k-block"
                      style={{
                        background: "#181825",
                        borderColor: "#313244",
                        color: "#cdd6f4",
                        fontFamily: "monospace",
                        fontSize: "12px",
                        overflowX: "auto",
                      }}
                    >
                      <strong
                        style={{
                          color: "#f9e2af",
                          display: "block",
                          marginBottom: "0.6rem",
                        }}
                      >
                        Syntax reminder
                      </strong>

                      <pre
                        style={{
                          margin: 0,
                          whiteSpace: "pre-wrap",
                        }}
                      >
                        {step.syntaxHint}
                      </pre>
                    </div>
                  )}
                </>
              )}

              <div className="practice-checklist">
                {validatedChecklist.map((item, index) => (
                  <div
                    key={item.id}
                    className={`practice-checklist-item ${
                      item.complete ? "complete" : ""
                    }`}
                  >
                    <div
                      className={`practice-checklist-icon ${
                        item.complete ? "complete" : ""
                      }`}
                    >
                      {item.complete ? (
                        <CheckIcon />
                      ) : (
                        index + 1
                      )}
                    </div>

                    <span>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </aside>

        <main className="section practice-editor">
          <div className="practice-editor-header">
            <span
              style={{
                fontFamily: "monospace",
                fontSize: "12px",
                color: "#a6adc8",
              }}
            >
              TodoList.tsx
            </span>

            {!showSolution && (
              <button
                type="button"
                className="btn ghost"
                style={{
                  fontSize: "11px",
                  padding: "3px 10px",
                }}
                onClick={handleShowSolution}
              >
                Show solution
              </button>
            )}
          </div>

          <div className="practice-editor-shell">
            <div className="practice-line-numbers">
              {Array.from({ length: lineCount }, (_, i) => (
                <div
                  key={i}
                  style={{ paddingRight: 8 }}
                >
                  {i + 1}
                </div>
              ))}
            </div>

            <textarea
              value={code}
              onChange={(e) => {
                const next = e.target.value;

                setCode(next);

                setCodeByStep((prev) => ({
                  ...prev,
                  [stepIndex]: next,
                }));

                setCheckResult(null);
                setShowSolution(false);
              }}
              onKeyDown={handleTabKey}
              spellCheck={false}
              className="practice-textarea"
            />
          </div>

          {/* Live preview */}
          {stepIndex >= 3 && (
            <div
              className="k2k-block"
              style={{
                margin: "1rem",
                background: "var(--cream-mid)",
              }}
            >
              <strong
                style={{
                  display: "block",
                  marginBottom: "0.8rem",
                }}
              >
                Goal Preview
              </strong>

              <div
                style={{
                  display: "flex",
                  gap: "0.5rem",
                  marginBottom: "1rem",
                }}
              >
                <input
                  placeholder="Add a todo..."
                  style={{
                    padding: "0.6rem",
                    borderRadius: 8,
                    border: "1px solid var(--border)",
                    flex: 1,
                  }}
                />

                {stepIndex >= 5 && (
                  <button
                    type="button"
                    className="btn primary"
                  >
                    Add Todo
                  </button>
                )}
              </div>

              {stepIndex >= 8 && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.5rem",
                  }}
                >
                  <div className="k2k-block">
                    Learn React
                  </div>

                  <div className="k2k-block">
                    Build a todo app
                  </div>
                </div>
              )}
            </div>
          )}

          <div style={{ padding: "1.2rem" }}>
            {checkResult && (
              <div
                className={`k2k-feedback ${
                  checkResult.pass
                    ? "success"
                    : "error"
                }`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  marginBottom: "1rem",
                }}
              >
                {checkResult.pass ? (
                  <CheckIcon />
                ) : (
                  <CrossIcon />
                )}

                <span>{checkResult.message}</span>
              </div>
            )}

            <div className="practice-actions">
              <button
                type="button"
                className="btn primary"
                onClick={handleCheck}
              >
                Check my progress
              </button>

              <button
                type="button"
                className="btn ghost"
                disabled={
                  !currentStepPassed ||
                  !hasCheckedCurrentStep ||
                  isLastStep
                }
                onClick={handleNext}
                style={{
                  opacity:
                    currentStepPassed &&
                    hasCheckedCurrentStep &&
                    !isLastStep
                      ? 1
                      : 0.4,
                }}
              >
                Next step
                <ArrowRightIcon />
              </button>
            </div>
          </div>

          {allDone && (
            <div className="practice-complete-banner">
              <h2>Todo app complete 🎉</h2>

              <p className="section-subtitle">
                You've successfully built a real React todo
                app step-by-step.
              </p>
            </div>
          )}
        </main>
      </div>
    </section>
  );
};