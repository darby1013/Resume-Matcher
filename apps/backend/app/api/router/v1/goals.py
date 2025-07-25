from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from typing import List

from app.core import get_async_session
from app.models import Goal
from app.schemas.pydantic import GoalCreate, GoalUpdate, GoalResponse, GoalList

router = APIRouter()

# For now, we'll use a hardcoded user_id. In a real app, this would come from authentication
DEMO_USER_ID = 1


@router.post("/", response_model=GoalResponse)
async def create_goal(
    goal_data: GoalCreate,
    db: AsyncSession = Depends(get_async_session)
):
    """Create a new goal"""
    try:
        db_goal = Goal(
            user_id=DEMO_USER_ID,
            title=goal_data.title,
            description=goal_data.description,
            category=goal_data.category,
            target_date=goal_data.target_date,
            is_recurring=goal_data.is_recurring,
            detected_from_journal=False
        )
        
        db.add(db_goal)
        await db.commit()
        await db.refresh(db_goal)
        
        return GoalResponse.model_validate(db_goal)
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/", response_model=GoalList)
async def get_goals(
    db: AsyncSession = Depends(get_async_session)
):
    """Get all goals for the user"""
    try:
        result = await db.execute(
            select(Goal).where(Goal.user_id == DEMO_USER_ID)
            .order_by(Goal.created_at.desc())
        )
        goals = result.scalars().all()
        
        return GoalList(
            goals=[GoalResponse.model_validate(goal) for goal in goals],
            total=len(goals)
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{goal_id}", response_model=GoalResponse)
async def get_goal(
    goal_id: int,
    db: AsyncSession = Depends(get_async_session)
):
    """Get a specific goal"""
    try:
        result = await db.execute(
            select(Goal).where(
                and_(Goal.id == goal_id, Goal.user_id == DEMO_USER_ID)
            )
        )
        goal = result.scalar_one_or_none()
        
        if not goal:
            raise HTTPException(status_code=404, detail="Goal not found")
            
        return GoalResponse.model_validate(goal)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{goal_id}", response_model=GoalResponse)
async def update_goal(
    goal_id: int,
    goal_data: GoalUpdate,
    db: AsyncSession = Depends(get_async_session)
):
    """Update a goal"""
    try:
        result = await db.execute(
            select(Goal).where(
                and_(Goal.id == goal_id, Goal.user_id == DEMO_USER_ID)
            )
        )
        goal = result.scalar_one_or_none()
        
        if not goal:
            raise HTTPException(status_code=404, detail="Goal not found")
        
        # Update fields
        update_data = goal_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(goal, field, value)
        
        await db.commit()
        await db.refresh(goal)
        
        return GoalResponse.model_validate(goal)
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{goal_id}")
async def delete_goal(
    goal_id: int,
    db: AsyncSession = Depends(get_async_session)
):
    """Delete a goal"""
    try:
        result = await db.execute(
            select(Goal).where(
                and_(Goal.id == goal_id, Goal.user_id == DEMO_USER_ID)
            )
        )
        goal = result.scalar_one_or_none()
        
        if not goal:
            raise HTTPException(status_code=404, detail="Goal not found")
        
        await db.delete(goal)
        await db.commit()
        
        return {"message": "Goal deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))