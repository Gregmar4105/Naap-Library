# Integrated Library Management System (ILMS)
## System Requirements and Architecture
**National Aviation Academy of the Philippines (NAAP)**

---

## Stakeholder Identification and User Roles

Identifying the stakeholders of the Integrated Library Management System (ILMS) is a foundational step in understanding who the system is built for, who it affects, and what each party expects from it. A stakeholder is any individual, group, or institution that has a direct or indirect interest in the system's development, deployment, or daily operation. For the ILMS deployed at the National Aviation Academy of the Philippines, stakeholders range from the library staff who interact with the system every day to the students who depend on it for library access and locker services, as well as the school administration that benefits from the data and operational improvements the system delivers.

Understanding the distinct needs and responsibilities of each stakeholder group was essential in shaping the system's functional requirements, user interface design, and access control policies. Each role in the system is granted a specific set of permissions aligned with their responsibilities, ensuring that every user can perform their required tasks without accessing functions outside their authority.

### Stakeholder 1: Library Administrator

The Library Administrator is the primary decision-maker and the highest-authority user within the ILMS. This role is typically held by the Head Librarian or a designated senior library staff member responsible for overseeing the entire operations of the NAAP library. The Library Administrator has full access to all modules of the system, including student enrollment and records management, locker inventory oversight, real-time attendance monitoring, survey creation and management, lost ID report processing, and all system configuration settings.

Within the configuration module, the Library Administrator is the sole authorized party for adjusting the facial recognition sensitivity threshold, configuring the email server for SMTP-based credential delivery, and setting the parameters of the AI assistant. This stakeholder also has the authority to create and manage staff accounts, making them responsible for maintaining the integrity of the system's access control structure. The Library Administrator is the primary beneficiary of the real-time dashboard, relying on it to monitor how many students are currently inside the library, review security alerts from unrecognized access attempts, and generate an accurate, real-time picture of library utilization.

### Stakeholder 2: Library Staff (Librarian)

Library Staff, encompassing frontline librarians and auxiliary support personnel, function as the primary operational users of the ILMS. These stakeholders engage with the platform at the highest transactional frequency, executing the procedural workflows essential to the continuous and orderly management of library operations. Their core responsibilities within the system encompass the administration of student registration workflows, facilitation of biometric facial enrollment across the required angles, processing of locker key assignments through the two-step depository protocol, documentation and submission of lost ID reports, and the dispatch of institutional email notifications to the student body.

Distinguished from the Library Administrator by the scope of their system privileges, staff accounts are provisioned with access to operational modules while remaining structurally restricted from modifying system-level parameters — including biometric recognition thresholds and server configuration settings. This enforced boundary ensures that sensitive architectural controls remain under centralized administrative authority, permitting frontline personnel to execute their institutional duties with full operational efficiency while precluding unauthorized access to privileged system-level configurations.

### Stakeholder 3: Students and Library Users

Students constitute the primary end-users of the ILMS and represent the central subject of all institutional data collected, processed, and managed within the platform. Rather than maintaining a login account within the administrative backend, students interface with the ILMS exclusively through the library entry terminal and the depository kiosk positioned within the facility. At the library gateway, students authenticate their identity through one of four integrated identification modalities — facial recognition, RFID card tap, QR code scanning, or legacy barcode scanning — enabling the system to autonomously record entry and exit events without necessitating manual intervention from library personnel.

Students further interact with the locker depository by presenting their Library ID credentials to initiate the borrowing or return of a locker key, and receive their authentication credentials together with a scannable QR code via institutional email upon successful enrollment. From a system design perspective, students are classified as data subjects rather than system operators; they are not granted access to any administrative interface, and their personal records, biometric profiles, and transaction histories are exclusively accessible to authorized library personnel through the secured administrative portal. This architectural distinction is critical to the platform's privacy and security posture: biometric data is processed solely for real-time identification purposes and is never exposed at the client interface level.

As direct beneficiaries of the system's services, students additionally serve as the primary respondents for surveys published through the feedback module, and their cumulative access patterns constitute the foundational dataset from which the dashboard's attendance analytics and security monitoring feeds are derived.

### Stakeholder 4: School Administration and Management

