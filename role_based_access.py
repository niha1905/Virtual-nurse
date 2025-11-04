"""
============================================
ROLE-BASED ACCESS CONTROL MODULE
============================================
Manages access permissions for different user roles
"""

from typing import Dict, List, Optional, Set
from enum import Enum

class UserRole(Enum):
    """User role enumeration"""
    PATIENT = "patient"
    DOCTOR = "doctor"
    CARETAKER = "caretaker"
    ADMIN = "admin"

class Permission:
    """Permission flags"""
    VIEW_OWN_VITALS = "view_own_vitals"
    VIEW_OWN_REMINDERS = "view_own_reminders"
    VIEW_OWN_ALERTS = "view_own_alerts"
    VIEW_OWN_SUMMARY = "view_own_summary"
    
    VIEW_PATIENT_VITALS = "view_patient_vitals"
    VIEW_PATIENT_REMINDERS = "view_patient_reminders"
    VIEW_PATIENT_ALERTS = "view_patient_alerts"
    VIEW_PATIENT_SUMMARY = "view_patient_summary"
    VIEW_PATIENT_HISTORY = "view_patient_history"
    
    VIEW_ALL_PATIENTS = "view_all_patients"
    VIEW_ALL_ALERTS = "view_all_alerts"
    VIEW_ANALYTICS = "view_analytics"
    
    CREATE_REMINDERS = "create_reminders"
    UPDATE_REMINDERS = "update_reminders"
    ACKNOWLEDGE_ALERTS = "acknowledge_alerts"
    ESCALATE_ALERTS = "escalate_alerts"
    
    MANAGE_PATIENTS = "manage_patients"
    MANAGE_USERS = "manage_users"

