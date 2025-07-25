from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core import get_async_session
from app.services.journal_service import JournalService
from app.schemas.pydantic import (
    JournalEntryCreate,
    JournalEntryUpdate,
    JournalEntryResponse,
    JournalEntryList
)

router = APIRouter()
journal_service = JournalService()

# For now, we'll use a hardcoded user_id. In a real app, this would come from authentication
DEMO_USER_ID = 1


@router.post("/entries", response_model=Dict[str, Any])
async def create_journal_entry(
    entry_data: JournalEntryCreate,
    db: AsyncSession = Depends(get_async_session)
):
    """Create a new journal entry with AI analysis"""
    try:
        entry, analysis = await journal_service.create_journal_entry(
            db=db,
            user_id=DEMO_USER_ID,
            journal_data=entry_data
        )
        
        return {
            "entry": entry,
            "analysis": analysis,
            "message": "Journal entry created successfully"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/entries", response_model=JournalEntryList)
async def get_journal_entries(
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(20, ge=1, le=100, description="Items per page"),
    search: str = Query(None, description="Search term"),
    db: AsyncSession = Depends(get_async_session)
):
    """Get paginated journal entries"""
    try:
        return await journal_service.get_journal_entries(
            db=db,
            user_id=DEMO_USER_ID,
            page=page,
            per_page=per_page,
            search=search
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/entries/{entry_id}", response_model=JournalEntryResponse)
async def get_journal_entry(
    entry_id: int,
    db: AsyncSession = Depends(get_async_session)
):
    """Get a specific journal entry"""
    try:
        entry = await journal_service.get_journal_entry(
            db=db,
            user_id=DEMO_USER_ID,
            entry_id=entry_id
        )
        
        if not entry:
            raise HTTPException(status_code=404, detail="Journal entry not found")
            
        return entry
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/entries/{entry_id}", response_model=JournalEntryResponse)
async def update_journal_entry(
    entry_id: int,
    update_data: JournalEntryUpdate,
    db: AsyncSession = Depends(get_async_session)
):
    """Update a journal entry"""
    try:
        entry = await journal_service.update_journal_entry(
            db=db,
            user_id=DEMO_USER_ID,
            entry_id=entry_id,
            update_data=update_data
        )
        
        if not entry:
            raise HTTPException(status_code=404, detail="Journal entry not found")
            
        return entry
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/entries/{entry_id}")
async def delete_journal_entry(
    entry_id: int,
    db: AsyncSession = Depends(get_async_session)
):
    """Delete a journal entry"""
    try:
        success = await journal_service.delete_journal_entry(
            db=db,
            user_id=DEMO_USER_ID,
            entry_id=entry_id
        )
        
        if not success:
            raise HTTPException(status_code=404, detail="Journal entry not found")
            
        return {"message": "Journal entry deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/summary/weekly")
async def get_weekly_summary(
    db: AsyncSession = Depends(get_async_session)
):
    """Get weekly summary of journal entries"""
    try:
        summary = await journal_service.generate_weekly_summary(
            db=db,
            user_id=DEMO_USER_ID
        )
        return summary
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))