import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth, validatePassword, validatePhone } from "@/contexts/AuthContext";
import { Eye, EyeOff, Phone, Lock, User, KeyRound, MessageSquare, Shield } from "lucide-react";
import { toast } from "sonner";

export function AuthModal() {
  const { showAuthModal, authModalTab, closeAuthModal, openAuthModal, loginByPassword, loginBySMS, register, sendSMS, verifySMSCode, resetPassword } = useAuth();

  return (
    <Dialog open={showAuthModal} onOpenChange={(open) => { if (!open) closeAuthModal(); }}>
      <DialogContent className="sm:max-w-[420px] p-0 overflow-hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>
            {authModalTab === "login" ? "登录" : authModalTab === "register" ? "注册" : "找回密码"}
          </DialogTitle>
          <DialogDescription>可信数据平台账号认证</DialogDescription>
        </DialogHeader>
        {authModalTab === "login" && <LoginForm />}
        {authModalTab === "register" && <RegisterForm />}
        {authModalTab === "forgot" && <ForgotForm />}
      </DialogContent>
    </Dialog>
  );
}

function LoginForm() {
  const { loginByPassword, loginBySMS, sendSMS, openAuthModal } = useAuth();
  const [mode, setMode] = useState<"password" | "sms">("password");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [phone, setPhone] = useState("");
  const [smsCode, setSmsCode] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const handleSendSMS = () => {
    const res = sendSMS(phone);
    if (!res.ok) { setError(res.error!); return; }
    setCountdown(60);
    toast.success(`验证码已发送: ${res.code}`, { description: "（演示环境直接展示验证码）" });
  };

  const handleLogin = () => {
    setError("");
    if (mode === "password") {
      if (!username.trim() || !password.trim()) { setError("请输入账号和密码"); return; }
      const res = loginByPassword(username, password);
      if (!res.ok) setError(res.error!);
      else toast.success("登录成功");
    } else {
      if (!phone.trim() || !smsCode.trim()) { setError("请输入手机号和验证码"); return; }
      const res = loginBySMS(phone, smsCode);
      if (!res.ok) setError(res.error!);
      else toast.success("登录成功");
    }
  };

  return (
    <div className="p-6">
      <div className="text-center mb-6">
        <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center mx-auto mb-3">
          <span className="text-primary-foreground font-bold text-lg">可</span>
        </div>
        <h2 className="text-xl font-semibold text-foreground">登录可信数据平台</h2>
        <p className="text-sm text-muted-foreground mt-1">请使用您的账号登录</p>
      </div>

      {/* Mode tabs */}
      <div className="flex bg-muted rounded-lg p-1 mb-5">
        <button
          onClick={() => { setMode("password"); setError(""); }}
          className={`flex-1 py-2 text-sm rounded-md transition-colors ${mode === "password" ? "bg-card shadow-sm font-medium text-foreground" : "text-muted-foreground"}`}
        >
          账号密码
        </button>
        <button
          onClick={() => { setMode("sms"); setError(""); }}
          className={`flex-1 py-2 text-sm rounded-md transition-colors ${mode === "sms" ? "bg-card shadow-sm font-medium text-foreground" : "text-muted-foreground"}`}
        >
          短信验证码
        </button>
      </div>

      {error && <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>}

      {mode === "password" ? (
        <div className="space-y-4">
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="账号 / 手机号" value={username} onChange={e => setUsername(e.target.value)} className="pl-10" onKeyDown={e => e.key === "Enter" && handleLogin()} />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input type={showPw ? "text" : "password"} placeholder="密码" value={password} onChange={e => setPassword(e.target.value)} className="pl-10 pr-10" onKeyDown={e => e.key === "Enter" && handleLogin()} />
            <button onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="手机号" value={phone} onChange={e => setPhone(e.target.value)} className="pl-10" maxLength={11} />
          </div>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="验证码" value={smsCode} onChange={e => setSmsCode(e.target.value)} className="pl-10" maxLength={6} onKeyDown={e => e.key === "Enter" && handleLogin()} />
            </div>
            <Button variant="outline" disabled={countdown > 0 || !validatePhone(phone)} onClick={handleSendSMS} className="shrink-0 w-28">
              {countdown > 0 ? `${countdown}s` : "获取验证码"}
            </Button>
          </div>
        </div>
      )}

      <Button className="w-full mt-5" onClick={handleLogin}>登 录</Button>

      <div className="flex items-center justify-between mt-4 text-sm">
        <button onClick={() => openAuthModal("forgot")} className="text-primary hover:underline">忘记密码？</button>
        <button onClick={() => openAuthModal("register")} className="text-primary hover:underline">注册新账号</button>
      </div>

      <div className="mt-5 pt-4 border-t">
        <p className="text-xs text-muted-foreground text-center">
          演示账号：admin / Admin123！
        </p>
      </div>
    </div>
  );
}

