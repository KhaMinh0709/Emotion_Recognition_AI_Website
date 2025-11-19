from fastapi import APIRouter, Query
from fastapi.responses import JSONResponse
from datetime import datetime, date
from typing import Dict, Any, List
from sqlalchemy import select, and_, func
from app.core.db import engine, results_table
from app.core.logger import setup_logger
import json

logger = setup_logger(__name__)

router = APIRouter()


@router.get("/all")
async def get_all_results() -> Dict[str, Any]:
    """
    Get all results from all sources (vision/face, audio, fusion_video_audio)
    Used for Dashboard display
    
    Returns:
    {
        "all_results": [
            {
                "id": int,
                "source": str,  # "face", "audio", or "fusion_video_audio"
                "timestamp": str,
                "emotion": str,
                "confidence": float,
                "all_emotions": dict
            }
        ],
        "count": int,
        "sources": {
            "face": int,
            "audio": int,
            "fusion_video_audio": int
        }
    }
    """
    try:
        with engine.begin() as conn:
            # Get all results ordered by timestamp descending
            stmt = select(results_table).order_by(results_table.c.timestamp.desc())
            rows = conn.execute(stmt).fetchall()
            
            all_results = []
            source_counts = {"face": 0, "audio": 0, "fusion_video_audio": 0}
            
            for row in rows:
                try:
                    payload = json.loads(row.payload)
                    result_item = {
                        "id": row.id,
                        "source": row.source,
                        "timestamp": row.timestamp.isoformat() if row.timestamp else None,
                        "emotion": payload.get("emotion"),
                        "confidence": payload.get("confidence"),
                        "all_emotions": payload.get("all_emotions", {}),
                    }
                    all_results.append(result_item)
                    
                    if row.source in source_counts:
                        source_counts[row.source] += 1
                except Exception as e:
                    logger.warning(f"Error parsing result row {row.id}: {e}")
                    continue
            
            return JSONResponse(content={
                "all_results": all_results,
                "count": len(all_results),
                "sources": source_counts
            })
    except Exception as e:
        logger.error(f"Error fetching all results: {e}")
        return JSONResponse(
            status_code=500,
            content={"detail": str(e)}
        )


@router.get("/by-date")
async def get_results_by_date(date_str: str = Query(..., description="Date in format YYYY-MM-DD")) -> Dict[str, Any]:
    """
    Get results from all sources (vision/face, audio, fusion_video_audio) for a specific date
    Used for New Analysis page
    
    Parameters:
    - date_str: Date string in format "YYYY-MM-DD" (e.g., "2024-01-15")
    
    Returns:
    {
        "date": str,
        "results": [
            {
                "id": int,
                "source": str,  # "face", "audio", or "fusion_video_audio"
                "timestamp": str,
                "emotion": str,
                "confidence": float,
                "all_emotions": dict
            }
        ],
        "count": int,
        "sources": {
            "face": int,
            "audio": int,
            "fusion_video_audio": int
        }
    }
    """
    try:
        # Parse date string
        target_date = datetime.strptime(date_str, "%Y-%m-%d").date()
        
        with engine.begin() as conn:
            # Query results for the specific date
            # We use DATE() function to compare only the date part
            from sqlalchemy import cast, Date
            
            stmt = select(results_table).where(
                cast(results_table.c.timestamp, Date) == target_date
            ).order_by(results_table.c.timestamp.desc())
            
            rows = conn.execute(stmt).fetchall()
            
            results = []
            source_counts = {"face": 0, "audio": 0, "fusion_video_audio": 0}
            
            for row in rows:
                try:
                    payload = json.loads(row.payload)
                    result_item = {
                        "id": row.id,
                        "source": row.source,
                        "timestamp": row.timestamp.isoformat() if row.timestamp else None,
                        "emotion": payload.get("emotion"),
                        "confidence": payload.get("confidence"),
                        "all_emotions": payload.get("all_emotions", {}),
                    }
                    results.append(result_item)
                    
                    if row.source in source_counts:
                        source_counts[row.source] += 1
                except Exception as e:
                    logger.warning(f"Error parsing result row {row.id}: {e}")
                    continue
            
            return JSONResponse(content={
                "date": date_str,
                "results": results,
                "count": len(results),
                "sources": source_counts
            })
    except ValueError:
        return JSONResponse(
            status_code=400,
            content={"detail": "Invalid date format. Use YYYY-MM-DD"}
        )
    except Exception as e:
        logger.error(f"Error fetching results for date {date_str}: {e}")
        return JSONResponse(
            status_code=500,
            content={"detail": str(e)}
        )


