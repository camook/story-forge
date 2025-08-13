# **Product Requirements Document (PRD)**
**Application Name:** _TBD_ (placeholder: “StoryForge”)
**Author:** Mook  
**Date:** 2025-08-13  
**Version:** 1.0

---

## **1. Overview**
This application tracks the creation of short stories for a YouTube channel, managing each stage of production from idea to published video. The app enables the user to maintain multiple story ideas, progress them through writing, illustration, recording, and publishing stages, and store all relevant assets (text, illustrations, audio, and YouTube links) in one place.

---

## **2. Goals and Objectives**

### Goals:
- Provide a **centralized workspace** for short story creation workflow.
- Ensure **easy tracking** of story progress.
- Store all related assets **securely in Cloudflare storage**.
- Support a **stage-based workflow** to visualize progress.

### Objectives:
- Enable creation and storage of multiple **story ideas**.
- Allow stories to move from **idea → writing → illustration → recording → published**.
- Display stories in a **vertical kanban-style board** sorted by progress.
- Maintain dedicated **detail pages** for each story.
- Store **text, image, and audio assets** in a consistent, accessible structure.
- Allow manual **YouTube link storage** for published stories.

---

## **3. Scope**

### In-Scope:
- Single-user application (no authentication beyond personal login).
- Web-based UI built with **React**.
- Backend API using **Hono** deployed on Cloudflare Workers.
- File storage using **Cloudflare R2**.
- Manual uploads for illustrations (PNG/JPG) and audio (MP3).
- Kanban-style story board with progress sorting.
- Individual pages for each story.
- Story idea list page.
- Completed story list page.

### Out-of-Scope:
- Multi-user collaboration.
- AI-assisted writing or illustration generation.
- YouTube video uploads.
- Advanced metadata (tags, genres, filters).
- In-app audio recording.

---

## **4. Functional Requirements**

### 4.1 Story Management
- **Create story ideas** with title and short description.
- Edit and delete story ideas.
- Promote an idea to “Writing” stage.
- Edit and save the written story text.
- Upload one or more illustrations (PNG/JPG).
- Upload one MP3 file for final narration.
- Store one YouTube link for the published video.

### 4.2 Workflow & Display
- **Vertical Kanban board** with stories ordered by stage:
  1. _Bottom:_ Story Ideas (no progress yet)
  2. Writing
  3. Illustration
  4. Recording
  5. _Top:_ Published stories  
- Drag-and-drop or button-based stage progression.
- Each story card shows:
  - Title
  - Current stage
  - Last updated date
  - Progress percentage (calculated by stage)

### 4.3 Story Pages
- Clicking a story opens a **detail view** showing:
  - Title & description
  - Stage & progress
  - Written text
  - Uploaded illustrations
  - Uploaded MP3
  - YouTube link (if published)
  - Date created & last updated

### 4.4 Storage
- **Cloudflare R2** for all uploads.
- File paths structured by story ID and asset type.

---

## **5. Non-Functional Requirements**
- **Performance:** Load board view in under 1 second for up to 100 stories.
- **Security:** Cloudflare Access authentication for app entry.
- **Scalability:** Support up to 500 stories and associated files.
- **Availability:** Target 99.9% uptime.
- **Cross-Browser:** Compatible with latest Chrome, Firefox, Safari, Edge.

---

## **6. User Stories & Acceptance Criteria**

| User Story | Acceptance Criteria |
|------------|---------------------|
| As a user, I can create a new story idea | Form with title and description, saved to DB, appears in "Ideas" stage |
| As a user, I can move a story to the next stage | UI updates instantly, order on board changes accordingly |
| As a user, I can upload illustrations | File is stored in R2, thumbnail appears in story page |
| As a user, I can upload MP3 | File is stored in R2, playable in story page |
| As a user, I can store a YouTube link | Link is clickable in story page |
| As a user, I can view stories in progress order | Kanban board shows correct ordering by stage |

---

## **7. Architecture Overview**
- **Frontend:** React app with vertical kanban UI (e.g., dnd-kit or react-beautiful-dnd).
- **Backend:** Hono API deployed on Cloudflare Workers for CRUD operations.
- **Storage:** Cloudflare R2 for files, D1 for metadata and story records.
- **Auth:** Cloudflare Access for personal login.
- **Hosting:** Cloudflare Pages (for static frontend) + Workers (for API).

---

## **8. Initial Data Model**
**Story Table (D1 Database)**
| Field           | Type     | Notes |
|-----------------|----------|-------|
| id              | UUID     | Primary key |
| title           | String   | Required |
| description     | String   | Optional |
| stage           | Enum     | idea, writing, illustration, recording, published |
| text            | Text     | Full story text |
| illustrations   | JSON     | Array of R2 URLs |
| audio           | String   | R2 URL to MP3 |
| youtube_link    | String   | Optional |
| created_at      | DateTime | Auto |
| updated_at      | DateTime | Auto |

---

## **9. Future Enhancements (Not in v1)**
- AI-assisted story outlining and drafting.
- Automatic YouTube metadata retrieval.
- Tagging, categorization, and search.
- Mobile app companion.

