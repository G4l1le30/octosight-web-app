# Pull Request: E-Learning Core & Admin Refactor

## Description
This PR introduces the core **E-Learning Module**, refactors the administrative and reporting interfaces into a modular architecture, and modernizes the backend infrastructure for improved security and maintainability.

## Key Changes

### 1. E-Learning & Quiz System
- **UUID-Based Architecture**: Migrated all educational modules and articles to **UUIDs** to prevent predictable resource enumeration.
- **Improved Quiz State**: 
  - **Fresh Starts**: Added logic to clear local progress on "Retake" and a "Start Fresh" option for in-progress quizzes.
  - **Score Persistence**: Backend now preserves the **Highest Score (Best Score)** across all attempts.
  - **Permanent Completion**: Once a module is passed (>= 70%), it remains `COMPLETED` even if subsequent retakes fail.
- **AI-Driven Recommendations**: Enhanced Gemini integration to provide descriptive, title-based module recommendations.
- **UI Polish**: 
  - Removed decimal points from all scores for a cleaner interface.
  - Added "Next Module" navigation buttons with consistent success-themed styling.

### 2. Administrative & UI Refactor
- **Modular Architecture**: Extracted logic into custom hooks and reusable components for Triage, Investigate, and Dashboard pages.
- **UX Enhancements**: Added dynamic loading progress bars and improved table filters.

### 3. Infrastructure & Modernization
- **Centralized Seeding**: Consolidated all dummy data into `main_seed.py` with full database reset support (`drop_all`).
- **Backend Modernization**: 
  - Migrated to **Lifespan** context manager and updated to timezone-aware UTC timestamps.
  - Resolved SQLAlchemy and Docker/MySQL deprecation warnings.