The school administration — including the academic affairs office and institutional management of the National Aviation Academy of the Philippines — are indirect stakeholders who do not interact with the system directly but benefit significantly from the data and operational improvements it produces. This group relies on the ILMS to provide accurate, consistent records of student library utilization that can support administrative decisions around library resource allocation, student engagement monitoring, and institutional accreditation requirements.

The library attendance data generated by the system — including daily visit counts, visit frequency per student, and peak usage hours surfaced through the dashboard — serves as a reliable evidence base for institutional reporting. As the ILMS replaces the previous barcode-based system, which was prone to tracking inaccuracies, the school administration gains confidence that the student traffic data reported by the library accurately reflects actual usage patterns.

### Stakeholder 5: System Developer and Maintainer

The development team responsible for building the ILMS — the researchers conducting this capstone study — occupies a unique stakeholder role as both architects and primary technical references for the system. During the development phase, this stakeholder group is responsible for translating institutional requirements into functional software, configuring the hardware integration points such as the RFID reader and library camera, calibrating the face recognition sensitivity threshold under real-world conditions, and deploying the full system to the institutional server.

Following deployment, the role of this stakeholder transitions toward maintenance and documentation. The system is architected to minimize the need for ongoing developer intervention: configuration changes are handled through the administrator panel, and the modular Controller-Service-Repository structure of the backend allows targeted updates without the risk of cascading failures. The developer and maintainer stakeholder ensures that technical documentation, migration records, and threshold calibration logs are delivered alongside the system for the benefit of future maintainers.

---

### Stakeholder Summary Table

| Stakeholder | Type | Interaction with System | Access Level |
|---|---|---|---|
| **Library Administrator** | Direct / Internal | Full system access — configuration, dashboard, all modules | Full administrative access |
| **Library Staff (Librarian)** | Direct / Internal | Student registration, locker management, lost ID, daily operations | Operational access (no system config) |
| **Students / Library Users** | Direct / External | Library entry/exit via terminal, locker borrowing, QR credential receipt | No login — terminal-based only |
| **School Administration** | Indirect / Institutional | Beneficiaries of attendance reports and library utilization data | No direct system access |
| **System Developer / Maintainer** | Direct / Technical | System deployment, calibration, updates, and documentation | Technical / Backend access |

---

## Functional Requirements

Functional requirements describe what the system must be able to do — the specific features and actions it must perform to meet the needs of the library, its staff, and its students.

### FR-01: Student Enrollment and ID Generation

The system must allow library staff to register new students by entering their personal information, including full name, student number, course, date of birth, address, and contact details. During registration, the system must accept a profile photo and enroll the student's face from five different angles to enable facial recognition. It must also record the student's RFID card number for tap-based identification. Upon successful registration, the system must automatically generate a unique Library ID in the format `YY-NNNNN` and send the student's login credentials together with a scannable QR code to their email address.

### FR-02: Multi-Modal Library Entry and Exit

The system must allow students to log in and out of the library using any of the following identification methods:

- **Facial Recognition** — The student stands in front of a camera, and the system identifies them automatically.
- **RFID Tap** — The student taps their physical ID card on the RFID reader.
- **QR Code Scan** — The student presents the QR code sent to their email.
- **Barcode Scan** — A legacy fallback method using the student's barcode ID.

The system must correctly determine whether a student is logging in or logging out based on how many times they have already accessed the library that day, and it must display the student's name, photo, and access result in real time.

### FR-03: Access Attempt Recording and Security Monitoring

Every time a student attempts to enter or exit the library — whether the attempt is successful or not — the system must save a record of the event, including the date, time, type of attempt, and a photo taken during the scan. If the system cannot identify the person (e.g., the face is unrecognized), the record must still be saved with the identification left blank, flagging it as an unknown individual for the administrator to review.

### FR-04: Real-Time Dashboard and Attendance Monitoring

The system must provide administrators with a live dashboard that shows:

- How many students are currently inside the library
- The total number of student visits for the day
- A real-time log of all login and logout events
- A list of failed or unrecognized access attempts with captured photos

This information must update automatically without requiring the administrator to refresh the page manually.

### FR-05: Locker Depository Management

