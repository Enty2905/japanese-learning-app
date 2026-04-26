# Copilot / Codex Instructions — Japanese Learning App

## Mission
Implement the smallest correct change that satisfies the request.

Priorities:
1. Match the existing repository patterns first
2. Keep the diff minimal and local
3. Preserve current architecture and public contracts unless explicitly asked to change them
4. Prefer readable code over clever code

---

## Project Stack
- Frontend: React + Vite + JavaScript + SCSS
- Backend: Node.js + Express.js
- Database: PostgreSQL + Sequelize ORM 
- AI: RAG + Groq API (inside backend)

---

## Required Working Style

### Before writing code
- Read the target file and the nearest related files before editing.
- Inspect surrounding patterns and follow the local style of the repo.
- Trace the flow before changing logic:
  - frontend: route -> page -> component -> hook -> service
  - backend: route -> validator -> controller -> service -> model
- Prefer reusing existing helpers, services, and styles before creating new ones.
- If a requirement is ambiguous, first inspect existing code and infer from nearby patterns.
- Only ask for clarification when the ambiguity would change:
  - API contract
  - database schema
  - business logic
  - user-visible behavior

### While writing code
- Change only what is required for the task.
- Do NOT refactor unrelated code.
- Do NOT rename files, move folders, or change architecture unless requested.
- Do NOT add dependencies unless explicitly asked.
- Do NOT create new files unless they are necessary to complete the request.
- Do NOT mix formatting-only changes with logic changes in the same edit.
- Keep edits easy to review.

### After writing code
- Update only the imports and references affected by the change.
- Remove dead code introduced by your own edit in touched files only.
- Do not clean up unrelated legacy code.
- If the repo has a relevant lint/test/build command already configured, run the narrowest relevant check for the touched area.
- If checks fail for unrelated legacy reasons, report that clearly and do not refactor unrelated code to fix it.

---

## General Coding Rules
- Use English for code, comments, variable names, commit messages, and technical notes.
- Keep code simple, explicit, and maintainable.
- Prefer consistency with the current codebase over abstract “best practice”.
- Do not leave TODO, FIXME, or commented-out code unless explicitly requested.
- Do not add placeholder data, mock data, or demo UI unless asked.
- Do not expose secrets, API keys, or internal error details.
- Do not commit `.env`, `node_modules`, `build`, or `dist`.

---

## JavaScript Standards
- Use `const` by default, `let` only when reassignment is required.
- Never use `var`.
- Always use `===` and `!==`.
- Prefer early returns and guard clauses over deep nesting.
- Prefer `async/await` over `.then().catch()`.
- Prefer optional chaining and nullish coalescing when they improve clarity.
- Use destructuring when it improves readability, not by force.
- Avoid nested ternaries.
- Avoid large functions with mixed responsibilities.
- Avoid magic numbers repeated in multiple places; extract a constant when reused.
- Keep side effects explicit.
- Preserve the existing module system in each package:
  - if the package uses ESM, continue using ESM
  - if the package uses CommonJS, continue using CommonJS
- Do not mix ESM and CommonJS patterns in the same runtime layer unless the project already does so.

---

## Naming Conventions
- Files and folders: `kebab-case`
  - examples: `chat-box.jsx`, `groq.service.js`, `user-profile.scss`
- Variables and functions: `camelCase`
  - examples: `getUserById`, `chatHistory`, `handleSubmit`
- React components: `PascalCase`
  - examples: `ChatBox`, `VocabCard`
- Constants: `UPPER_SNAKE_CASE`
  - examples: `MAX_TOKEN`, `API_URL`
- Custom hooks must start with `use`
  - examples: `use-auth.js`, `use-chat-history.js`
- Boolean variables should read like booleans
  - examples: `isLoading`, `hasError`, `canSubmit`
- Event handlers should start with `handle`
  - examples: `handleClick`, `handleSubmit`, `handleClose`

---

## File and Folder Placement

### Rule
When a new file is necessary, place it in the nearest existing appropriate folder.

### Preferred frontend locations
- `src/components/` for reusable UI components
- `src/pages/` for route-level pages
- `src/hooks/` for reusable React hooks
- `src/services/` for API/service calls
- `src/context/` for React Context state
- `src/utils/` for pure helpers
- `src/router/` for route setup
- `src/assets/styles/` for SCSS files, variables, mixins, and global styles

