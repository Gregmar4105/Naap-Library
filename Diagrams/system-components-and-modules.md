# System Component and Modules

The system is organized into specialized modules, each designed to address the specific gaps identified in the current manual operations of the National Aviation Academy of the Philippines (NAAP) Library. The platform is developed as a Hybrid Single Page Application (SPA) using React.js and Inertia.js, ensuring a high-speed, desktop-like user experience. It utilizes a Laravel 11 application server and a dedicated Python FastAPI microservice to communicate with a MySQL database, ensuring that attendance tracking, biometric matching, and locker inventory stay updated in real time with minimal latency.

1. **Student Enrollment & Registration Module** - Designed specifically to digitize the onboarding lifecycle of library members. It captures personal details, assigns a physical RFID token, and features a biometric enrollment sub-module that extracts 128-dimensional facial descriptors from five distinct angles. It automatically generates a unique Library ID and dispatches credentials via email.

2. **Multi-Modal Library Access Module** - Engineered to replace manual logbooks with an automated, fail-safe entry and exit system. It allows for identification via Facial Recognition, RFID tap, QR Code, or Barcode scan. It utilizes a stateless parity detection algorithm (odd/even log counts) to accurately determine whether a student is logging in or logging out in real time.

3. **Face Recognition Engine Module** - A dedicated Python-based microservice that isolates heavy biometric processing from the main web server. It performs Euclidean distance computations to match scanned faces against the database and triggers an access decision based on an administrator-adjustable sensitivity threshold (defaulted to 0.45).

4. **Real-Time Dashboard & Monitoring Module** - Built for library administrators to oversee daily operations. It aggregates access logs to display the live headcount of students currently inside the library. It features a dedicated security alert system that flags unrecognized or failed access attempts, capturing photographic evidence of each event.

5. **Locker Depository Management Module** - Designed to eliminate the vulnerabilities of paper-based locker tracking. It enforces a mandatory two-step verification process requiring the scan of both the locker key's RFID tag and the student's ID. It features a strict "Locker-Return Gate Rule" that actively prevents a student from logging out of the premises if they hold an unreturned key.

6. **Student Records & Lost ID Management Module** - Acts as the centralized, searchable registry for all student data. It includes a specialized workflow for handling lost library cards, allowing staff to document the incident, upload an affidavit, and seamlessly link a newly issued replacement ID to the student's historical access records.

7. **Survey & Feedback Management Module** - Developed to gather actionable insights directly from the student body without relying on third-party tools. It allows administrators to construct custom questionnaires using various input types (multiple-choice, text, ratings) and securely stores respondent feedback for institutional analysis.

8. **System Configuration & AI Assistant Module** - Provides global control over system parameters without requiring code modifications. It allows adjustment of biometric strictness and email server settings. It also integrates a conversational AI chatbot (powered by local or cloud models) to provide intelligent, on-demand operational support and querying capabilities to library staff.