The system must support a two-step process for borrowing and returning locker keys:

1. The librarian scans the physical RFID tag attached to the locker key.
2. The student taps their Library ID using any of the supported methods.

The system must only allow a student to borrow a locker if they are currently logged into the library and do not already have an unreturned key. It must record the borrower's name, the locker number, and the exact time of borrowing. When the key is returned, the system records the return time and marks the locker as available again. The system must also prevent a student from logging out while a locker key remains unreturned.

### FR-06: Student Records Management

The system must allow administrators to view, search, update, and delete student records. It must also support sending notification emails directly to students from within the system.

### FR-07: Lost ID Processing

The system must allow library staff to file a lost ID report on behalf of a student. The report must record the student's old Library ID, their student number, the location where the ID was lost, a description, and an uploaded affidavit document. Once a replacement ID is issued, the new Library ID must be linked to the same report for tracking purposes.

### FR-08: Survey and Feedback Management

The system must allow administrators to create, publish, and close surveys with customizable questions. It must support different question types, including multiple choice, short text, dropdowns, ratings, and date fields. Students or respondents must be able to submit answers, and the system must store all responses for administrative review.

### FR-09: System Configuration

The system must allow administrators to adjust the sensitivity of the facial recognition feature, controlling how strictly the system verifies a face match. It must also allow configuration of the email server settings used for sending credentials and notifications, as well as settings for the AI assistant feature.

### FR-10: AI Assistant for Administrators

The system must provide a built-in AI chat interface that allows library administrators to ask questions and receive intelligent responses. The AI feature must support both locally hosted AI models and external AI providers, configurable through the system settings.

---

## Non-Functional Requirements

Non-functional requirements describe the qualities and standards the system must meet — not what it does, but how well it does it.

### NFR-01: Performance

The facial recognition process, from the moment a student faces the camera to the display of the access result, must complete within a reasonable time to avoid congestion at the library entrance. The dashboard and attendance logs must load quickly to support efficient daily operations, even when handling a large volume of student records and access events.

### NFR-02: Reliability and Data Accuracy

The system must consistently record accurate attendance and access logs without duplicating or losing entries. The locker transaction records must be complete and correct at all times, ensuring that the library always knows which keys are borrowed and by whom. The system must handle hardware disconnections or network interruptions gracefully, without corrupting stored data.

### NFR-03: Security

Access to the system's administrative interface must be protected by secure staff accounts. Sensitive data such as facial recognition embeddings, student personal information, and system configuration settings must not be accessible to unauthorized users. The system must also support two-factor authentication for staff accounts to add an additional layer of account protection.

### NFR-04: Usability

The system must be easy to use for both library staff and students with minimal training. The interface must be clear, organized, and responsive, working smoothly on standard desktop computers used in the library. Feedback messages, such as access granted, access denied, or locker assigned, must be immediately visible and easy to understand.

### NFR-05: Maintainability

The system must be structured in a way that allows future developers to update or add features without disrupting the existing functions. For example, adding a new authentication method or extending the survey module must be possible without rewriting the entire system. Configuration values, such as the face recognition sensitivity threshold, must be adjustable through the admin panel without requiring any code changes.

### NFR-06: Scalability

The system must remain functional and responsive as the number of enrolled students grows over time. The database and application must be capable of handling an expanding volume of attendance records, locker transactions, and survey responses without a degradation in performance.

### NFR-07: Availability

The system must be available during all library operating hours without requiring frequent restarts or extended maintenance windows. Any scheduled maintenance must be plannable in advance and must not result in data loss.

### NFR-08: Compliance with Quality Standards

The system will be evaluated against the **ISO 25010** software quality framework, focusing on four key areas: functional suitability (the system does what it is supposed to do), performance efficiency (the system runs fast enough), reliability (the system works consistently), and maintainability (the system can be updated over time). Staff and student acceptance of the system will be assessed using the **Technology Acceptance Model (TAM)**, measuring how useful and easy to use the system is perceived to be.

---

## Proposed System Architecture and Design

