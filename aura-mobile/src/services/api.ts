export const API_BASE_URL = 'http://localhost:3000/v1';

// --- AUTHENTICATION APIS ---
export const API_SEND_OTP = `${API_BASE_URL}/auth/send-otp`;
export const API_VERIFY_OTP = `${API_BASE_URL}/auth/verify-otp`;
export const API_REGISTER_USER = `${API_BASE_URL}/auth/register`;
export const API_LOGIN = `${API_BASE_URL}/auth/login`;

// --- JOBS (Admin Jobs) APIS ---
export const API_GET_ADMIN_JOBS = `${API_BASE_URL}/jobs/admin`;

// --- MY JOBS APIS ---
export const API_GET_MY_JOBS = `${API_BASE_URL}/jobs/me`;

// --- ADOC APIS ---
export const API_GET_USER_ADOC = `${API_BASE_URL}/adoc/me`;
export const API_UPLOAD_ADOC = `${API_BASE_URL}/adoc/upload`;

// --- SCANNER APIS ---
export const API_VERIFY_QR_CODE = `${API_BASE_URL}/scanner/verify`;

// --- PROFILE APIS ---
export const API_GET_PROFILE = `${API_BASE_URL}/profile/me`;
export const API_UPDATE_PROFILE = `${API_BASE_URL}/profile/update`;

// Real fetch API call
export const apiCall = async (endpoint: string, method = 'GET', body?: any) => {
  try {
    const response = await fetch(endpoint, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    return { success: false, error };
  }
};
