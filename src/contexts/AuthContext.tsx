import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";

export interface AuthUser {
  username: string;
  name: string;
  phone: string;
  role: string;
}

// Demo accounts
const DEMO_ACCOUNTS: Array<{ username: string; password: string; phone: string; name: string; role: string }> = [
  { username: "admin", password: "Admin123!", phone: "13800000000", name: "超级管理员", role: "超级管理员" },
];

// Registered users storage key
const REGISTERED_USERS_KEY = "tdp_registered_users";
// SMS codes storage
const SMS_CODES_KEY = "tdp_sms_codes";
const SMS_DAILY_COUNT_KEY = "tdp_sms_daily";

const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

interface SMSRecord {
  phone: string;
  code: string;
  expiry: number;
  lastSent: number;
}

interface DailyCount {
  phone: string;
  date: string;
  count: number;
}

function getRegisteredUsers() {
  try {
    return JSON.parse(localStorage.getItem(REGISTERED_USERS_KEY) || "[]");
  } catch { return []; }
}

function saveRegisteredUsers(users: any[]) {
  localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(users));
}

// Password complexity: 8-20 chars, upper+lower+digit+special
export function validatePassword(pw: string): string | null {
  if (pw.length < 8 || pw.length > 20) return "密码长度需为8-20位";
  if (!/[A-Z]/.test(pw)) return "密码需包含大写字母";
  if (!/[a-z]/.test(pw)) return "密码需包含小写字母";
  if (!/[0-9]/.test(pw)) return "密码需包含数字";
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?！]/.test(pw)) return "密码需包含特殊字符";
  return null;
}