### Preferred backend locations
- `src/routes/` for routes
- `src/controllers/` for controllers
- `src/services/` for business logic
- `src/models/` for Sequelize models
- `src/middlewares/` for middleware
- `src/validators/` for request validation
- `src/utils/` for pure backend helpers
- `src/config/` for environment and app configuration

### Structure rules
- Do not create parallel structures for the same concern.
- If the project already uses a feature-based structure, continue using it.
- If the project already uses a layer-based structure, continue using it.
- Do not introduce barrel files (`index.js`) unless the repo already uses them consistently.

---

## Frontend Rules (React + SCSS)

### React
- Use functional components only.
- Do NOT use class components.
- Keep components small and focused.
- If a component grows beyond roughly 150 lines, split it by responsibility.
- One component file should usually expose one main component.
- Prefer named exports unless the current folder pattern clearly uses default exports.
- Do not declare components inside other components unless there is a strong local reason.
- Do not put business logic directly inside JSX.
- Keep render code clean and predictable.

### Props and documentation
- This project is JavaScript-first.
- Use JSDoc for component props and exported functions when the shape is non-trivial.
- Use PropTypes only if the package is already installed and the surrounding code already uses PropTypes.
- Do NOT add PropTypes as a new dependency unless explicitly asked.

### Hooks and state
- Use React hooks only.
- Allowed common hooks:
  - `useState`
  - `useEffect`
  - `useCallback`
  - `useMemo`
  - `useRef`
  - `useContext`
- Do not use Redux.
- Use React Context only for true app-wide state such as auth, theme, or language.
- Prefer local state first.
- Lift state only when necessary.
- Do not put server data into Context unless the existing app architecture already does so.

### Effects and data fetching
- Do not fetch data directly inside page or presentational components if the logic can live in a custom hook or service.
- Put data-fetching logic in `hooks/` and request functions in `services/`.
- Use `useEffect` only when synchronization with an external system is actually needed:
  - network request lifecycle inside a custom hook
  - subscriptions
  - timers
  - imperative DOM integration
- Do not use `useEffect` just to derive state from props or other state.
- Do not add `useMemo` or `useCallback` by default; use them only when they solve a real dependency or rerender problem.

### Routing
- Keep the current router architecture unless explicitly asked to change it.
- If the project uses declarative routing, continue using:
  - `<Routes>`
  - `<Route>`
  - `useNavigate`
  - `useParams`
- Lazy load route-level pages when the current routing setup already supports that pattern.
- Do not migrate router mode, route objects, or framework-style routing unless explicitly requested.

### Forms
- Prefer controlled inputs unless the existing component pattern clearly uses uncontrolled refs.
- Keep form state close to the form.
- Prevent duplicate submits.
- Show loading and disabled states when a submit is in progress.
- Keep validation logic outside JSX when it grows beyond simple checks.

### Accessibility
- Prefer semantic HTML over clickable `div`s.
- Use `button` for actions and `a`/`Link` for navigation.
- Inputs must have labels or accessible names.
- Images must have meaningful `alt` text when required by the UI.
- Preserve keyboard accessibility.

### SCSS
- SCSS files live in `src/assets/styles/`.
- Each component may have its own `.scss` file when needed, named after the component.
- Use BEM naming:
  - `.block`
  - `.block__element`
  - `.block--modifier`
- Define colors, fonts, spacing, z-indexes, breakpoints, and other tokens in shared SCSS variables.
- Prefer shared variables and mixins over duplicated raw values.
- Do NOT use inline styles unless explicitly requested for a one-off dynamic style.
- Do NOT use Tailwind or another CSS framework.
- Avoid leaking styles globally.
- Scope component styles clearly.

---

## Backend Rules (Node.js + Express)

### Architecture
- Follow MVC strictly:
  - route -> validator -> controller -> service
- Controllers handle:
  - request parsing
  - calling the correct service
  - returning the response
- Controllers must NOT contain business logic.
- Services contain business rules and orchestration.
- Models contain persistence definitions and ORM behavior.
- Keep side effects and external API calls in services.

