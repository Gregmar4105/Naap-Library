import os
import json
import mysql.connector
import numpy as np
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

def get_db_connection():
    return mysql.connector.connect(
        host=os.getenv("DB_HOST", "127.0.0.1"),
        user=os.getenv("DB_USERNAME", "root"),
        password=os.getenv("DB_PASSWORD", "root"),
        database=os.getenv("DB_DATABASE", "naap_db_from_web"),
        port=int(os.getenv("DB_PORT", "3306"))
    )

try:
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT LIBRARY_ID, FACE_EMBEDDING FROM tbl_student_info WHERE FACE_EMBEDDING IS NOT NULL LIMIT 1")
    record = cursor.fetchone()
    
    if record:
        print(f"Library ID: {record['LIBRARY_ID']}")
        raw = record['FACE_EMBEDDING']
        print(f"Raw Type: {type(raw)}")
        
        # If it's a string (JSON), parse it
        if isinstance(raw, str):
            data = json.loads(raw)
            print(f"Parsed Type: {type(data)}")
            if isinstance(data, dict):
                for k, v in data.items():
                    print(f"  {k}: {type(v)} | len={len(v) if isinstance(v, list) else 'N/A'}")
                    if isinstance(v, list) and len(v) > 0:
                        print(f"    First 3: {v[:3]}")
    else:
        print("No records found.")
    
    cursor.close()
    conn.close()
except Exception as e:
    print(f"Error: {e}")
