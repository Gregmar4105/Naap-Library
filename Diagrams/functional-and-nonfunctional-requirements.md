# System Requirements

Based on the architectural framework and module specifications of the ILMS, the following functional and non-functional requirements have been established.

## Functional Requirements (FR)

**FR-01: Student Enrollment & Identity Provisioning**
The system must allow library personnel to register students by capturing demographic data, academic program details, and contact information. It must support the upload of a profile photograph and the recording of a physical RFID card number. Furthermore, the system must guide staff through capturing 128-dimensional facial descriptors from five distinct orientations. Upon completion, the system must autonomously generate a unique, sequential Library ID (YY-NNNNN) and dispatch the authentication credentials, including a scannable QR code, to the student's registered email address via SMTP.

**FR-02: Multi-Modal Access Control & Session Detection**
The system must govern library entry and exit through four interchangeable modalities: facial recognition, RFID card tap, QR code scanning, and legacy barcode scanning. It must programmatically apply a stateless odd/even session-based parity logic to determine whether a student is logging in or logging out. 

**FR-03: Security Auditing & Alerting**
The system must automatically capture and archive a photograph of every authentication attempt. If an access attempt is unrecognized or fails, the system must surface the captured image on an administrative Security Alert Feed for immediate institutional review.

**FR-04: Real-Time Operational Dashboard**
The system must provide an aggregated, real-time administrative dashboard displaying the current library headcount (derived from the parity logic), total daily access events, total enrolled students, and a chronological transaction log of all entries and exits.

**FR-05: Biometric Verification Engine**
The system must maintain a dedicated Face Recognition microservice capable of computing the Euclidean distance between a submitted live face descriptor and all archived face embeddings. It must return a positive match only if the lowest distance falls below an administrator-configurable sensitivity threshold.

**FR-06: Two-Step Locker Depository Management**
The system must enforce a two-step transaction protocol for locker assignments, requiring both an RFID scan of the physical locker key and student authentication. The system must verify that the student is currently logged into the facility and does not hold an unreturned key before generating a borrow record and updating the locker's availability status.

**FR-07: Locker-Return Gate Enforcement**
The system must actively intercept logout attempts and query the locker transaction registry. If the student has an active, unreturned locker key, the system must block the logout transaction and display an enforcement warning.

**FR-08: Student Registry & Lost ID Workflow**
The system must allow administrators to search, view, and modify student profiles, as well as dispatch emails directly from the profile interface. It must feature a dedicated Lost ID workflow that captures incident details and affidavits, and automatically maintains a relational link between the student's new replacement Library ID and their original records.

**FR-09: Dynamic Survey Generation**
The system must allow administrators to author, sequence, and publish surveys utilizing seven distinct input types. It must support both anonymous and attributed submissions, securely archiving all responses for institutional analysis.

**FR-10: System Configuration & AI Assistance**
The system must provide a control panel allowing administrators to modify biometric sensitivity thresholds, update SMTP email parameters, and configure AI provider settings. Additionally, it must feature a conversational AI Assistant interface to provide intelligent operational support directly within the platform.

---

## Non-Functional Requirements (NFR)

**NFR-01: Performance & Concurrency**
The computationally intensive facial recognition processes must be isolated within a dedicated Python FastAPI microservice to ensure that biometric matching operations do not degrade the response times or concurrency handling of the primary Laravel web interface.

**NFR-02: High Availability & Redundancy**
The access control gateway must support four redundant identification methods (Face, RFID, QR, Barcode) to ensure uninterrupted operational continuity in the event of partial hardware failure (e.g., camera malfunction or RFID reader disconnection).

**NFR-03: Maintainability & Configurability**
Core operational parameters—including biometric strictness thresholds, email server credentials, and AI model configurations—must be adjustable dynamically through the administrative interface, eliminating the need for direct source code modifications or application redeployments.

**NFR-04: Data Integrity & Stateless Architecture**
The system must ensure high data integrity by generating deterministic, collision-free Library IDs. Furthermore, the session-tracking architecture must remain strictly stateless, relying on the algorithmic aggregation of historical logs (odd/even parity) rather than mutable status fields to prevent state desynchronization.

**NFR-05: Security & Privacy Protection**
The system must ensure institutional security by capturing photographic evidence of all unauthorized or failed entry attempts. The face matching process must operate securely by transmitting mathematical descriptors rather than raw video feeds, thereby minimizing biometric data exposure over the network.
