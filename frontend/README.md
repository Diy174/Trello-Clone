# Trello-Style Kanban Project Management Tool

A Kanban-style project management web application inspired by Trello.  
This application allows users to organize tasks visually using boards, lists, and cards with drag-and-drop functionality.

The goal of this project is to replicate Trello's workflow and user interface patterns while implementing core task management features.

---

## Tech Stack

### Frontend
- React (Vite)
- Tailwind CSS
- dnd-kit (Drag and Drop)

### Backend
- Node.js
- Express.js

### Database
- MySQL

---

## Features

### Board Management
- Create a new board
- View boards with lists and cards

### Lists Management
- Create lists
- Edit list title
- Delete lists
- Drag and reorder lists

### Cards Management
- Create cards inside lists
- Edit card title and description
- Delete cards
- Archive cards
- Drag cards between lists
- Reorder cards within the same list

### Card Details
- Edit card title and description
- Add or remove labels
- Assign members to cards
- Set due dates
- Add checklist with items
- Mark checklist items as complete/incomplete

### Search and Filter
- Search cards by title
- Filter cards by:
  - Labels
  - Assigned members
  - Due date

---

## UI / UX

The interface is designed to closely resemble Trello’s Kanban board layout:
- Horizontal lists
- Draggable cards
- Card details modal
- Color-coded labels
- Responsive card layout

---

## Database Design

The database is designed with relational integrity and proper relationships between entities.

### Tables

**boards**
- id
- title
- background
- created_at

**lists**
- id
- board_id
- title
- position
- created_at

**cards**
- id
- list_id
- title
- description
- due_date
- position
- is_archived
- created_at

**labels**
- id
- board_id
- name
- color

**members**
- id
- name
- email

**card_labels**
- card_id
- label_id

**card_members**
- card_id
- member_id

**checklists**
- id
- card_id
- title
- position

**checklist_items**
- id
- checklist_id
- title
- is_completed
- position

---

## Installation

### Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/trello-kanban-clone.git
cd trello-kanban-clone