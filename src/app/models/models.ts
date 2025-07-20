export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  role?: 'user'; 
  phone?: string; 
}

export interface RegisterResponse {
  token?: string;
  role?: 'admin' | 'rescuer' | 'user'; 
  username?: string;
  email: string,
  password: string,
  message?: string; 
  status?: boolean; 
}
export interface User {
  username: string;
  role: 'admin' | 'rescuer' | 'user';
  token: string;
}

export  interface UserProfile{
  id: string;
  username: string;
  email: string;
  phone?: string;
  role: 'admin' | 'rescuer' | 'user';
  status?:'active' | 'inactive';
  createdAt: string;
  password?: string;
}

export interface UserState {
  isLoggedIn: boolean;
  role: 'admin' | 'rescuer' | 'user' | null;
  username?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  role: 'admin' | 'rescuer' | 'user';
  username: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ForgotPasswordResponse {
  message?: string; 
  status?: boolean; 
}

export interface Report {
  id: string;
  title: string;
  reporterName: string;
  phone: string;
  description: string;
  address: string;
  latitude: number;
  longitude: number;
  category: string;
  image?: string; 
  status?: 'reviewed' | 'rejected' | 'in_review' | null;
  isSentToRescuer: boolean;
  adminComments?: string;   
  assignedTo?: string; 
  createdAt: string;
  updatedAt?: string;
}



export interface Notification {
  id: string;
  userId: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}