# Antigravity Global Rules

This document contains global instructions and rules that Zed must abide by across all tasks in this workspace. You can edit this file to add project-specific rules, formatting preferences, and other guidelines.

## 1. General Directives
- Prioritize user instructions and intent.
- Keep explanations clear, concise, and professional.
- Write robust, clean, and maintainable code.
- Always check for potential edge cases.

## 2. Project-Specific Rules
- You are working on a NAAP Library Management System.
- The system is built using Laravel and React.js.
- The system is used to manage books, students, and depository items for the student's personal belongings.
- The NAAP Tap-to-Login Page is not the Login page for the system. It is a page that is used to Log the students in and out of the library which is located in /tap-to-login.
- The `/tap-to-login` and `/tap-to-logout` pages must support automated real-time student logging via facial recognition.
- The frontend should use `face-api.js` to handle real-time scanning of faces.
- The engine for facial recognition should be written in Python and located in the project's root folder.
- There will be a separate Login page for the system which is located in /login.
- I am using a remote database for the system, so when trying to access the database, make sure to use the remote database credentials.
- Since I am using a remote database, the database is already built, all the tables are there so you just need to grab it.

## 3. Codebase
- This is system is built using laravel and reactjs so it is a fullstack application being connected by a bridge called Inertia.js.
