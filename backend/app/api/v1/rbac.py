"""rbac.py — Role-Based Access Control management API endpoints (v1, admin only)."""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List
from sqlalchemy.orm import Session

from app.core.security import require_permission, get_current_user
from app.db.session import get_db
from app.models.permission import Permission, RolePermission
from app.models.user import User

router = APIRouter(prefix="/rbac", tags=["rbac", "admin"])


class UpdateRolePermissionsRequest(BaseModel):
    permission_codes: List[str]


@router.get("/permissions")
def list_permissions(
    db: Session = Depends(get_db),
    _=Depends(require_permission("users.view")),
):
    """List all available permissions."""
    perms = db.query(Permission).order_by(Permission.code).all()
    return [
        {"id": p.id, "code": p.code, "description": p.description}
        for p in perms
    ]


@router.get("/roles/{role}/permissions")
def get_role_permissions(
    role: str,
    db: Session = Depends(get_db),
    _=Depends(require_permission("users.view")),
):
    """Get permissions assigned to a specific role."""
    valid_roles = ("user", "cs", "analyst", "investigator", "moderator", "admin", "viewer")
    if role not in valid_roles:
        raise HTTPException(status_code=400, detail=f"Invalid role. Must be one of: {', '.join(valid_roles)}")

    role_perms = (
        db.query(Permission)
        .join(RolePermission)
        .filter(RolePermission.role == role)
        .order_by(Permission.code)
        .all()
    )
    return [
        {"id": p.id, "code": p.code, "description": p.description}
        for p in role_perms
    ]


@router.put("/roles/{role}/permissions")
def set_role_permissions(
    role: str,
    body: UpdateRolePermissionsRequest,
    db: Session = Depends(get_db),
    _=Depends(require_permission("users.update_role")),
):
    """Set permissions for a role (replaces existing assignments)."""
    valid_roles = ("user", "cs", "analyst", "investigator", "moderator", "admin", "viewer")
    if role not in valid_roles:
        raise HTTPException(status_code=400, detail=f"Invalid role. Must be one of: {', '.join(valid_roles)}")

    db.query(RolePermission).filter(RolePermission.role == role).delete()

    for code in body.permission_codes:
        perm = db.query(Permission).filter(Permission.code == code).first()
        if not perm:
            raise HTTPException(status_code=400, detail=f"Permission not found: {code}")
        db.add(RolePermission(role=role, permission_id=perm.id))

    db.commit()
    return {"status": "updated", "role": role, "permission_count": len(body.permission_codes)}


@router.get("/my-permissions")
def get_my_permissions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return the current user's effective permissions."""
    if current_user.role == "admin":
        perms = db.query(Permission).order_by(Permission.code).all()
        return {
            "role": current_user.role,
            "permissions": [p.code for p in perms],
        }

    role_perms = (
        db.query(Permission)
        .join(RolePermission)
        .filter(RolePermission.role == current_user.role)
        .order_by(Permission.code)
        .all()
    )
    return {
        "role": current_user.role,
        "permissions": [p.code for p in role_perms],
    }
