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
    threshold: float = 0.45  # Optional custom threshold
    twin_threshold: float = 0.55  # Optional custom twin threshold

def get_db_connection():
    return mysql.connector.connect(
        host=os.getenv("DB_HOST", "127.0.0.1"),
        user=os.getenv("DB_USERNAME", "root"),
        password=os.getenv("DB_PASSWORD", "root"),
        database=os.getenv("DB_DATABASE", "naap_db_from_web"),
        port=int(os.getenv("DB_PORT", "3306"))
    )

def compute_vector_distance(v1: np.ndarray, v2: np.ndarray):
    """
    Computes a hybrid similarity metric using Euclidean distance and Cosine distance.
    Returns (euclidean_dist, cosine_dist, hybrid_score).
    """
    euclidean_dist = float(np.linalg.norm(v1 - v2))
    norm_v1 = np.linalg.norm(v1)
    norm_v2 = np.linalg.norm(v2)
    if norm_v1 > 0 and norm_v2 > 0:
        cosine_sim = float(np.dot(v1, v2) / (norm_v1 * norm_v2))
    else:
        cosine_sim = 0.0
    cosine_dist = float(1.0 - max(-1.0, min(1.0, cosine_sim)))
    
    # Normalized hybrid metric (Euclidean distance is scaled approx by max sqrt(2) for unit-norm vectors)
    hybrid_score = float(0.5 * (euclidean_dist / 1.414) + 0.5 * cosine_dist)
    return euclidean_dist, cosine_dist, hybrid_score

@app.post("/recognize")
def recognize_face(payload: FaceDescriptor):
    input_descriptor = np.array(payload.descriptor)
    
    if len(input_descriptor) != 128:
        raise HTTPException(status_code=400, detail="Descriptor must be 128 dimensions")

    best_match_id = None
    best_distance = float('inf')
    best_hybrid_score = float('inf')
    threshold = payload.threshold
    candidates = []

    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT LIBRARY_ID, FACE_EMBEDDING FROM tbl_student_info WHERE FACE_EMBEDDING IS NOT NULL")
        records = cursor.fetchall()
        
        for record in records:
            try:
                raw_descriptor = record['FACE_EMBEDDING']
                if not raw_descriptor:
                    continue
                
                if isinstance(raw_descriptor, str):
                    try:
                        registered_descriptor_list = json.loads(raw_descriptor)
                        if isinstance(registered_descriptor_list, str):
                           registered_descriptor_list = json.loads(registered_descriptor_list)
                    except json.JSONDecodeError:
                        continue
                else:
                    registered_descriptor_list = raw_descriptor

                student_min_distance = float('inf')
                student_min_cosine = float('inf')
                student_min_hybrid = float('inf')

                # Compare input against all registered poses for this student
                if isinstance(registered_descriptor_list, dict):
                    for pose_name, descriptor in registered_descriptor_list.items():
                        try:
                            vec = np.array(descriptor)
                            if vec.ndim == 0 or len(vec) != 128:
                                continue
                            
                            euc, cos, hybrid = compute_vector_distance(input_descriptor, vec)
                            if euc < student_min_distance:
                                student_min_distance = euc
                                student_min_cosine = cos
                                student_min_hybrid = hybrid
                        except:
                            continue
                elif isinstance(registered_descriptor_list, list):
                    vec = np.array(registered_descriptor_list)
                    if vec.ndim != 0 and len(vec) == 128:
                        euc, cos, hybrid = compute_vector_distance(input_descriptor, vec)
                        student_min_distance = euc
                        student_min_cosine = cos
                        student_min_hybrid = hybrid

                if student_min_distance < float('inf'):
                    if student_min_distance < 1.0:
                        logger.info(f"Student {record['LIBRARY_ID']} min dist={student_min_distance:.4f}, cos={student_min_cosine:.4f}, hybrid={student_min_hybrid:.4f}")
                        
                    if student_min_distance < best_distance:
                        best_distance = student_min_distance
                        best_hybrid_score = student_min_hybrid
                        best_match_id = record['LIBRARY_ID']

                    # Capture candidates within candidate similarity threshold
                    candidate_limit = payload.twin_threshold + 0.15
                    if student_min_distance < candidate_limit or student_min_cosine < 0.25:
                        similarity_pct = round(max(0.0, 1.0 - student_min_hybrid) * 100, 2)
                        candidates.append({
                            "library_id": record['LIBRARY_ID'],
                            "distance": float(student_min_distance),
                            "cosine_distance": float(student_min_cosine),
                            "hybrid_score": float(student_min_hybrid),
                            "similarity_percent": similarity_pct
                        })
            except Exception as e:
                logger.error(f"Error processing record {record.get('LIBRARY_ID', 'unknown')}: {e}")
                continue

        cursor.close()
        conn.close()

        if best_match_id:
            logger.info(f"PREDICTION: Best match ID: {best_match_id} | Distance: {best_distance:.4f} | Hybrid: {best_hybrid_score:.4f} | Candidates: {len(candidates)}")
        else:
            logger.info(f"PREDICTION: No candidates found in database.")

        if best_match_id and best_distance < threshold:
            return {
                "match": True, 
                "library_id": best_match_id, 
                "distance": float(best_distance),
                "hybrid_score": float(best_hybrid_score),
                "candidates": candidates
            }
        else:
            return {
                "match": False, 
                "message": "No match found", 
                "best_distance": float(best_distance) if best_match_id else None,
                "best_hybrid_score": float(best_hybrid_score) if best_match_id else None,
                "best_match_id": best_match_id,
                "candidates": candidates
            }


    except Exception as e:
        logger.error(f"Database connection or query failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
def health():
    return {"status": "ok"}
