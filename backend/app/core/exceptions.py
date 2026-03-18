class APIError(Exception):
    """Base class for API exceptions"""

    def __init__(self, message, status_code=400, payload=None):
        super().__init__()
        self.message = message
        self.status_code = status_code
        self.payload = payload

    def to_dict(self):
        rv = dict(self.payload or ())
        rv["error"] = self.message
        return rv


class ValidationError(APIError):
    def __init__(self, message, payload=None):
        super().__init__(message, status_code=400, payload=payload)


class AuthenticationError(APIError):
    def __init__(self, message="Invalid credentials", payload=None):
        super().__init__(message, status_code=401, payload=payload)


class ForbiddenError(APIError):
    def __init__(self, message="Permission denied", payload=None):
        super().__init__(message, status_code=403, payload=payload)


class NotFoundError(APIError):
    def __init__(self, message="Resource not found", payload=None):
        super().__init__(message, status_code=404, payload=payload)