The architecture of the Integrated Library Management System (ILMS) for the National Aviation Academy of the Philippines is designed to replace the institution's existing barcode-only library infrastructure with a unified, multi-modal digital platform. The system employs a **Modular Three-Tier Architecture**, which organizes the entire application into three clearly separated layers: the Presentation Layer, the Application Logic Layer, and the Data Layer. This separation ensures that the system's core business rules — such as facial recognition matching, session-based attendance tracking, and two-step locker management — remain independent of the user interface, making the system both maintainable and scalable for future enhancements without disrupting existing operations.

The **Presentation Layer** serves as the front-facing interface accessible through any standard web browser. It is built using React and Inertia.js, providing library staff and administrators with a responsive, real-time interface for monitoring student attendance, managing locker transactions, viewing security alerts, and configuring system settings. Students interact with this layer indirectly through a dedicated access terminal at the library entrance, where their identity is captured via camera scan, RFID tap, QR code, or barcode. All information shown to users — from access results to dashboard statistics — is delivered to this layer from the application logic tier, ensuring that no sensitive business logic is exposed on the client side.

The **Application Logic Layer** constitutes the operational core of the ILMS. It is powered by the Laravel 11 framework and is responsible for all data processing, rule enforcement, and communication between components. This layer hosts all functional modules of the system — student registration, multi-modal access control, locker depository management, real-time monitoring, survey management, and the AI assistant — each implemented as an independent controller following a three-tier controller-service-repository pattern, ensuring clean separation of responsibilities within the logic layer itself.

A critical component embedded within the Application Logic Layer is the **Custom Multi-Modal Authentication Logic** that governs library entry and exit. Specifically, the system implements a **Session-Based Login and Logout Detection** approach: when a student is identified, whether through facial recognition, RFID, QR code, or barcode, the system queries the attendance log for that student on the current date and counts the number of existing entries. An odd count indicates that the student is currently outside and should be logged in, while an even count indicates that the student is currently inside and should be logged out. This rule-based logic eliminates the need for a separate status flag in the database, providing a lightweight and reliable mechanism for real-time presence tracking. Additionally, the system enforces a **Locker-Return Gate Rule**: a student cannot log out of the library if the transaction records show an active, unreturned locker key assigned to them, directly preventing the loss of library property.

The Application Logic Layer also interfaces with a dedicated **Python FastAPI Face Recognition Microservice** running on a separate local port. This microservice implements Euclidean distance-based face matching: when a student stands before the camera, the browser captures a 128-dimensional facial descriptor using face-api.js and submits it to the main application, which then forwards it to the Python service. The service retrieves all stored face embeddings from the database and computes the Euclidean distance between the submitted descriptor and each enrolled profile. If the closest match falls below the administrator-configured sensitivity threshold stored in `tbl_sensitivity_thresholds` (defaulting to 0.45), the student is positively identified and access is granted. This threshold-based approach allows librarians to adjust the strictness of face recognition in real time through the system's settings panel, without requiring any modifications to the underlying code.

The **Data Layer** is managed by a MySQL relational database and serves as the centralized repository for all institutional data. It stores eight core application-domain tables: student profiles and face embeddings (`tbl_student_info`), attendance and session logs (`tbl_student_logs`), facial recognition audit records (`tbl_access_attempts`), locker key inventory (`tbl_rfid_info`), locker transaction history (`tbl_rfidhistory`), biometric sensitivity configuration (`tbl_sensitivity_thresholds`), system settings (`tbl_settings`), and staff accounts (`users`). While the database does not enforce formal foreign key constraints at the engine level for the application-domain tables, referential integrity is strictly maintained through the Laravel Eloquent ORM and the business logic embedded in the Application Logic Layer, ensuring consistent and accurate data relationships across all modules.

Together, these three tiers form a cohesive and institution-ready platform that transforms the NAAP library from a manually managed, single-mode barcode system into an automated, multi-modal, and data-driven library management environment.

### Client Architectural Framework

Adopting a **Hybrid Server-Rendered Single Page Application (SPA)** architectural model, the ILMS achieves a modernized Separation of Concerns (SoC) tailored to the operational demands of an institutional library environment. Rather than a purely server-heavy application that reloads the entire page for every interaction, or a purely client-side application that operates without a backend, the system occupies a deliberate architectural middle ground: the server handles all sensitive business rules, data persistence, and security enforcement, while the client side takes responsibility for real-time rendering, biometric data capture, and interactive feedback. This model ensures that the system remains performant on standard desktop hardware without sacrificing the consistency and accountability required by an institutional deployment. The strict independence between the interface, the application logic, and data storage further ensures high maintainability — changes to the database schema or business rules do not necessitate a complete redesign of the user interface.

