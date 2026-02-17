const ADMIN_KEY = 'flamekitchen_admin';
const ADMIN_PASSWORD = 'admin123'; // Demo only — NOT secure for production

export function isAdminAuthenticated(): boolean {
  return sessionStorage.getItem(ADMIN_KEY) === 'true';
}

export function adminLogin(password: string): boolean {
  if (password === ADMIN_PASSWORD) {
    sessionStorage.setItem(ADMIN_KEY, 'true');
    return true;
  }
  return false;
}

export function adminLogout() {
  sessionStorage.removeItem(ADMIN_KEY);
}
