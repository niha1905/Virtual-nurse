from datetime import datetime, timedelta
import jwt
import bcrypt
import re

class Auth:
    SECRET_KEY = 'your-secret-key-change-in-production-12345'  # Move to environment variable in production
    TOKEN_EXPIRY = timedelta(days=1)

    @staticmethod
    def hash_password(password):
        """Hash a password using bcrypt"""
        salt = bcrypt.gensalt()
        return bcrypt.hashpw(password.encode('utf-8'), salt)
    
    @staticmethod
    def verify_password(password, hashed):
        """Verify a password against its hash"""
        return bcrypt.checkpw(password.encode('utf-8'), hashed)
    
    @classmethod
    def generate_token(cls, user_id, role):
        """Generate a JWT token"""
        payload = {
            'user_id': user_id,
            'role': role,
            'exp': datetime.utcnow() + cls.TOKEN_EXPIRY
        }
        return jwt.encode(payload, cls.SECRET_KEY, algorithm='HS256')
    
    @classmethod
    def verify_token(cls, token):
        """Verify a JWT token"""
        try:
            payload = jwt.decode(token, cls.SECRET_KEY, algorithms=['HS256'])
            return payload
        except jwt.ExpiredSignatureError:
            return {'error': 'Token has expired'}
        except jwt.InvalidTokenError:
            return {'error': 'Invalid token'}
    
    @staticmethod
    def validate_password(password):
        """
        Validate password strength
        Must be at least 8 characters long and contain:
        - At least one uppercase letter
        - At least one lowercase letter
        - At least one number
        - At least one special character
        """
        if len(password) < 8:
            return False, "Password must be at least 8 characters long"
        
        if not re.search(r'[A-Z]', password):
            return False, "Password must contain at least one uppercase letter"
        
        if not re.search(r'[a-z]', password):
            return False, "Password must contain at least one lowercase letter"
        
        if not re.search(r'\d', password):
            return False, "Password must contain at least one number"
        
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
            return False, "Password must contain at least one special character"
        
        return True, "Password is valid"
    
    @staticmethod
    def validate_email(email):
        """Validate email format"""
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if re.match(pattern, email):
            return True
        return False