**I. Presentation Layer (The Hybrid SPA Client)**

The Presentation Layer serves as the primary interface for library staff, administrators, and the library's access terminal. Developed as a Hybrid SPA using React and Inertia.js, this layer combines the responsiveness of a modern single-page application with the data security of server-side rendering. Unlike a traditional thick client that executes business logic on the user's device, the ILMS Presentation Layer is deliberately focused on rendering, user interaction, and biometric data capture — all sensitive computations and access rule evaluations are delegated to the Application Server Layer to maintain strict data integrity.

A critical client-side responsibility handled exclusively within this layer is **face descriptor extraction via face-api.js**. When a student approaches the library entrance, the browser activates the device camera and processes the live video feed directly on the client machine. The face-api.js library extracts a 128-dimensional numerical representation of the student's facial geometry — a mathematical "fingerprint" of their face — without ever sending raw video footage to the server. Only this compact numerical descriptor is transmitted, significantly reducing network payload and protecting the privacy of unenrolled individuals whose images are processed momentarily and discarded. This client-side pre-processing approach ensures that the recognition pipeline is lightweight, real-time, and does not impose a camera-streaming burden on the server.

The interface is styled with a component-based design system, providing a consistent and intuitive layout for all administrative panels — from the live dashboard and student registry to locker management and survey creation. All feedback messages, such as access granted, access denied, locker assigned, or key already borrowed, are rendered instantly within the existing page context without triggering a full page reload, maintaining operational continuity at the library entrance.

**II. Application Server Layer (The Logic Engine and Data Gateway)**

The Application Server Layer constitutes the operational core and security boundary of the ILMS. Built with the Laravel 11 PHP framework, this layer functions as both the primary logic engine and the secure gateway between the Presentation Layer and the Data Layer. Because the client side is responsible only for capture and display, this tier carries the full weight of the system's business rules, authentication enforcement, and inter-service communication.

All access control decisions — including session-based login/logout determination, locker-borrow validation, and face recognition threshold comparison — are executed exclusively within this layer, ensuring that no rule can be bypassed through client-side manipulation. Each functional module of the system is implemented as an independent controller organized according to a Controller-Service-Repository pattern, maintaining clean boundaries between request handling, business logic, and data retrieval.

This layer also acts as the internal orchestrator for the Python Face Recognition Microservice. When the Presentation Layer submits a 128-dimensional face descriptor, the Application Server forwards it via an internal HTTP request to the Python FastAPI service running on a dedicated local port, receives the recognition result, applies the sensitivity threshold validation, executes the appropriate access log write, and returns the final decision to the client — all as a single coordinated transaction invisible to the end user.

For external communication, the layer manages outbound SMTP email dispatch for student credential delivery and notification emails, as well as API requests to the configured AI assistant provider, routing all sensitive configuration data through the server to prevent exposure of system credentials on the client side.

**III. Data Management Layer (The Storage and Persistence Foundation)**

The Data Management Layer forms the bottom tier of the architecture, serving as the centralized repository for all institutional records generated and consumed by the ILMS. Powered by a MySQL relational database, this layer provides durable storage for the eight core application-domain tables that underpin every function of the system: student identity and biometric profiles, attendance and session logs, security attempt records, locker inventory, transaction history, system configuration, and staff accounts.

Beyond simple storage, this layer also functions as the home of the system's most sensitive data — including 128-dimensional face embeddings stored as JSON in the student profile table. Access to this data is strictly mediated by the Application Server Layer; the Presentation Layer has no direct database connection, ensuring that student biometric data is never retrievable through client-side inspection or browser tools. Referential integrity across all tables is enforced through the Laravel Eloquent ORM and embedded business logic rather than database-level foreign key constraints, providing flexibility without sacrificing consistency.

