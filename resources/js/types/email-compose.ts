export interface Student {
    LIBRARY_ID: string;
    STUDENT_NUMBER: string;
    STUDENT_RFID_NUMBER: string | null;
    FN: string;
    MN: string | null;
    LN: string;
    SEX: string | null;
    BIRTHDAY: string | null;
    CONTACT_NUMBER: string | null;
    EMAIL: string | null;
    COURSE: string | null;
    PIC: string | null;
    ID_STATUS: string | null;
    REGISTERED_ON: string | null;
    RENEW_ON: string | null;
    FACE_EMBEDDING: any;
    QR_SENT: boolean;
}

export interface EmailState {
    student: Student;
    isMinimized: boolean;
    form: {
        subject: string;
        body: string;
    };
    attachments: File[];
    isSending: boolean;
    sentSuccess: boolean;
    error: string | null;
}