@router.get("/sources/{source_name}")
async def get_results_by_source(source_name: str) -> Dict[str, Any]:
    """
    Get results from a specific source
    
    Parameters:
    - source_name: "face", "audio", or "fusion_video_audio"
    
    Returns:
    {
        "source": str,
        "results": [
            {
                "id": int,
                "timestamp": str,
                "emotion": str,
                "confidence": float,
                "all_emotions": dict
            }
        ],
        "count": int
    }
    """
    try:
        valid_sources = ["face", "audio", "fusion_video_audio"]
        if source_name not in valid_sources:
            return JSONResponse(
                status_code=400,
                content={"detail": f"Invalid source. Must be one of: {', '.join(valid_sources)}"}
            )
        
        with engine.begin() as conn:
            stmt = select(results_table).where(
                results_table.c.source == source_name
            ).order_by(results_table.c.timestamp.desc())
            
            rows = conn.execute(stmt).fetchall()
            
            results = []
            for row in rows:
                try:
                    payload = json.loads(row.payload)
                    result_item = {
                        "id": row.id,
                        "timestamp": row.timestamp.isoformat() if row.timestamp else None,
                        "emotion": payload.get("emotion"),
                        "confidence": payload.get("confidence"),
                        "all_emotions": payload.get("all_emotions", {}),
                    }
                    results.append(result_item)
                except Exception as e:
                    logger.warning(f"Error parsing result row {row.id}: {e}")
                    continue
            
            return JSONResponse(content={
                "source": source_name,
                "results": results,
                "count": len(results)
            })
    except Exception as e:
        logger.error(f"Error fetching results for source {source_name}: {e}")
        return JSONResponse(
            status_code=500,
            content={"detail": str(e)}
        )


@router.get("/stats")
async def get_results_stats() -> Dict[str, Any]:
    """
    Get statistics about results
    
    Returns:
    {
        "total_count": int,
        "by_source": {
            "face": int,
            "audio": int,
            "fusion_video_audio": int
        },
        "by_emotion": {
            "happy": int,
            "sad": int,
            ...
        }
    }
    """
    try:
        with engine.begin() as conn:
            # Get total count
            total_stmt = select(func.count()).select_from(results_table)
            total_count = conn.execute(total_stmt).scalar() or 0
            
            # Get count by source
            source_stmt = select(
                results_table.c.source,
                func.count().label("count")
            ).group_by(results_table.c.source)
            source_results = conn.execute(source_stmt).fetchall()
            
            by_source = {}
            for source, count in source_results:
                by_source[source] = count
            
            # Get all results to compute emotion statistics
            all_stmt = select(results_table)
            all_rows = conn.execute(all_stmt).fetchall()
            
            by_emotion = {}
            for row in all_rows:
                try:
                    payload = json.loads(row.payload)
                    emotion = payload.get("emotion")
                    if emotion:
                        by_emotion[emotion] = by_emotion.get(emotion, 0) + 1
                except Exception as e:
                    logger.warning(f"Error parsing result row {row.id}: {e}")
                    continue
            
            return JSONResponse(content={
                "total_count": total_count,
                "by_source": by_source,
                "by_emotion": by_emotion
            })
    except Exception as e:
        logger.error(f"Error fetching results stats: {e}")
        return JSONResponse(
            status_code=500,
            content={"detail": str(e)}
        )