A specialized component of this layer is the **Python FastAPI Face Recognition Microservice**, which operates as a data-processing satellite: it reads face embeddings from the database on demand, performs Euclidean distance computations in memory, and returns match results to the Application Server. By treating biometric computation as a services layer concern rather than a database procedure, the system isolates this workload from the relational database engine, preventing recognition operations from contending with transactional writes to the attendance and access logs.

### Technical Logic: Core Algorithmic Implementations

To fulfill the system's biometric identification and real-time attendance tracking requirements, the ILMS implements two purpose-built algorithmic mechanisms — one governing face matching and one governing session state determination.

**Face Recognition: Euclidean Distance Matching**

The face recognition pipeline is powered by a custom proximity-based matching algorithm implemented within the Python FastAPI microservice. When a student's 128-dimensional facial descriptor is submitted, the service computes the **Euclidean distance** between the submitted vector and every stored face embedding in the database. Euclidean distance is a geometric measurement of how different two points are in space; in the context of face recognition, it quantifies how dissimilar two facial profiles are across 128 measurable facial characteristics. The formula applied per stored embedding is:

> **d(p, q) = √ Σᵢ (pᵢ − qᵢ)²**

Where:
- **p** — the submitted 128-dimensional face descriptor from the current scan
- **q** — a stored 128-dimensional face embedding from an enrolled student
- **d(p, q)** — the Euclidean distance representing the degree of facial dissimilarity between the two

The service evaluates this distance for every enrolled student profile and selects the candidate with the smallest distance. If that minimum distance falls below the administrator-configured sensitivity threshold (stored in `tbl_sensitivity_thresholds`, defaulting to **0.45**), the student is positively identified and access is granted. A distance at or above the threshold means no sufficient match was found, and the attempt is recorded as a failed or unknown detection. This threshold-based approach provides a configurable balance between recognition strictness and tolerance for real-world variations in lighting, head angle, and camera distance — adjustable at any time through the system's settings panel without modifying the source code.

**Attendance State: Session-Based Login and Logout Detection**

To determine whether a recognized student is entering or exiting the library, the system applies a **stateless parity-based detection algorithm** that eliminates the need for a persistent status field in the database. When a student is successfully identified, the Application Server queries the attendance log table for all entries recorded for that student on the current calendar date. The count of those entries determines the access action:

> **If count(entries for student on current date) is ODD → Log In**
> **If count(entries for student on current date) is EVEN → Log Out**

A student arriving for the first time that day has zero existing entries (even), so the system records a login, resulting in a count of one (odd), correctly marking them as inside. When the same student exits, the count of one (odd) triggers a logout, recording a second entry (even), correctly marking them as outside. This cycle continues reliably for students who enter and exit multiple times within the same day. The parity logic is inherently self-correcting: because every login is always followed by a logout before the next login, the count always accurately reflects the student's current state without requiring a separate status column to be maintained or reset.

### System Components and Modules

The ILMS is organized into eight functional modules, each residing within the Application Logic Layer and responsible for a specific area of the library's operations.

---

#### Module 1: Student Enrollment and Registration

This module governs the complete onboarding lifecycle of a new library member. Library staff fill out a structured registration form capturing the student's full name, student number, course, date of birth, contact information, and address. A profile photo is uploaded and stored for dashboard identification purposes. The student's physical RFID card number is also recorded at this stage to support tap-based authentication. Following the basic details, the system leads staff through a guided face enrollment process, capturing 128-dimensional facial descriptors from five distinct angles — center, left, right, upward, and downward — ensuring that the recognition engine has a spatially diverse set of reference profiles to match against even under varying head positions at the library entrance.

Upon completion, the system automatically assigns a unique Library ID using a sequential format tied to the current enrollment year (`YY-NNNNN`), preventing duplication across academic batches. The student's credentials and a scannable QR code are then dispatched via email through the configured SMTP server. This QR code gives the student immediate access to all supported identification modes from the moment of registration, reducing the wait time associated with physical ID card issuance.

---

#### Module 2: Multi-Modal Library Access (Face Login / Logout)

This module serves as the primary gateway of the library, managing the entry and exit of all students through four interchangeable identification methods: facial recognition, RFID card tap, QR code scan, and barcode scan. This redundancy ensures that no single point of hardware failure can prevent a student from accessing the library.

