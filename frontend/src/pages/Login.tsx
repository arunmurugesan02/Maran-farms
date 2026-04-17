import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Phone, KeyRound, User, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import logo from "@/images/logo.png";
import { BRAND_NAME } from "@/lib/brand";

const Login = () => {
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [otp, setOtp] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [expiresIn, setExpiresIn] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { requestOtp, verifyOtp, user, isAuthLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const fromPath = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;

  const sendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await requestOtp(phone);
      setIsOtpSent(true);
      setExpiresIn(response.expiresIn);

      toast({
        title: "OTP sent",
        description: response.otp ? `Demo OTP: ${response.otp}` : "Check your phone for OTP"
      });
    } catch (error) {
      toast({
        title: "Failed to send OTP",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const submitOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const loggedInUser = await verifyOtp(phone, otp, name || undefined);
      toast({ title: "Login successful" });
      const targetPath = loggedInUser.isAdmin
        ? (fromPath?.startsWith("/admin") ? fromPath : "/admin")
        : (fromPath && !fromPath.startsWith("/admin") ? fromPath : "/");
      navigate(targetPath, { replace: true });
    } catch (error) {
      toast({
        title: "OTP verification failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isAuthLoading) {
    return <div className="min-h-[75vh] flex items-center justify-center text-sm text-muted-foreground">Checking account...</div>;
  }

  if (user) {
    const targetPath = user.isAdmin
      ? (fromPath?.startsWith("/admin") ? fromPath : "/admin")
      : (fromPath && !fromPath.startsWith("/admin") ? fromPath : "/");
    return <Navigate to={targetPath} replace />;
  }

  return (
    <div className="min-h-[75vh] flex items-center justify-center py-12 px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="bg-card rounded-3xl border border-border/50 shadow-xl overflow-hidden">
          <div className="farm-gradient p-8 text-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-primary-foreground/30" />
              <div className="absolute bottom-0 left-0 w-40 h-40 rounded-full bg-primary-foreground/20" />
            </div>
            <div className="relative z-10">
              <div className="h-14 w-14 rounded-2xl bg-primary-foreground/20 flex items-center justify-center mx-auto mb-4">
                <img src={logo} alt={BRAND_NAME} className="h-12 w-12 rounded-full object-cover border border-primary-foreground/40" />
              </div>
              <h1 className="text-2xl font-display text-primary-foreground font-bold">Login with Phone</h1>
              <p className="text-sm text-primary-foreground/70 mt-1">Use OTP to continue to {BRAND_NAME}</p>
            </div>
          </div>

          <div className="p-8">
            <form onSubmit={isOtpSent ? submitOtp : sendOtp} className="space-y-4">
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="tel"
                  placeholder="+91 6380 261 643"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full border border-border rounded-xl pl-10 pr-4 py-3 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  required
                  disabled={isOtpSent}
                />
              </div>

              {isOtpSent && (
                <>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Your name (optional)"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full border border-border rounded-xl pl-10 pr-4 py-3 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>
                  <div className="relative">
                    <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="Enter 6-digit OTP"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                      className="w-full border border-border rounded-xl pl-10 pr-4 py-3 text-sm bg-background text-foreground tracking-[0.2em] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      required
                    />
                  </div>
                </>
              )}

              <Button className="w-full h-12 rounded-xl font-semibold text-base gap-2" type="submit" disabled={isLoading}>
                {isOtpSent ? "Verify OTP" : "Send OTP"}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>

            {isOtpSent && (
              <div className="mt-4 text-center space-y-2">
                <p className="text-xs text-muted-foreground">
                  OTP valid for {expiresIn ?? 300} seconds.
                </p>
                <button
                  type="button"
                  className="text-sm text-primary font-semibold hover:underline"
                  onClick={() => {
                    setIsOtpSent(false);
                    setOtp("");
                  }}
                >
                  Change number
                </button>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