### Validation
- Validate all incoming request data before business logic runs.
- Prefer existing validation utilities or middleware already present in the repo.
- If no validation library exists, do lightweight manual validation instead of adding a new package.
- Never trust `req.body`, `req.params`, or `req.query` by default.

### Async and error handling
- Always use `async/await`.
- Do not use `.then().catch()`.
- Keep async flows explicit.
- Use the existing project error-handling pattern consistently.
- All route errors must reach centralized error middleware.
- Return safe error messages to clients.
- Never expose stack traces in production.
- Do not swallow errors silently.

### Response contracts
- Preserve the existing response shape used by the API.
- Do not change field names, nesting, or status codes unless requested.
- Use HTTP status codes correctly:
  - `200` success
  - `201` created
  - `400` bad request
  - `401` unauthorized
  - `403` forbidden
  - `404` not found
  - `409` conflict when appropriate
  - `500` internal server error

### Services
- All Groq API calls go in `src/services/groq.service.js`.
- All RAG logic goes in `src/services/rag.service.js`.
- Keep service functions focused.
- Separate external API calls from response formatting when practical.
- Reuse shared helpers instead of duplicating request-building logic.

### Logging and config
- Use the project’s existing logger if one exists.
- Do not leave `console.log` in committed code except intentional startup logs already matching repo style.
- Read configuration from the existing config/env pattern.
- Do not introduce a second environment-loading system unless explicitly requested.

---

## Database Rules (PostgreSQL + Sequelize)

### Models and schema
- Define models in `src/models/` with explicit data types and constraints.
- Respect the existing naming strategy:
  - table names
  - timestamps
  - underscored/camelCase conventions
- Keep associations close to the model setup pattern already used in the repo.

### Migrations
- Use Sequelize migrations for schema changes.
- Do NOT alter tables manually.
- Do NOT rely on `sync({ alter: true })` or `sync({ force: true })` for normal application schema changes.
- Migrations should be reversible whenever practical.
- Do not add destructive schema changes unless explicitly requested.

### Queries and transactions
- Use transactions for multi-step writes that affect multiple tables or records.
- Prefer the existing transaction style used by the codebase.
- Avoid raw SQL unless Sequelize cannot express the query clearly or efficiently.
- When reading data:
  - select only the needed attributes
  - include associations only when needed
  - avoid accidental N+1 patterns
  - paginate list endpoints when appropriate

### Security
- Never store passwords in plain text.
- Always hash passwords with bcrypt.
- Do not log password hashes, secrets, tokens, or sensitive personal data.

---

## Code Quality Rules
- One file should usually have one main responsibility.
- Keep helper functions near the code they support unless they are truly shared.
- Prefer pure utility functions in `utils/`.
- Avoid copy-paste duplication.
- Do not introduce abstractions for one-time usage.
- Do not create “generic” helpers unless there are at least two clear use cases.
- Keep public function signatures stable unless the task requires changing them.
- Favor explicit code over hidden magic.

---

## Comments and Documentation
- Do not add comments explaining obvious code.
- Add short comments only when the intent is non-obvious.
- Use JSDoc for exported functions or props with non-trivial shapes in JavaScript files.
- Keep comments accurate and minimal.

---

## Git and Diff Discipline
- Keep diffs focused.
- Do not touch unrelated files.
- Do not reorder imports, reformat files, or rename symbols unless necessary for the task.
- Do not modify lockfiles unless dependency changes were explicitly requested.
- Do not commit generated files unless the repo already tracks them.

---

## What NOT To Do
- Do NOT add extra features beyond the request.
- Do NOT create extra files or folders unless necessary.
- Do NOT refactor unrelated code.
- Do NOT install new packages unless explicitly asked.
- Do NOT generate placeholder or dummy data unless asked.
- Do NOT generate UI for pages not requested.
- Do NOT create new test files unless asked.
- Do NOT update unrelated tests.
- If an existing test must be adjusted because the requested behavior changed, keep the change minimal.
- Do NOT use `var`.
- Do NOT use `==`.
- Do NOT use `any`.
- Do NOT introduce TypeScript into JavaScript files unless explicitly requested.
- Do NOT silently change API contracts.
- Do NOT change routing architecture, state architecture, or database schema unless requested.