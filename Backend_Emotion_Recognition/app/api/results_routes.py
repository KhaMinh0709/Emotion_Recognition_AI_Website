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
    """
    try:
        with engine.begin() as conn:
            stmt = select(results_table).where(results_table.c.trash == 0).order_by(results_table.c.timestamp.desc())
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
                        "trash": row.trash,
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
        return JSONResponse(status_code=500, content={"detail": str(e)})
@router.post("/set_trash/{result_id}")
async def set_result_trash(result_id: int) -> Dict[str, Any]:
    """
    Đánh dấu một result là trash (xóa mềm)
    """
    try:
        with engine.begin() as conn:
            stmt = results_table.update().where(results_table.c.id == result_id).values(trash=1)
            conn.execute(stmt)
        return {"success": True, "id": result_id}
    except Exception as e:
        logger.error(f"Error setting trash for result {result_id}: {e}")
        return {"success": False, "detail": str(e)}

@router.get("/trash")
async def get_trash_results() -> Dict[str, Any]:
    """
    Lấy các result đã bị đánh dấu trash
    """
    try:
        with engine.begin() as conn:
            stmt = select(results_table).where(results_table.c.trash == 1).order_by(results_table.c.timestamp.desc())
            rows = conn.execute(stmt).fetchall()
            trash_results = []
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
                        "trash": row.trash,
                    }
                    trash_results.append(result_item)
                except Exception as e:
                    logger.warning(f"Error parsing trash result row {row.id}: {e}")
                    continue
            return JSONResponse(content={"trash_results": trash_results, "count": len(trash_results)})
    except Exception as e:
        logger.error(f"Error fetching trash results: {e}")
        return JSONResponse(content={"detail": str(e)})

@router.get("/by-date")
async def get_results_by_date(date_str: str = Query(...)):
    try:
        target_date = datetime.strptime(date_str, "%Y-%m-%d").date()
        from sqlalchemy import cast, Date
        
        with engine.begin() as conn:
            stmt = select(results_table).where(
                cast(results_table.c.timestamp, Date) == target_date,
                results_table.c.trash == 0  # ← FIX 1: chỉ lấy trash=0
            ).order_by(results_table.c.timestamp.desc())

            rows = conn.execute(stmt).fetchall()

            results = []
            source_counts = {"face": 0, "audio": 0, "fusion_video_audio": 0}

            for row in rows:
                payload = json.loads(row.payload)
                result_item = {
                    "id": row.id,
                    "source": row.source,
                    "timestamp": row.timestamp.isoformat() if row.timestamp else None,
                    "emotion": payload.get("emotion"),
                    "confidence": payload.get("confidence"),
                    "all_emotions": payload.get("all_emotions", {}),
                    "trash": row.trash  # ← FIX 2: trả về trash
                }
                results.append(result_item)

                if row.source in source_counts:
                    source_counts[row.source] += 1

            return JSONResponse(content={
                "date": date_str,
                "results": results,
                "count": len(results),
                "sources": source_counts
            })

    except Exception as e:
        logger.error(f"Error fetching results for date {date_str}: {e}")
        return JSONResponse(status_code=500, content={"detail": str(e)})


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
@router.post("/restore/{result_id}")
async def restore_result(result_id: int):
    try:
        with engine.begin() as conn:
            stmt = results_table.update().where(
                results_table.c.id == result_id
            ).values(trash=0)
            conn.execute(stmt)
        return {"success": True, "id": result_id}
    except Exception as e:
        logger.error(f"Error restoring result {result_id}: {e}")
        return {"success": False, "detail": str(e)}

@router.delete("/delete/{result_id}")
async def delete_result_permanently(result_id: int):
    try:
        with engine.begin() as conn:
            stmt = results_table.delete().where(
                results_table.c.id == result_id
            )
            conn.execute(stmt)
        return {"success": True, "id": result_id}
    except Exception as e:
        logger.error(f"Error deleting result {result_id}: {e}")
        return {"success": False, "detail": str(e)}
@router.delete("/trash/empty")
async def empty_trash():
    try:
        with engine.begin() as conn:
            stmt = results_table.delete().where(
                results_table.c.trash == 1
            )
            conn.execute(stmt)
        return {"success": True}
    except Exception as e:
        logger.error(f"Error emptying trash: {e}")
        return {"success": False, "detail": str(e)}


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
