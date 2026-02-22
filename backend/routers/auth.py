from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from backend.auth import verify_pin, create_access_token

router = APIRouter(prefix="/auth", tags=["auth"])


class LoginRequest(BaseModel):
    pin: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str


@router.post("/login", response_model=LoginResponse)
def login(body: LoginRequest):
    if not verify_pin(body.pin):
        raise HTTPException(status_code=401, detail="PIN incorrecto")
    token = create_access_token()
    return LoginResponse(access_token=token, token_type="bearer")
