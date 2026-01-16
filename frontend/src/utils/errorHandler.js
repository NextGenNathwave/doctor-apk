// Production-friendly error handler
export const getErrorMessage = (error) => {
  // Don't log errors in production to avoid exposing sensitive information
  const isDevelopment = __DEV__ || false;
  
  if (isDevelopment) {
    console.error('Error details:', error);
  }
  
  // Handle different types of errors with user-friendly messages
  if (error.response && error.response.data && error.response.data.message) {
    return error.response.data.message;
  }
  
  // Handle specific HTTP status codes
  switch (error.response?.status) {
    case 400:
      return 'Invalid request. Please check your information.';
    case 401:
      return 'Invalid credentials. Please try again.';
    case 403:
      return 'Access denied. Please check your permissions.';
    case 404:
      return 'Resource not found. Please try again.';
    case 409:
      return 'This information already exists. Please use different details.';
    case 422:
      return 'Invalid data provided. Please check your input.';
    case 429:
      return 'Too many requests. Please wait and try again.';
    case 500:
    case 502:
    case 503:
    case 504:
      return 'Server error. Please try again later.';
    default:
      break;
  }
  
  // Handle network errors
  if (!error.response) {
    return 'Network error. Please check your connection.';
  }
  
  // Generic fallback message
  return 'Something went wrong. Please try again.';
};

// Specific error messages for different operations
export const getLoginErrorMessage = (error) => {
  if (error.response?.status === 401) {
    return 'Invalid email or password. Please try again.';
  }
  return getErrorMessage(error);
};

export const getRegistrationErrorMessage = (error) => {
  if (error.response?.status === 409) {
    return 'Email already exists. Please use a different email.';
  }
  return getErrorMessage(error);
};

export const getProfileUpdateErrorMessage = (error) => {
  if (error.response?.status === 400) {
    return 'Invalid profile data. Please check your information.';
  }
  return getErrorMessage(error);
};

export const getPasswordResetErrorMessage = (error) => {
  if (error.response?.status === 404) {
    return 'Email not found. Please check your email address.';
  }
  return getErrorMessage(error);
};
