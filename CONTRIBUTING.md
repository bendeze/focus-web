# Contributing to Focus Web

Thank you for your interest in contributing to Focus Web. This guide provides instructions on how to set up your environment, follow our coding standards, and submit contributions.

---

## Code of Conduct

All contributors and participants are expected to adhere to our [Code of Conduct](CODE_OF_CONDUCT.md). Please treat all community members with respect and professionalism.

---

## How to Contribute

### Reporting Bugs

Before creating a bug report, check the existing issue tracker to verify that the issue has not already been reported.

When opening an issue, include:
- A clear, descriptive title.
- Steps to reproduce the problem.
- Expected behavior versus actual behavior.
- Relevant system specifications (operating system, browser, Node.js version, Python version).
- Error messages, logs, or screenshots if applicable.

### Suggesting Enhancements

Feature requests and design ideas are welcomed:
- Open an issue describing the proposed change.
- Explain the motivation and intended user experience.
- Provide mockups, API specifications, or code sketches where relevant.

### Submitting Code Changes

1. Fork the repository and create a branch from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```
   or
   ```bash
   git checkout -b fix/your-bugfix-name
   ```

2. Implement your changes locally. Follow established patterns in the codebase:
   - For React/TypeScript: Keep components modular, maintain dark/light theme tokens, and ensure strict TypeScript typing.
   - For FastAPI/Python: Ensure SQLModel and Pydantic schemas remain strictly typed and write pytest unit tests for new endpoints.

3. Verify tests and builds pass:
   ```bash
   # Backend
   cd backend
   uv run pytest

   # Web
   cd ../web
   npm run build
   ```

4. Commit your changes using Conventional Commits:
   ```text
   feat: add session duration presets
   fix: correct tooltip offset on mobile screens
   docs: update backend setup instructions
   refactor: extract weekly analytics calculations
   ```

5. Push your branch to your fork and submit a Pull Request targeting `main`.

---

## Pull Request Guidelines

- Ensure your branch is rebased onto the latest `main` branch.
- Keep pull requests focused on a single feature or bug fix.
- Include a descriptive summary of changes in the pull request description.
- Reference any linked issues (for example, `Fixes #12`).
- Do not commit secrets, environment `.env` files, or temporary artifacts.

---

## Review Process

- Maintainers will review pull requests for code quality, adherence to architecture, and test coverage.
- Feedback will be provided directly on the pull request review.
- Once approved and checks pass, changes will be merged into `main`.
