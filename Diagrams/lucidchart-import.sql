CREATE TABLE users (
  id BIGINT PRIMARY KEY,
  name VARCHAR(255),
  email VARCHAR(255),
  email_verified_at TIMESTAMP,
  password VARCHAR(255),
  two_factor_secret TEXT,
  two_factor_recovery_codes TEXT,
  two_factor_confirmed_at TIMESTAMP,
  remember_token VARCHAR(100),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

CREATE TABLE sessions (
  id VARCHAR(255) PRIMARY KEY,
  user_id BIGINT,
  ip_address VARCHAR(45),
  user_agent TEXT,
  payload LONGTEXT,
  last_activity INT,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE password_reset_tokens (
  email VARCHAR(255) PRIMARY KEY,
  token VARCHAR(255),
  created_at TIMESTAMP
);

CREATE TABLE tbl_student_info (
  LIBRARY_ID VARCHAR(255) PRIMARY KEY,
  STUDENT_RFID_NUMBER VARCHAR(255),
  STUDENT_NUMBER VARCHAR(255),
  FN VARCHAR(255),
  MN VARCHAR(255),
  LN VARCHAR(255),
  SEX VARCHAR(255),
  BIRTHDAY VARCHAR(255),
  CONTACT_NUMBER VARCHAR(255),
  EMAIL VARCHAR(255),
  QR_SENT TINYINT,
  PIC VARCHAR(255),
  COURSE VARCHAR(255),
  ADDRESS VARCHAR(255),
  REGISTERED_ON DATE,
  RENEW_ON DATE,
  ID_STATUS VARCHAR(255),
  ID_STATUS_DATE DATE,
  FACE_EMBEDDING JSON
);

CREATE TABLE tbl_student_logs (
  id BIGINT PRIMARY KEY,
  LIBRARY_ID VARCHAR(255),
  LOG_TIME TIME,
  LOG_DATE DATE,
  LOG_SESSION VARCHAR(255),
  LOG_IMAGE VARCHAR(255),
  FOREIGN KEY (LIBRARY_ID) REFERENCES tbl_student_info(LIBRARY_ID)
);

CREATE TABLE tbl_access_attempts (
  id BIGINT PRIMARY KEY,
  LIBRARY_ID VARCHAR(255),
  STATUS ENUM('success', 'failed'),
  IMAGE_PATH VARCHAR(255),
  ATTEMPT_TYPE VARCHAR(255),
  LOG_DATE DATE,
  LOG_TIME TIME,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  FOREIGN KEY (LIBRARY_ID) REFERENCES tbl_student_info(LIBRARY_ID)
);

CREATE TABLE tbl_rfid_info (
  RFID_NUMBER VARCHAR(255) PRIMARY KEY,
  LOCKER_NUMBER INT,
  IS_AVAILABLE VARCHAR(255)
);

CREATE TABLE tbl_rfidhistory (
  id BIGINT PRIMARY KEY,
  RFID_CARD_NUMBER VARCHAR(255),
  LIBRARY_ID VARCHAR(255),
  BORROW_ON DATETIME,
  RETURN_ON DATETIME,
  LOCKER_NUMBER VARCHAR(255),
  EMP_ID BIGINT,
  FOREIGN KEY (RFID_CARD_NUMBER) REFERENCES tbl_rfid_info(RFID_NUMBER),
  FOREIGN KEY (LIBRARY_ID) REFERENCES tbl_student_info(LIBRARY_ID),
  FOREIGN KEY (EMP_ID) REFERENCES users(id)
);

CREATE TABLE tbl_lost_id_reports (
  id BIGINT PRIMARY KEY,
  old_library_id VARCHAR(255),
  new_library_id VARCHAR(255),
  student_number VARCHAR(255),
  location_lost VARCHAR(255),
  description TEXT,
  affidavit_path VARCHAR(255),
  processed_by BIGINT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  FOREIGN KEY (processed_by) REFERENCES users(id)
);

CREATE TABLE email_messages (
  id BIGINT PRIMARY KEY,
  library_id VARCHAR(255),
  subject VARCHAR(255),
  body LONGTEXT,
  attachments VARCHAR(255),
  sent_to VARCHAR(255),
  is_read BOOLEAN,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  FOREIGN KEY (library_id) REFERENCES tbl_student_info(LIBRARY_ID)
);

CREATE TABLE surveys (
  id BIGINT PRIMARY KEY,
  title VARCHAR(255),
  description TEXT,
  status VARCHAR(255),
  created_by BIGINT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE survey_questions (
  id BIGINT PRIMARY KEY,
  survey_id BIGINT,
  order_index INT,
  type VARCHAR(255),
  label TEXT,
  options JSON,
  required BOOLEAN,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  FOREIGN KEY (survey_id) REFERENCES surveys(id)
);

CREATE TABLE survey_responses (
  id BIGINT PRIMARY KEY,
  survey_id BIGINT,
  respondent_name VARCHAR(255),
  respondent_email VARCHAR(255),
  answers JSON,
  submitted_at TIMESTAMP,
  FOREIGN KEY (survey_id) REFERENCES surveys(id)
);

CREATE TABLE tbl_sensitivity_thresholds (
  id BIGINT PRIMARY KEY,
  key_name VARCHAR(255),
  value DECIMAL,
  description VARCHAR(255),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

CREATE TABLE tbl_settings (
  id BIGINT PRIMARY KEY,
  key_name VARCHAR(255),
  value TEXT,
  description VARCHAR(255),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

CREATE TABLE audit_trails (
  id BIGINT PRIMARY KEY,
  user_id BIGINT,
  auditable_type VARCHAR(255),
  auditable_id VARCHAR(255),
  event VARCHAR(255),
  old_values JSON,
  new_values JSON,
  url VARCHAR(255),
  ip_address VARCHAR(255),
  created_at TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE calendar_notes (
  id BIGINT PRIMARY KEY,
  user_id BIGINT,
  title VARCHAR(255),
  note_date DATE,
  note_time TIME,
  description TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE chats (
  id BIGINT PRIMARY KEY,
  user_id BIGINT,
  title VARCHAR(255),
  status VARCHAR(255),
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE chat_messages (
  id BIGINT PRIMARY KEY,
  chat_id BIGINT,
  user_id BIGINT,
  message TEXT,
  role VARCHAR(255),
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  FOREIGN KEY (chat_id) REFERENCES chats(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