class RoleBasedAccessControl:
    """
    Manages role-based access control
    """
    
    def __init__(self):
        # Define role permissions
        self.role_permissions = {
            UserRole.PATIENT: {
                Permission.VIEW_OWN_VITALS,
                Permission.VIEW_OWN_REMINDERS,
                Permission.VIEW_OWN_ALERTS,
                Permission.VIEW_OWN_SUMMARY,
            },
            UserRole.CARETAKER: {
                Permission.VIEW_OWN_VITALS,
                Permission.VIEW_OWN_REMINDERS,
                Permission.VIEW_OWN_ALERTS,
                Permission.VIEW_OWN_SUMMARY,
                Permission.VIEW_PATIENT_VITALS,
                Permission.VIEW_PATIENT_REMINDERS,
                Permission.VIEW_PATIENT_ALERTS,
                Permission.VIEW_PATIENT_SUMMARY,
                Permission.CREATE_REMINDERS,
                Permission.UPDATE_REMINDERS,
                Permission.ACKNOWLEDGE_ALERTS,
            },
            UserRole.DOCTOR: {
                Permission.VIEW_OWN_VITALS,
                Permission.VIEW_OWN_REMINDERS,
                Permission.VIEW_OWN_ALERTS,
                Permission.VIEW_OWN_SUMMARY,
                Permission.VIEW_PATIENT_VITALS,
                Permission.VIEW_PATIENT_REMINDERS,
                Permission.VIEW_PATIENT_ALERTS,
                Permission.VIEW_PATIENT_SUMMARY,
                Permission.VIEW_PATIENT_HISTORY,
                Permission.VIEW_ALL_PATIENTS,
                Permission.VIEW_ALL_ALERTS,
                Permission.VIEW_ANALYTICS,
                Permission.ACKNOWLEDGE_ALERTS,
                Permission.ESCALATE_ALERTS,
            },
            UserRole.ADMIN: {
                # Admins have all permissions
                *list(Permission.__dict__.values())
            }
        }
        
        # User assignments (user_id -> role)
        self.user_roles = {}
        # Patient assignments (caretaker_id -> [patient_ids])
        self.caretaker_patients = {}
        # Doctor assignments (doctor_id -> [patient_ids])
        self.doctor_patients = {}
    
    def assign_role(self, user_id: str, role: UserRole):
        """Assign a role to a user"""
        self.user_roles[user_id] = role
    
    def get_user_role(self, user_id: str) -> Optional[UserRole]:
        """Get user's role"""
        return self.user_roles.get(user_id)
    
    def assign_patient_to_caretaker(self, caretaker_id: str, patient_id: str):
        """Assign a patient to a caretaker"""
        if caretaker_id not in self.caretaker_patients:
            self.caretaker_patients[caretaker_id] = []
        if patient_id not in self.caretaker_patients[caretaker_id]:
            self.caretaker_patients[caretaker_id].append(patient_id)
    
    def assign_patient_to_doctor(self, doctor_id: str, patient_id: str):
        """Assign a patient to a doctor"""
        if doctor_id not in self.doctor_patients:
            self.doctor_patients[doctor_id] = []
        if patient_id not in self.doctor_patients[doctor_id]:
            self.doctor_patients[doctor_id].append(patient_id)
    
    def has_permission(self, user_id: str, permission: Permission) -> bool:
        """Check if user has a specific permission"""
        role = self.get_user_role(user_id)
        if not role:
            return False
        
        return permission in self.role_permissions.get(role, set())
    
    def can_access_patient_data(self, user_id: str, patient_id: str, 
                               permission: Permission) -> bool:
        """
        Check if user can access specific patient's data
        
        Args:
            user_id: User requesting access
            patient_id: Patient whose data is being accessed
            permission: Type of permission needed
        
        Returns:
            True if access is allowed
        """
        role = self.get_user_role(user_id)
        if not role:
            return False
        
        # User can always access their own data
        if user_id == patient_id:
            return self.has_permission(user_id, permission)
        
        # Check role-specific access
        if role == UserRole.DOCTOR:
            # Doctors can access all patients or assigned patients
            if self.has_permission(user_id, Permission.VIEW_ALL_PATIENTS):
                return True
            return patient_id in self.doctor_patients.get(user_id, [])
        
        elif role == UserRole.CARETAKER:
            # Caretakers can access assigned patients
            return patient_id in self.caretaker_patients.get(user_id, [])
        
        elif role == UserRole.ADMIN:
            # Admins have full access
            return True
        
        return False
    
    def get_accessible_patients(self, user_id: str) -> List[str]:
        """
        Get list of patient IDs accessible to a user
        
        Returns:
            List of patient IDs
        """
        role = self.get_user_role(user_id)
        if not role:
            return []
        
        if role == UserRole.PATIENT:
            return [user_id]  # Only themselves
        
        elif role == UserRole.CARETAKER:
            return self.caretaker_patients.get(user_id, [])
        
        elif role == UserRole.DOCTOR:
            # Doctors can see assigned patients or all if they have permission
            if self.has_permission(user_id, Permission.VIEW_ALL_PATIENTS):
                return []  # All patients - return empty to indicate "all"
            return self.doctor_patients.get(user_id, [])
        
        elif role == UserRole.ADMIN:
            return []  # All patients
        
        return []
    
    def filter_data_by_role(self, user_id: str, data: Dict, patient_id: str) -> Dict:
        """
        Filter data based on user's role and permissions
        
        Args:
            user_id: User requesting data
            data: Full data dictionary
            patient_id: Patient whose data this is
        
        Returns:
            Filtered data dictionary
        """
        # If accessing own data, return full data (with permission check)
        if user_id == patient_id:
            if self.has_permission(user_id, Permission.VIEW_OWN_VITALS):
                return data
            return {}
        
        filtered_data = {}
        role = self.get_user_role(user_id)
        
        if role == UserRole.DOCTOR:
            # Doctors can see everything for their patients
            if self.can_access_patient_data(user_id, patient_id, Permission.VIEW_PATIENT_VITALS):
                filtered_data = data.copy()
        
        elif role == UserRole.CARETAKER:
            # Caretakers can see vitals, reminders, alerts, but not full history
            if self.can_access_patient_data(user_id, patient_id, Permission.VIEW_PATIENT_VITALS):
                filtered_data = {
                    'vitals': data.get('vitals', {}),
                    'reminders': data.get('reminders', []),
                    'alerts': data.get('alerts', []),
                    'summary': data.get('summary', {})
                }
        
        return filtered_data


# Global instance
rbac = RoleBasedAccessControl()

