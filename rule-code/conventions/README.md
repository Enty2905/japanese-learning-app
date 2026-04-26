# Development Conventions

## Naming Convention
- Use `camelCase` for variables, functions, and file-level constants.
- Use `PascalCase` for React components, classes, and page identifiers.
- Use `kebab-case` for folder names and non-component file names when possible.

## Git Commit Convention
- Follow Conventional Commits format: `<type>(scope): <summary>`.
- Common types: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`.
- Keep commit messages short, imperative, and descriptive.

## API Naming Convention
- Use lowercase plural nouns for resources, e.g. `/api/v1/vocabulary`.
- Use HTTP methods semantically: `GET`, `POST`, `PUT/PATCH`, `DELETE`.
- Keep endpoint names consistent and avoid verbs in route paths.
