// Shared validation utilities for frontend components

export const validateEmail = (email) => {
  if (!email.trim()) {
    return 'Email is required.';
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return 'Invalid email format.';
  }
  return null;
};

export const validatePassword = (password, confirmPassword = null) => {
  if (!password) {
    return 'Password is required.';
  }
  if (password.length < 6) {
    return 'Password must be at least 6 characters.';
  }
  if (confirmPassword && password !== confirmPassword) {
    return 'Passwords do not match.';
  }
  return null;
};

export const validateRequired = (value, fieldName) => {
  if (!value || !value.trim()) {
    return `${fieldName} is required.`;
  }
  return null;
};

export const validateOrgCode = (orgCode) => {
  if (!orgCode.trim()) {
    return 'Organization code is required.';
  }
  if (!/^[A-Z0-9]{3,10}$/.test(orgCode.trim().toUpperCase())) {
    return 'Organization code must be 3-10 characters, letters and numbers only.';
  }
  return null;
};

export const validateName = (name) => {
  if (!name.trim()) {
    return 'Name is required.';
  }
  if (name.trim().length < 2) {
    return 'Name must be at least 2 characters.';
  }
  return null;
};

// Common validation patterns
export const validateLoginForm = (form) => {
  const errors = {};
  
  // Always validate email
  const emailError = validateEmail(form.email);
  if (emailError) errors.email = emailError;
  
  // Validate password for teacher and student roles
  if (form.role === 'teacher' || form.role === 'student') {
    const passwordError = validatePassword(form.password);
    if (passwordError) errors.password = passwordError;
  }
  
  // Validate org_code for organization role
  if (form.role === 'organization') {
    const orgCodeError = validateOrgCode(form.org_code);
    if (orgCodeError) errors.org_code = orgCodeError;
  }
  
  return errors;
};

export const validateRegistrationForm = (form, type = 'organization') => {
  const errors = {};
  
  if (type === 'organization') {
    const orgCodeError = validateOrgCode(form.org_code);
    if (orgCodeError) errors.org_code = orgCodeError;
    
    const nameError = validateRequired(form.name, 'Organization name');
    if (nameError) errors.name = nameError;
  } else if (type === 'teacher') {
    const nameError = validateName(form.name);
    if (nameError) errors.name = nameError;
    
    const emailError = validateEmail(form.email);
    if (emailError) errors.email = emailError;
    
    const passwordError = validatePassword(form.password, form.confirmPassword);
    if (passwordError) errors.password = passwordError;
    
    const orgCodeError = validateOrgCode(form.org_code);
    if (orgCodeError) errors.org_code = orgCodeError;
  }
  
  return errors;
}; 