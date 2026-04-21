# ILMS — Methodology Justification
## Modified Waterfall Software Development Lifecycle

**Integrated Library Management System (ILMS)**
National Aviation Academy of the Philippines (NAAP)

---

## Methodology Justification

The development of the Integrated Library Management System (ILMS) is guided by a **Modified Waterfall software development lifecycle (SDLC)**. This methodological choice is necessitated by the technical complexity of the project: upgrading an existing library infrastructure that relies exclusively on barcode technology — a method known for persistent tracking inaccuracies — into a unified, web-based platform capable of supporting multi-modal authentication, integrated depository management, and automated record generation with data analytics.

The Modified Waterfall model was selected over iterative or agile approaches for several critical reasons grounded in the specific nature and constraints of this institutional deployment.

### 1. Requirement Finalization Before Implementation

The ILMS integrates multiple hardware and software subsystems that are architecturally interdependent. The facial recognition pipeline relies on a dedicated Python FastAPI microservice (`:8000`) that must be deployed and calibrated before the web application can perform any face-based authentication. The RFID authentication subsystem requires physical hardware compatibility validation before student enrollment workflows can be designed. The locker depository system enforces a strict two-step transaction model — librarian scans the RFID locker key, then the student taps their Library ID — which requires that the database schema (`tbl_rfid_info`, `tbl_rfidhistory`, `tbl_student_info`, `tbl_student_logs`) and business rules be fully specified before development begins. Any mid-development changes to these architectural parameters risk cascading failures across all integrated subsystems.

The Modified Waterfall model enforces the **requirement-first discipline** necessary to finalize all hardware integration parameters, authentication mode specifications, data store schemas, and security policies prior to coding, ensuring that the implementation phase proceeds on a structurally sound and stable foundation.

### 2. Hardware-Software Integration Complexity

The ILMS is distinguished by its multi-modal authentication framework, which simultaneously integrates four distinct input mechanisms:

| Authentication Mode | Technology | Handled By |
|---|---|---|
| Facial Recognition | face-api.js (browser) + Python FastAPI | `FaceLoginController` + `face_engine/main.py` |
| RFID Tap | Physical RFID card reader | `TapLoginController` |
| QR Code Scan | Browser-based QR decoder | `TapLoginController` |
| Barcode (Legacy) | Barcode scanner (fallback) | `TapLoginController` |

Each authentication mode requires a distinct hardware component, integration layer, and validation protocol. The calibration of the face recognition Euclidean distance threshold (`tbl_sensitivity_thresholds`), the mapping of physical RFID numbers to student Library IDs (`tbl_student_info.STUDENT_RFID_NUMBER`), and the locker RFID key registry (`tbl_rfid_info`) must all be tested in sequence under controlled conditions. The structured, phase-by-phase progression of the Modified Waterfall methodology provides the systematic validation checkpoints necessary to confirm hardware-software compatibility at each stage before advancing to the next.

### 3. Alignment with ISO 25010 Quality Standards

Upon completion, the ILMS will be evaluated against **ISO 25010** standards, with assessment focused on four key quality characteristics: **functional suitability**, **performance efficiency**, **reliability**, and **maintainability**. Achieving compliance with these rigorous benchmarks requires that the system architecture, database design, and integration logic be fully documented and finalized before implementation — an imperative that is structurally enforced by the Waterfall approach.

Specifically:
- **Functional Suitability** demands that all seven defined system processes (Student Registration, Face Login/Logout, Face Recognition Engine, Dashboard Monitoring, Locker Management, Student Management, and AI Assistant) be individually specified and traceable to the original requirements before development.
- **Performance Efficiency** requires that the Python face recognition engine response latency, the real-time dashboard polling cycle, and the locker transaction response time be benchmarked against defined targets established during the design phase.
- **Reliability** mandates that the access logging system (`tbl_student_logs`, `tbl_access_attempts`) produce accurate, consistent records under all authentication modes without data loss or duplication, a guarantee that can only be validated through structured system testing conducted after full implementation.
- **Maintainability** is served by the Waterfall methodology's emphasis on complete documentation at each phase, producing a system that future developers can extend — for example, adding biometric fingerprint recognition (`tbl_sensitivity_thresholds` already includes a `fingerprint` threshold entry) — without architectural disruption.

