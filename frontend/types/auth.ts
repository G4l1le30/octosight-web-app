export interface AuthUser {
  id: string;
  full_name: string;
  email: string;
  role: "user" | "admin";
}

export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  full_name: string;
  email: string;
  password: string;
  confirm_password: string;
}