The module applies the system's **Session-Based Login and Logout Detection** logic to every successful identification. Rather than maintaining a separate status field, the system counts how many access log entries exist for the identified student on the current date. If the count is odd, the student is logging in; if even, the student is logging out. This stateless approach simplifies the data model while remaining accurate for all standard use cases.

Every access event — successful or not — is automatically photographed and saved as a security record. If a student's face cannot be matched to any enrolled profile, the system still captures and stores the image alongside the failed attempt, treating it as an unknown individual and surfacing it on the administrator's security alert feed for immediate review.

Additionally, the module enforces the **Locker-Return Gate Rule** at the point of logout: before recording a logout entry, the system checks whether the student has any active, unreturned locker key. If an open borrow record exists, the logout is blocked and a warning is displayed, ensuring that no student can leave the premises with an unreturned key.

---

#### Module 3: Face Recognition Engine

The Face Recognition Engine is a dedicated microservice developed in Python using the FastAPI framework and operates independently from the main web application on a designated local port. This architectural separation is intentional: by isolating face processing into its own service, the system ensures that the computationally intensive task of biometric matching does not degrade the responsiveness of the web interface or other concurrent operations.

When a student faces the camera at the library entrance, the browser captures a 128-dimensional facial descriptor using face-api.js and transmits it to the main Laravel application, which forwards it to this service via an internal HTTP request. The service then retrieves all stored face embeddings from the student database and computes the **Euclidean distance** between the submitted descriptor and each enrolled profile. Euclidean distance measures how closely two facial readings resemble each other: a lower distance indicates a stronger match, while a higher distance suggests a greater difference. The service returns the Library ID of the student whose profile yields the smallest distance, provided that distance falls below the administrator-configured sensitivity threshold. This threshold is stored in `tbl_sensitivity_thresholds` and defaults to 0.45, balancing recognition accuracy with tolerance for natural lighting and angle variations. Administrators can raise or lower this threshold at any time through the settings panel to tune the system's strictness without touching the source code.

---

#### Module 4: Real-Time Dashboard and Monitoring

This module serves as the administrative command center, providing library staff with a continuously updated operational view of the library without any manual data entry or compilation. The dashboard aggregates data from the attendance and access logs in real time and presents four key indicators: the number of students currently present inside the library, the total number of access events recorded for the current day, the total number of enrolled students in the system, and a chronological log table showing every login and logout event with the corresponding student name, photo, course, Library ID, and timestamp.

The current headcount is derived directly from the same session-based odd/even log count logic used in the access control module — students with an odd number of log entries for the day are counted as presently inside. This ensures that the dashboard always reflects the real-time state of the library without relying on a separate presence tracking field.

The module also maintains a dedicated **Security Alert Feed** displaying all failed or unrecognized access attempts from the current day, each accompanied by the captured image taken at the time of the attempt. This gives administrators immediate visibility over individuals who were denied entry or who could not be identified, supporting proactive security management without requiring a manual review of raw database records.

---

#### Module 5: Locker Depository Management

This module manages the full lifecycle of the library's physical locker key inventory, replacing the previously manual and error-prone paper-based tracking system. It enforces a **mandatory two-step transaction protocol** specifically designed to prevent unauthorized key handoffs and ensure that every borrow event is tied to a verified, authenticated student.

The process begins when the librarian scans the physical RFID tag attached to a locker key. The system identifies the key in the locker registry and confirms that it is currently available. If the key is already marked as borrowed, the transaction is rejected and the librarian is notified. In the second step, the student presents their Library ID using any of the four supported methods. The system performs two additional checks: it verifies that the student is currently logged into the library (using the same session log analyzed by the access control module), and confirms that the student does not already hold an unreturned locker key. Only when both checks pass does the system proceed to create a borrow record, update the locker key's availability status, and display a confirmation to the librarian with the student's name, assigned locker number, and timestamp.

The return process mirrors this flow, with the librarian scanning the returned key and the student tapping their ID. The system records the exact return time and restores the locker key's availability for subsequent borrowers. This complete transaction history is maintained in the database, giving administrators a reliable audit trail for all locker activity and enabling accurate accountability in the event of a lost or damaged key.

