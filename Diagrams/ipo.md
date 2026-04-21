# Integrated Library Management System (ILMS)
## Input–Process–Output (IPO) Model
**National Aviation Academy of the Philippines**

---

<table width="100%" style="border-collapse:collapse; font-family: Arial, sans-serif;">
<thead>
  <tr>
    <th width="33%" style="background:#8DC63F; text-align:center; padding:12px; border:2px solid #555; font-size:16px;">INPUT</th>
    <th width="33%" style="background:#8DC63F; text-align:center; padding:12px; border:2px solid #555; font-size:16px;">PROCESS</th>
    <th width="33%" style="background:#8DC63F; text-align:center; padding:12px; border:2px solid #555; font-size:16px;">OUTPUT</th>
  </tr>
</thead>
<tbody>
  <tr valign="top">
    <td style="border:2px solid #555; padding:14px;">

**1.** Student biometric and identity data submitted via multi-modal authentication — including 128-D facial descriptors captured through face-api.js, RFID card numbers, QR codes, and legacy barcode scan data presented at the library entrance.

**2.** Student registration data entered by the librarian, including full name, student number, course, date of birth, contact details, profile photo, and RFID card number, together with the enrolled 128-D face descriptor captured from five angles (up, down, left, right, center).

**3.** RFID locker key scan data entered by librarian staff to initiate locker borrowing or return transactions, paired with the student's Library ID tapped via RFID, QR code, or barcode.

**4.** Administrator configuration inputs including face recognition sensitivity thresholds (Euclidean distance), mail server settings (SMTP host, port, credentials), and AI assistant parameters (provider, model, system prompt).

**5.** AI assistant natural-language queries submitted by library administrators for system-related inquiries.

    </td>
    <td style="border:2px solid #555; padding:14px;">

**1.** Multi-modal authentication processing — the system accepts a face scan (128-D descriptor) and delegates it to the Python FastAPI face recognition engine (`:8000`), which computes Euclidean distance against all stored embeddings and returns the matched Library ID if the distance is below the configured threshold. Alternatively, RFID, QR, or barcode tap is matched directly against `tbl_student_info`.

**2.** Session-based access logging — upon successful authentication, the system determines login or logout state using an odd/even log count per student per day (`tbl_student_logs`), then writes a timestamped entry paired by `LOG_SESSION`. Logout is blocked if an unreturned locker key is detected.

**3.** Security attempt recording — every authentication scan, whether successful or failed, is written to `tbl_access_attempts` with a captured image, attempt type (login/logout), date, time, and status (success/failed). Failed entries with null `LIBRARY_ID` flag unknown individuals.

**4.** Student registration and credential generation — new student records are created in `tbl_student_info` with an auto-generated Library ID (`YY-NNNNN`), face embeddings are stored as JSON, and QR-coded credentials are dispatched via SMTP email.

**5.** Two-step locker depository management — librarian scans the physical RFID locker key (`tbl_rfid_info`); system verifies availability. Student taps Library ID; system confirms login status and absence of an existing active borrow before creating a borrow record in `tbl_rfidhistory`. Return reverses the process by recording `RETURN_ON` and restoring key availability.

**6.** Real-time dashboard aggregation — the system groups today's logs by `LOG_SESSION`, determines login/logout type per entry, counts currently-present students (odd log count), compiles failed access attempts, and aggregates statistics: currently in, total today's entries, and total enrolled students.

**7.** AI-assisted query processing — administrator chat queries are forwarded to the configured AI provider (local Ollama or remote API) along with a system prompt, and the response is returned to the admin interface.

    </td>
    <td style="border:2px solid #555; padding:14px;">

**1.** Access grant or denial result displayed in real time, including the student's name, photo, course, Library ID, and time-in or time-out — accompanied by a captured facial image stored in `log_captures/`.

**2.** Automated attendance logs (`tbl_student_logs`) and access attempt records (`tbl_access_attempts`) generated per authentication event, eliminating manual compilation of student entry and exit data.

**3.** Real-time dashboard statistics displayed to the administrator: count of students currently inside the library, total access events for the day, total enrolled students, and a live-feed log table with login/logout type per entry.

**4.** Security alert feed showing today's failed/unknown detection attempts with captured images, enabling administrators to immediately identify unauthorized or unrecognized individuals.

**5.** Locker assignment or return confirmation message presented to the librarian, including the student's name, locker number, and timestamp — with borrow history automatically recorded in `tbl_rfidhistory`.

**6.** Email delivery of Library ID credentials and a scannable QR code to the registered student upon successful enrollment, enabling immediate use of all authentication modes.

**7.** AI assistant response delivered to the administrator, providing system-related insights or answers based on the configured AI model and institutional system prompt.

    </td>
  </tr>
</tbody>
</table>

---

<table width="60%" style="margin:0 auto; border-collapse:collapse; font-family: Arial, sans-serif;">
<tr>
  <td style="background:#8DC63F; text-align:center; padding:10px; border:2px solid #555; font-size:15px; font-weight:bold;">FEEDBACK</td>
</tr>
<tr>
  <td style="border:2px solid #555; padding:12px;">

- Access attempt results (success/failed, captured images) fed back into the dashboard and security audit feed, enabling administrators to review authentication events and adjust the face recognition sensitivity threshold in real time via `tbl_sensitivity_thresholds`.
- Locker return status fed back to the access log verification layer, enforcing the business rule that a student may not log out while a locker key remains unreturned.
- Dashboard statistics and attendance logs continuously updated by the system and surfaced back to the administrator, providing an evolving operational view that supports data-driven decisions for library management.
- AI assistant responses informed by the system's configuration settings (`tbl_settings`) and the administrator's query history, allowing iterative refinement of the AI model and system prompt to improve response accuracy over time.

  </td>
</tr>
</table>

---

## Summary Table

| Component | Details |
|---|---|
| **System** | Integrated Library Management System (ILMS) |
| **Institution** | National Aviation Academy of the Philippines (NAAP) |
| **Platform** | Web-based (Laravel 11 + React / Inertia.js) |
| **Auth Modes** | Facial Recognition · RFID · QR Code · Barcode |
| **Face Engine** | Python FastAPI `:8000` — Euclidean distance on 128-D descriptors |
| **SDLC** | Modified Waterfall |
| **Evaluation** | ISO 25010 (Functional Suitability, Performance, Reliability, Maintainability) |
| **Acceptance** | Technology Acceptance Model (TAM) — Perceived Usefulness & Ease of Use |