### 4. Structured Feedback Loops

While the classical Waterfall model is strictly sequential, the **Modified** variant adopted for this project incorporates controlled feedback loops between adjacent phases. This accommodation is essential for a system as technically integrated as the ILMS. Specifically:

- Findings from the **system evaluation phase** (ISO 25010 assessment) can feed back into the **implementation phase** for targeted defect remediation without requiring a complete restart of prior phases.
- Results from **user acceptance testing** (TAM assessment — perceived usefulness and perceived ease of use among library staff and students) can inform refinements to the user interface layer without affecting core authentication or database logic.
- The face recognition sensitivity threshold (`tbl_sensitivity_thresholds`) is designed as a configurable parameter precisely to allow post-deployment calibration based on real-world performance feedback, without requiring code changes.

### 5. Institutional Deployment Context

The ILMS is being deployed to a live institutional environment — the library of the National Aviation Academy of the Philippines — where operational continuity is non-negotiable. Unlike experimental or startup-grade projects, institutional deployments demand that the system be correct and complete before it replaces existing infrastructure. The Modified Waterfall model's emphasis on **comprehensive pre-deployment validation** — including requirements analysis, structured design review, unit testing, integration testing, and formal system evaluation — provides the quality assurance framework necessary to justify replacement of the current system with the ILMS without introducing new operational disruptions.

---

## Development Phases

The following outlines the sequential phases of the Modified Waterfall SDLC as applied to the ILMS:

| Phase | Key Activities | ILMS-Specific Deliverables |
|---|---|---|
| **1. Requirements Analysis** | Assessment of current system deficiencies; staff interviews; system testing of existing barcode infrastructure | Requirements specification; gap analysis report; hardware compatibility study |
| **2. System Design** | Architecture design; database schema finalization; authentication mode specification; UI/UX wireframes | Database schema (`tbl_student_info`, `tbl_student_logs`, `tbl_access_attempts`, `tbl_rfid_info`, `tbl_rfidhistory`); DFD Level 0 & Level 1; IPO Model; ERD |
| **3. Implementation** | Development of web platform (Laravel 11 + React/Inertia.js); Python FastAPI face engine; multi-modal authentication modules; depository management; automated reporting; AI assistant integration | Working ILMS codebase with all seven functional processes (P1–P7) |
| **4. Testing** | Unit testing per controller; integration testing of hardware interfaces; session logic validation; locker transaction flow testing; email credential delivery testing | Test reports; defect logs; threshold calibration results |
| **5. System Evaluation** | ISO 25010 assessment (functional suitability, performance efficiency, reliability, maintainability); structured questionnaire administration | ISO 25010 evaluation report; performance benchmarks |
| **6. User Acceptance** | TAM-based assessment among library staff and students (perceived usefulness, perceived ease of use) | TAM survey results; acceptance rate analysis |
| **7. Deployment** | Production deployment on institutional server; staff training; documentation handover | Deployed ILMS; user manual; technical documentation |
| **8. Maintenance** | Post-deployment monitoring; threshold recalibration; system updates; defect resolution | Maintenance log; updated sensitivity thresholds; patch records |

---

## Summary

The Modified Waterfall SDLC was selected for the ILMS not merely as a procedural convention, but as a **strategic architectural decision** driven by the system's multi-hardware integration requirements, the institutional context of its deployment, and the mandatory compliance with ISO 25010 quality standards. The structured, phase-sequential approach guarantees that every component of the ILMS — from the face recognition engine to the locker depository system — is designed, implemented, tested, and validated within a disciplined quality framework before it is entrusted with the daily operational management of the NAAP library.

The following figure illustrates the project's Gantt Chart, providing a comprehensive visualization of the structured timeline and the sequential progression of development phases, extending from the initial requirement analysis through to long-term system maintenance.
