# Wrapper for the new modular gemini service to maintain backward compatibility
from .gemini.service import GeminiEducationService

__all__ = ["GeminiEducationService"]