function RegisterForm() {
  const { register, sendSMS, verifySMSCode, openAuthModal } = useAuth();
  const [phone, setPhone] = useState("");
  const [smsCode, setSmsCode] = useState("");
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const handleSendSMS = () => {
    const res = sendSMS(phone);
    if (!res.ok) { setError(res.error!); return; }
    setCountdown(60);
    toast.success(`验证码已发送: ${res.code}`, { description: "（演示环境直接展示验证码）" });
  };

  const handleVerifyPhone = () => {
    if (verifySMSCode(phone, smsCode)) {
      setPhoneVerified(true);
      setError("");
      toast.success("手机号验证成功");
    } else {
      setError("验证码无效或已过期");
    }
  };

  const handleRegister = () => {
    setError("");
    if (!phoneVerified) { setError("请先验证手机号"); return; }
    if (!name.trim()) { setError("请输入姓名"); return; }
    if (password !== password2) { setError("两次密码输入不一致"); return; }
    const pwErr = validatePassword(password);
    if (pwErr) { setError(pwErr); return; }

    const res = register({ phone, name, password, inviteCode });
    if (!res.ok) setError(res.error!);
    else toast.success("注册成功，已自动登录");
  };

  return (
    <div className="p-6">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold text-foreground">注册新账号</h2>
        <p className="text-sm text-muted-foreground mt-1">请填写以下信息完成注册</p>
      </div>

      {error && <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>}

      <div className="space-y-4">
        {/* Phone verification */}
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="手机号" value={phone} onChange={e => { setPhone(e.target.value); setPhoneVerified(false); }} className="pl-10" maxLength={11} disabled={phoneVerified} />
          {phoneVerified && <Shield className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />}
        </div>

        {!phoneVerified && (
          <div className="flex gap-2">
            <div className="relative flex-1">
              <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="验证码" value={smsCode} onChange={e => setSmsCode(e.target.value)} className="pl-10" maxLength={6} />
            </div>
            <Button variant="outline" disabled={countdown > 0 || !validatePhone(phone)} onClick={handleSendSMS} className="shrink-0 w-28">
              {countdown > 0 ? `${countdown}s` : "获取验证码"}
            </Button>
          </div>
        )}

        {!phoneVerified && smsCode.length === 6 && (
          <Button variant="outline" className="w-full" onClick={handleVerifyPhone}>验证手机号</Button>
        )}

        {phoneVerified && (
          <>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="姓名" value={name} onChange={e => setName(e.target.value)} className="pl-10" />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input type={showPw ? "text" : "password"} placeholder="密码（8-20位，含大小写字母、数字、特殊字符）" value={password} onChange={e => setPassword(e.target.value)} className="pl-10 pr-10" />
              <button onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input type="password" placeholder="确认密码" value={password2} onChange={e => setPassword2(e.target.value)} className="pl-10" />
            </div>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="邀请码" value={inviteCode} onChange={e => setInviteCode(e.target.value)} className="pl-10" />
            </div>
            <Button className="w-full" onClick={handleRegister}>注 册</Button>
          </>
        )}
      </div>

      <div className="mt-4 text-center text-sm">
        <span className="text-muted-foreground">已有账号？</span>
        <button onClick={() => openAuthModal("login")} className="text-primary hover:underline ml-1">立即登录</button>
      </div>

      <p className="text-xs text-muted-foreground text-center mt-3">有效邀请码：INVITE2026 / DEMO / TEST</p>
    </div>
  );
}

function ForgotForm() {
  const { sendSMS, verifySMSCode, resetPassword, openAuthModal } = useAuth();
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1=phone, 2=reset pw, 3=done
  const [phone, setPhone] = useState("");
  const [smsCode, setSmsCode] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const handleSendSMS = () => {
    const res = sendSMS(phone);
    if (!res.ok) { setError(res.error!); return; }
    setCountdown(60);
    toast.success(`验证码已发送: ${res.code}`, { description: "（演示环境直接展示验证码）" });
  };

  const handleVerify = () => {
    setError("");
    if (!verifySMSCode(phone, smsCode)) { setError("验证码无效或已过期"); return; }
    setStep(2);
  };

  const handleReset = () => {
    setError("");
    if (password !== password2) { setError("两次密码输入不一致"); return; }
    const res = resetPassword(phone, password);
    if (!res.ok) { setError(res.error!); return; }
    setStep(3);
    toast.success("密码重置成功");
  };

  return (
    <div className="p-6">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold text-foreground">找回密码</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {step === 1 && "通过手机验证码验证身份"}
          {step === 2 && "设置新密码"}
          {step === 3 && "密码重置成功"}
        </p>
      </div>

      {/* Steps indicator */}
      <div className="flex items-center justify-center gap-2 mb-6">
        {[1, 2, 3].map(s => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium ${step >= s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
              {s}
            </div>
            {s < 3 && <div className={`w-8 h-0.5 ${step > s ? "bg-primary" : "bg-muted"}`} />}
          </div>
        ))}
      </div>

      {error && <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>}

      {step === 1 && (
        <div className="space-y-4">
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="注册手机号" value={phone} onChange={e => setPhone(e.target.value)} className="pl-10" maxLength={11} />
          </div>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="验证码" value={smsCode} onChange={e => setSmsCode(e.target.value)} className="pl-10" maxLength={6} />
            </div>
            <Button variant="outline" disabled={countdown > 0 || !validatePhone(phone)} onClick={handleSendSMS} className="shrink-0 w-28">
              {countdown > 0 ? `${countdown}s` : "获取验证码"}
            </Button>
          </div>
          <Button className="w-full" onClick={handleVerify}>验证身份</Button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input type={showPw ? "text" : "password"} placeholder="新密码（8-20位，含大小写字母、数字、特殊字符）" value={password} onChange={e => setPassword(e.target.value)} className="pl-10 pr-10" />
            <button onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input type="password" placeholder="确认新密码" value={password2} onChange={e => setPassword2(e.target.value)} className="pl-10" />
          </div>
          <Button className="w-full" onClick={handleReset}>重置密码</Button>
        </div>
      )}

      {step === 3 && (
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
            <Shield className="w-8 h-8 text-green-600" />
          </div>
          <p className="text-foreground">密码已重置成功，请使用新密码登录</p>
          <Button className="w-full" onClick={() => openAuthModal("login")}>返回登录</Button>
        </div>
      )}

      {step < 3 && (
        <div className="mt-4 text-center">
          <button onClick={() => openAuthModal("login")} className="text-sm text-primary hover:underline">返回登录</button>
        </div>
      )}
    </div>
  );
}