export function validatePhone(phone: string): boolean {
  return /^1[3-9]\d{9}$/.test(phone);
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  showAuthModal: boolean;
  authModalTab: "login" | "register" | "forgot";
  openAuthModal: (tab?: "login" | "register" | "forgot") => void;
  closeAuthModal: () => void;
  loginByPassword: (username: string, password: string) => { ok: boolean; error?: string };
  loginBySMS: (phone: string, code: string) => { ok: boolean; error?: string };
  register: (data: { phone: string; name: string; password: string; inviteCode: string }) => { ok: boolean; error?: string };
  sendSMS: (phone: string) => { ok: boolean; error?: string; code?: string };
  verifySMSCode: (phone: string, code: string) => boolean;
  resetPassword: (phone: string, newPassword: string) => { ok: boolean; error?: string };
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>(null!);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const s = sessionStorage.getItem("tdp_session");
      if (s) {
        const parsed = JSON.parse(s);
        if (parsed.expiry > Date.now()) return parsed.user;
        sessionStorage.removeItem("tdp_session");
      }
    } catch {}
    return null;
  });

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<"login" | "register" | "forgot">("login");
  const activityRef = useRef(Date.now());
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  // Session timeout check
  useEffect(() => {
    if (!user) return;

    const onActivity = () => { activityRef.current = Date.now(); };
    window.addEventListener("mousemove", onActivity);
    window.addEventListener("keydown", onActivity);
    window.addEventListener("click", onActivity);

    timerRef.current = setInterval(() => {
      if (Date.now() - activityRef.current > SESSION_TIMEOUT) {
        setUser(null);
        sessionStorage.removeItem("tdp_session");
        setAuthModalTab("login");
        setShowAuthModal(true);
      }
    }, 10000);

    return () => {
      window.removeEventListener("mousemove", onActivity);
      window.removeEventListener("keydown", onActivity);
      window.removeEventListener("click", onActivity);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [user]);

  const persistSession = (u: AuthUser) => {
    sessionStorage.setItem("tdp_session", JSON.stringify({ user: u, expiry: Date.now() + SESSION_TIMEOUT }));
  };

  const openAuthModal = useCallback((tab: "login" | "register" | "forgot" = "login") => {
    setAuthModalTab(tab);
    setShowAuthModal(true);
  }, []);

  const closeAuthModal = useCallback(() => setShowAuthModal(false), []);

  const findAccount = (username: string) => {
    const demo = DEMO_ACCOUNTS.find(a => a.username === username || a.phone === username);
    if (demo) return demo;
    const users = getRegisteredUsers();
    return users.find((u: any) => u.username === username || u.phone === username);
  };

  const loginByPassword = (username: string, password: string) => {
    const account = findAccount(username);
    if (!account) return { ok: false, error: "账号不存在" };
    if (account.password !== password) return { ok: false, error: "密码错误" };
    const u: AuthUser = { username: account.username, name: account.name, phone: account.phone, role: account.role };
    setUser(u);
    persistSession(u);
    setShowAuthModal(false);
    return { ok: true };
  };

  const sendSMS = (phone: string) => {
    if (!validatePhone(phone)) return { ok: false, error: "手机号格式不正确" };

    // Rate limiting
    const now = Date.now();
    const today = new Date().toDateString();
    
    try {
      const codes: SMSRecord[] = JSON.parse(localStorage.getItem(SMS_CODES_KEY) || "[]");
      const existing = codes.find(c => c.phone === phone);
      if (existing && now - existing.lastSent < 60000) {
        return { ok: false, error: "请60秒后再发送" };
      }

      const daily: DailyCount[] = JSON.parse(localStorage.getItem(SMS_DAILY_COUNT_KEY) || "[]");
      const dc = daily.find(d => d.phone === phone && d.date === today);
      if (dc && dc.count >= 10) {
        return { ok: false, error: "今日发送次数已达上限" };
      }

      // Generate code
      const code = String(Math.floor(100000 + Math.random() * 900000));
      const newRecord: SMSRecord = { phone, code, expiry: now + 5 * 60 * 1000, lastSent: now };
      
      const filtered = codes.filter(c => c.phone !== phone);
      filtered.push(newRecord);
      localStorage.setItem(SMS_CODES_KEY, JSON.stringify(filtered));

      // Update daily count
      const filteredDaily = daily.filter(d => !(d.phone === phone && d.date === today));
      filteredDaily.push({ phone, date: today, count: (dc?.count || 0) + 1 });
      localStorage.setItem(SMS_DAILY_COUNT_KEY, JSON.stringify(filteredDaily));

      return { ok: true, code }; // Return code for demo display
    } catch {
      return { ok: false, error: "发送失败" };
    }
  };

  const verifySMSCode = (phone: string, code: string) => {
    try {
      const codes: SMSRecord[] = JSON.parse(localStorage.getItem(SMS_CODES_KEY) || "[]");
      const record = codes.find(c => c.phone === phone);
      if (!record) return false;
      if (Date.now() > record.expiry) return false;
      return record.code === code;
    } catch { return false; }
  };

  const loginBySMS = (phone: string, code: string) => {
    if (!verifySMSCode(phone, code)) return { ok: false, error: "验证码无效或已过期" };
    const account = findAccount(phone);
    if (!account) return { ok: false, error: "该手机号未注册" };
    const u: AuthUser = { username: account.username, name: account.name, phone: account.phone, role: account.role };
    setUser(u);
    persistSession(u);
    setShowAuthModal(false);
    return { ok: true };
  };

  const register = (data: { phone: string; name: string; password: string; inviteCode: string }) => {
    if (!validatePhone(data.phone)) return { ok: false, error: "手机号格式不正确" };
    const pwErr = validatePassword(data.password);
    if (pwErr) return { ok: false, error: pwErr };
    if (!data.inviteCode.trim()) return { ok: false, error: "请输入邀请码" };
    // Mock invite code validation
    if (!["INVITE2026", "DEMO", "TEST"].includes(data.inviteCode.toUpperCase())) {
      return { ok: false, error: "邀请码无效" };
    }

    const users = getRegisteredUsers();
    if (users.find((u: any) => u.phone === data.phone)) {
      return { ok: false, error: "该手机号已注册" };
    }

    const newUser = {
      username: data.phone,
      phone: data.phone,
      name: data.name,
      password: data.password,
      role: "普通用户",
    };
    users.push(newUser);
    saveRegisteredUsers(users);

    // Auto login
    const u: AuthUser = { username: newUser.username, name: newUser.name, phone: newUser.phone, role: newUser.role };
    setUser(u);
    persistSession(u);
    setShowAuthModal(false);
    return { ok: true };
  };

  const resetPassword = (phone: string, newPassword: string) => {
    const pwErr = validatePassword(newPassword);
    if (pwErr) return { ok: false, error: pwErr };

    // Check demo accounts (can't reset demo)
    const demo = DEMO_ACCOUNTS.find(a => a.phone === phone);
    if (demo) return { ok: false, error: "演示账号不支持重置密码" };

    const users = getRegisteredUsers();
    const idx = users.findIndex((u: any) => u.phone === phone);
    if (idx === -1) return { ok: false, error: "该手机号未注册" };

    users[idx].password = newPassword;
    saveRegisteredUsers(users);
    return { ok: true };
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem("tdp_session");
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      showAuthModal,
      authModalTab,
      openAuthModal,
      closeAuthModal,
      loginByPassword,
      loginBySMS,
      register,
      sendSMS,
      verifySMSCode,
      resetPassword,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
