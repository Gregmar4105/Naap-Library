import os
import json
import logging
import mysql.connector
import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

# Load Laravel's exact root .env
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class FaceDescriptor(BaseModel):
    descriptor: list[float]  # 128 elements

def get_db_connection():
    return mysql.connector.connect(
        host=os.getenv("DB_HOST", "127.0.0.1"),
        user=os.getenv("DB_USERNAME", "root"),
        password=os.getenv("DB_PASSWORD", "root"),
        database=os.getenv("DB_DATABASE", "naap_db_from_web"),
        port=int(os.getenv("DB_PORT", "3306"))
    )

@app.post("/recognize")
def recognize_face(payload: FaceDescriptor):
    input_descriptor = np.array(payload.descriptor)
    
    if len(input_descriptor) != 128:
        raise HTTPException(status_code=400, detail="Descriptor must be 128 dimensions")

    best_match_id = None
    best_distance = float('inf')
    threshold = 0.58  # Calibrated threshold for TinyFaceDetector descriptors (0.55-0.6 is common)

    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        # Only check students that have a face embedding registered
        cursor.execute("SELECT LIBRARY_ID, FACE_EMBEDDING FROM tbl_student_info WHERE FACE_EMBEDDING IS NOT NULL")
        records = cursor.fetchall()
        
        for record in records:
            try:
                # FACE_EMBEDDING might arrive as a JSON-encoded string or already-parsed list
                raw_descriptor = record['FACE_EMBEDDING']
                if not raw_descriptor:
                    continue
                
                # Robust parsing for double-encoding cases or already-parsed records
                if isinstance(raw_descriptor, str):
                    try:
                        registered_descriptor_list = json.loads(raw_descriptor)
                        # Handle potential double-encoding if it's still a string after one pass
                        if isinstance(registered_descriptor_list, str):
                           registered_descriptor_list = json.loads(registered_descriptor_list)
                    except json.JSONDecodeError:
                        continue
                else:
                    registered_descriptor_list = raw_descriptor

                # Compare input against all registered poses for this student
                if isinstance(registered_descriptor_list, dict):
                    for pose_name, descriptor in registered_descriptor_list.items():
                        try:
                            vec = np.array(descriptor)
                            if vec.ndim == 0 or len(vec) != 128:
                                continue
                            
                            dist = np.linalg.norm(input_descriptor - vec)
                            # Extra logging for diagnostic
                            if dist < 1.0: # Only log reasonable candidates
                                logger.info(f"Checking {record['LIBRARY_ID']} pose {pose_name}: dist={dist:.4f}")
                                
                            if dist < best_distance:
                                best_distance = dist
                                best_match_id = record['LIBRARY_ID']
                        except:
                            continue
                elif isinstance(registered_descriptor_list, list):
                    vec = np.array(registered_descriptor_list)
                    if vec.ndim != 0 and len(vec) == 128:
                        dist = np.linalg.norm(input_descriptor - vec)
                        logger.info(f"Checking {record['LIBRARY_ID']} single: dist={dist:.4f}")
                        if dist < best_distance:
                            best_distance = dist
                            best_match_id = record['LIBRARY_ID']
            except Exception as e:
                logger.error(f"Error processing record {record.get('LIBRARY_ID', 'unknown')}: {e}")
                continue

        cursor.close()
        conn.close()

        # Logging for diagnostic purposes (visible in terminal)
        if best_match_id:
            logger.info(f"PREDICTION: Best match ID: {best_match_id} | Distance: {best_distance:.4f} | Threshold: {threshold}")
        else:
            logger.info(f"PREDICTION: No candidates found in database.")

        if best_match_id and best_distance < threshold:
            return {"match": True, "library_id": best_match_id, "distance": float(best_distance)}
        else:
            return {
                "match": False, 
                "message": "No match found", 
                "best_distance": float(best_distance) if best_match_id else None,
                "best_match_id": best_match_id
            }

    except Exception as e:
        logger.error(f"Database connection or query failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
def health():
    return {"status": "ok"}