---

#### Module 6: Student Records and Lost ID Management

This module provides administrators with full control over the student registry — the central source of truth for all identity and enrollment data in the system. Staff can search for students by name, Library ID, or student number, view complete profile pages that include personal details, enrolled face data status, QR sent status, and access history, and perform updates or deletions as needed. Outgoing notification emails can be composed and dispatched directly from a student's profile page without switching to an external mail client.

The module also introduces a formalized **Lost ID Reporting Workflow**, designed to track the replacement process for misplaced or damaged library cards. When a student reports a lost ID, library staff initiate a report that captures the student's old Library ID, student number, the location where the card was lost, a narrative description, and a scanned copy of the required affidavit document. The report is saved under the responsible staff member's account. Once a replacement card is prepared and a new Library ID is issued, the new ID is linked directly to the same report record, preserving the full chain of custody and making it easy to audit the replacement history of any particular student over time.

---

#### Module 7: Survey and Feedback Management

This module provides the library with a built-in mechanism for gathering structured feedback from students and community members, eliminating the need for separate external survey tools. Administrators can create surveys from scratch, giving each one a title, description, and publication status (draft, active, or closed). Each survey can contain any number of questions, and each question can be configured as one of seven types: short text, paragraph, multiple choice, checkboxes, dropdown, rating scale, or date input. Questions can be marked as required and may be reordered to match the desired flow of the survey.

Once a survey is set to active, it is made available for responses. Respondents may submit their answers with or without identifying themselves — the system accepts optional name and email fields to support both anonymous and attributed feedback collection. All submitted responses are stored and linked to the originating survey, allowing administrators to review answers on a per-submission basis. This module supports the institution's continuous improvement objectives by providing a standardized, in-system pathway for collecting feedback on library services, facilities, and student satisfaction.

---

#### Module 8: System Configuration and AI Assistant

This module serves as the administrative control panel for all system-level settings, ensuring that the ILMS can be tailored to the operational needs of the institution without requiring changes to the underlying source code. Administrators can configure three categories of settings directly through the interface:

First, the **Face Recognition Sensitivity** setting controls the Euclidean distance threshold used by the face recognition engine. Lowering this value makes the system stricter — requiring a very close match before granting access — while raising it makes the system more permissive, accommodating greater variation in lighting and angle. This allows librarians to calibrate the biometric system based on the physical conditions of their specific entrance setup.

Second, the **Email Server Configuration** allows administrators to input the SMTP host, port, username, and password used to send student credentials and notification emails. This makes the system compatible with any institutional or commercial email provider without hardcoding connection details.

Third, the **AI Assistant Configuration** allows selection of the AI provider (a locally hosted model via Ollama for offline environments, or a cloud-based API provider for internet-connected setups), the specific model to use, and a custom system prompt that defines the AI's role and scope of responses within the library context.

The integrated **AI Assistant** itself is accessible from this module as a conversational chat interface. Library staff can submit natural-language questions about library operations, student data, system status, or administrative decisions and receive contextually informed responses. This feature reduces the reliance on external help channels for routine inquiries and places intelligent decision support directly within the library management environment.

---

### Summary of System Architecture

| Layer | Component | Technology |
|---|---|---|
| **Presentation Layer** | Web Interface | React + Inertia.js (browser-based) |
| **Application Logic Layer** | Web Application Framework | Laravel 11 (PHP) |
| **Application Logic Layer** | Face Recognition Microservice | Python 3 + FastAPI (port 8000) |
| **Application Logic Layer** | Face Capture (Client-Side) | face-api.js |
| **Application Logic Layer** | Email Service | SMTP (configurable) |
| **Application Logic Layer** | AI Assistant | Ollama (local) or cloud AI provider |
| **Data Layer** | Relational Database | MySQL |
| **Cross-Layer** | Staff Authentication | Laravel Jetstream + Two-Factor Authentication |
| — | Deployment Environment | Local institutional server |
| — | SDLC Methodology | Modified Waterfall |
| — | Quality Standard | ISO 25010 |
| — | Acceptance Model | Technology Acceptance Model (TAM) |

