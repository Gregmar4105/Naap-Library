# NAAP Library System — Use Case Diagram

> **Use Case Diagram** — Illustrates the interactions between the system's actors and the various functions (use cases) provided by the Integrated Library Management System (ILMS). This version expands upon previous iterations to explicitly include detailed system modules (e.g., all login methods, linking biometrics, announcements) while strictly adhering to UML standards and role-based access.

---

## Diagram

```mermaid
flowchart LR
    %% ══════════════════════════════════════
    %% ACTORS
    %% ══════════════════════════════════════
    Student["**👤 Student**\n(Library Patron)"]
    Librarian["**👤 Librarian**\n(Daily Operations)"]
    Admin["**👤 Administrator**\n(System Admin)"]

    %% ══════════════════════════════════════
    %% SYSTEM BOUNDARY
    %% ══════════════════════════════════════
    subgraph ILMS ["**Enhanced Library System (ILMS)**"]
        direction TB

        %% Student Use Cases
        UC_Survey_Respond(["Respond to Survey"])
        UC_Receive_Email(["Receive Email"])
        UC_Auth(["Authentication\n(Log In / Log Out)"])
        
        %% Authentication Methods
        UC_Face(["Face Scan"])
        UC_RFID(["RFID Scan"])
        UC_Barcode(["Barcode Scan"])
        UC_QR(["QR Code Scan"])

        %% Librarian Use Cases
        UC_Register(["Student Registration"])
        UC_LinkFace(["Link Face Data"])
        UC_LinkRFID(["Link RFID Data"])
        UC_Search(["Search Student"])
        UC_List(["View Student List"])
        UC_SendEmail(["Send Email"])
        UC_LostID(["Report Lost ID"])
        UC_Depository(["Manage Depository\n(Locker)"])

        %% Admin Use Cases
        UC_ManageSurveys(["Manage Surveys"])
        UC_Reports(["Reports & Analytics"])
        UC_Announcements(["Manage Announcements"])
        UC_AI(["Manage Virtual AI Librarian"])
        UC_SystemLogs(["View System Logs"])
        UC_Config(["Settings / Configuration"])
        UC_Notes(["Manage Notes & To-Do List"])
        UC_StudentLogs(["View Student Logs"])
    end

    %% ══════════════════════════════════════
    %% RELATIONSHIPS
    %% ══════════════════════════════════════
    
    %% Student Associations
    Student --- UC_Survey_Respond
    Student --- UC_Receive_Email
    Student --- UC_Auth

    %% Authentication Specialization (Generalization)
    UC_Face -- "is a" --> UC_Auth
    UC_RFID -- "is a" --> UC_Auth
    UC_Barcode -- "is a" --> UC_Auth
    UC_QR -- "is a" --> UC_Auth

    %% Librarian Associations
    Librarian --- UC_Register
    Librarian --- UC_Search
    Librarian --- UC_List
    Librarian --- UC_SendEmail
    Librarian --- UC_LostID
    Librarian --- UC_Depository

    %% Registration Sub-tasks (Include)
    UC_Register -. "<<include>>" .-> UC_LinkFace
    UC_Register -. "<<include>>" .-> UC_LinkRFID

    %% Admin Associations
    Admin --- UC_ManageSurveys
    Admin --- UC_Reports
    Admin --- UC_Announcements
    Admin --- UC_AI
    Admin --- UC_SystemLogs
    Admin --- UC_Config
    Admin --- UC_Notes
    Admin --- UC_StudentLogs

    %% Admin inherits Librarian privileges
    Admin -. "inherits privileges" .-> Librarian

    %% ══════════════════════════════════════
    %% STYLES
    %% ══════════════════════════════════════
    classDef actor fill:#1e3a5f,color:#fff,stroke:#4a90d9,stroke-width:2.5px
    classDef usecase fill:#e6f2ff,color:#000,stroke:#0d6efd,stroke-width:2px
    classDef system fill:none,color:#000,stroke:#333,stroke-width:2px,stroke-dasharray: 5 5

    class Student,Librarian,Admin actor
    class UC_Survey_Respond,UC_Receive_Email,UC_Auth,UC_Face,UC_RFID,UC_Barcode,UC_QR,UC_Register,UC_LinkFace,UC_LinkRFID,UC_Search,UC_List,UC_SendEmail,UC_LostID,UC_Depository,UC_ManageSurveys,UC_Reports,UC_Announcements,UC_AI,UC_SystemLogs,UC_Config,UC_Notes,UC_StudentLogs usecase
    class ILMS system
```

---

## Actors & Responsibilities

| Actor | Description |
|---|---|
| **Student (Patron)** | The primary end-user who interacts with the system via access terminals and interfaces to access library services. |
| **Librarian** | Operational staff member responsible for daily library transactions, student enrollment, communication, and manual operations. |
| **Administrator** | Highest authority user with full access to configuration, data analytics, overall system maintenance, and AI integration. Inherits all Librarian capabilities. |

## Use Case Descriptions

### Student Use Cases
- **Respond to Survey**: Providing feedback through active surveys published by the administration.
- **Receive Email**: Receiving automated system notifications, QR codes, and credentials.
- **Authentication (Log In / Log Out)**: General authentication into the library.
  - *Face Scan*: Authenticate using facial recognition.
  - *RFID Scan*: Authenticate using an assigned physical RFID card/token.
  - *Barcode Scan*: Authenticate using a legacy ID barcode.
  - *QR Code Scan*: Authenticate using a dynamically generated QR code.

### Librarian Use Cases
- **Student Registration**: Enrolling new students into the library system.
  - *`<<include>>` Link Face Data*: Capturing and registering the student's biometric data.
  - *`<<include>>` Link RFID Data*: Assigning a physical RFID token to the student's record.
- **Search Student**: Querying the database to find specific student records.
- **View Student List**: Accessing a paginated directory of registered students.
- **Send Email**: Manually dispatching or triggering email communications to students.
- **Report Lost ID**: Flagging an RFID/Barcode as lost and unlinking it to prevent unauthorized access.
- **Manage Depository**: Handling locker key assignments, claims, and returns.

### Administrator Use Cases
- **Manage Surveys**: Creating, editing, and publishing feedback surveys for students.
- **Reports & Analytics**: Generating statistical reports on attendance, system usage, and inventory.
- **Manage Announcements**: Creating public service broadcasts or library updates.
- **Manage Virtual AI Librarian**: Querying, tuning, and monitoring the system's integrated AI chatbot.
- **View System Logs**: Reviewing application-wide event logs and audit trails for security and debugging.
- **Settings / Configuration**: Adjusting global system thresholds (e.g., facial recognition confidence), API keys, and configurations.
- **Manage Notes & To-Do List**: Adding and maintaining internal administrative tasks or calendar events.
- **View Student Logs**: Detailed monitoring of individual student access histories.
