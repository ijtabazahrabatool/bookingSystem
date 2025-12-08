import React, { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { register, login } from "../services/api";
import { countries } from "../utils/countries";

export default function AuthModal({ onClose, initialMode = "login" }) {
  const [mode, setMode] = useState(initialMode); // "login" or "register"
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "customer",
    phone: "",
    countryCode: "+92"
  });
  const [error, setError] = useState("");
  const [passwordStrength, setPasswordStrength] = useState("");
  const [loading, setLoading] = useState(false);
  const { login: setAuth } = useContext(AuthContext);

  // Password strength checker
  const checkPasswordStrength = (password) => {
    if (!password) {
      setPasswordStrength("");
      return;
    }

    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };

    const passed = Object.values(checks).filter(Boolean).length;
    const total = Object.keys(checks).length;

    if (passed === total) {
      setPasswordStrength("strong");
    } else if (passed >= 3) {
      setPasswordStrength("medium");
    } else {
      setPasswordStrength("weak");
    }
  };

  // Get phone placeholder based on country code
  const getPhonePlaceholder = (countryCode) => {
    const placeholders = {
      "+92": "3001234567",
      "+1": "1234567890",
      "+44": "7123456789",
      "+91": "9876543210",
      "+971": "501234567",
      "+966": "501234567",
      "+61": "412345678",
      "+86": "13800138000",
      "+33": "612345678",
      "+49": "15123456789",
      "+81": "9012345678",
      "+7": "9123456789",
      "+65": "91234567",
      "+60": "123456789",
      "+880": "1712345678"
    };
    return placeholders[countryCode] || "Phone number";
  };

  // Get phone format hint based on country code
  const getPhoneFormatHint = (countryCode) => {
    const hints = {
      "+92": "Format: 03XX-XXXXXXX (11 digits with 0) or 3XX-XXXXXXX (10 digits without 0)",
      "+1": "Format: 10 digits (e.g., 1234567890)",
      "+44": "Format: 10-11 digits (e.g., 7123456789)",
      "+91": "Format: 10 digits starting with 6, 7, 8, or 9",
      "+971": "Format: 9 digits starting with 5",
      "+966": "Format: 9 digits starting with 5",
    };
    return hints[countryCode] || "Enter phone number (7-15 digits)";
  };

  // Email validation
  const validateEmailFormat = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { valid: false, message: "Please enter a valid email address" };
    }
    return { valid: true, message: "" };
  };

  // Phone validation for multiple countries
  const validatePhone = (phone, countryCode) => {
    if (!phone) return { valid: true, message: "" };
    
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
    
    // Pakistan (+92)
    if (countryCode === "+92" || countryCode === "92") {
      const phoneWithoutZero = cleanPhone.startsWith('0') ? cleanPhone.substring(1) : cleanPhone;
      if (!/^\d{10}$/.test(phoneWithoutZero)) {
        return { 
          valid: false, 
          message: "Pakistan phone must be 11 digits (with 0) or 10 digits (without 0)" 
        };
      }
      if (!phoneWithoutZero.startsWith('3')) {
        return { 
          valid: false, 
          message: "Pakistan mobile number must start with 3" 
        };
      }
    }
    // United States/Canada (+1)
    else if (countryCode === "+1") {
      if (!/^\d{10}$/.test(cleanPhone)) {
        return { 
          valid: false, 
          message: "US/Canada phone must be 10 digits" 
        };
      }
    }
    // United Kingdom (+44)
    else if (countryCode === "+44") {
      const ukPhone = cleanPhone.startsWith('0') ? cleanPhone.substring(1) : cleanPhone;
      if (!/^\d{10,11}$/.test(ukPhone)) {
        return { 
          valid: false, 
          message: "UK phone must be 10-11 digits" 
        };
      }
    }
    // India (+91)
    else if (countryCode === "+91") {
      if (!/^\d{10}$/.test(cleanPhone)) {
        return { 
          valid: false, 
          message: "India phone must be 10 digits" 
        };
      }
      if (!cleanPhone.startsWith('6') && !cleanPhone.startsWith('7') && !cleanPhone.startsWith('8') && !cleanPhone.startsWith('9')) {
        return { 
          valid: false, 
          message: "India mobile number must start with 6, 7, 8, or 9" 
        };
      }
    }
    // UAE (+971)
    else if (countryCode === "+971") {
      if (!/^\d{9}$/.test(cleanPhone)) {
        return { 
          valid: false, 
          message: "UAE phone must be 9 digits" 
        };
      }
      if (!cleanPhone.startsWith('5')) {
        return { 
          valid: false, 
          message: "UAE mobile number must start with 5" 
        };
      }
    }
    // Generic validation for other countries
    else {
      if (!/^\d{7,15}$/.test(cleanPhone)) {
        return { 
          valid: false, 
          message: "Phone number must be between 7 and 15 digits" 
        };
      }
    }
    
    return { valid: true, message: "" };
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setError("");
    
    if (name === "password") {
      checkPasswordStrength(value);
    }
    
    if (name === "email") {
      const emailValidation = validateEmailFormat(value);
      if (!emailValidation.valid && value) {
        setError(emailValidation.message);
      }
    }
    
    if (name === "phone" || name === "countryCode") {
      const phoneToValidate = name === "phone" ? value : formData.phone;
      const codeToUse = name === "countryCode" ? value : formData.countryCode;
      const validation = validatePhone(phoneToValidate, codeToUse);
      if (!validation.valid && phoneToValidate) {
        setError(validation.message);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validation
    if (mode === "register") {
      if (!formData.name || !formData.email || !formData.password) {
        setError("Please fill in all required fields");
        return;
      }
      
      // Email validation
      const emailValidation = validateEmailFormat(formData.email);
      if (!emailValidation.valid) {
        setError(emailValidation.message);
        return;
      }
      
      // Strong password validation
      const passwordChecks = {
        length: formData.password.length >= 8,
        uppercase: /[A-Z]/.test(formData.password),
        lowercase: /[a-z]/.test(formData.password),
        number: /[0-9]/.test(formData.password),
        special: /[!@#$%^&*(),.?":{}|<>]/.test(formData.password)
      };
      
      const missingChecks = [];
      if (!passwordChecks.length) missingChecks.push("at least 8 characters");
      if (!passwordChecks.uppercase) missingChecks.push("one uppercase letter");
      if (!passwordChecks.lowercase) missingChecks.push("one lowercase letter");
      if (!passwordChecks.number) missingChecks.push("one number");
      if (!passwordChecks.special) missingChecks.push("one special character");
      
      if (missingChecks.length > 0) {
        setError(`Password must contain ${missingChecks.join(", ")}`);
        return;
      }
      
      if (formData.password !== formData.confirmPassword) {
        setError("Passwords do not match");
        return;
      }
      
      // Phone validation
      if (formData.phone) {
        const phoneValidation = validatePhone(formData.phone, formData.countryCode);
        if (!phoneValidation.valid) {
          setError(phoneValidation.message);
          return;
        }
      }
    } else {
      if (!formData.email || !formData.password) {
        setError("Please fill in all fields");
        return;
      }
      
      // Email validation for login
      const emailValidation = validateEmailFormat(formData.email);
      if (!emailValidation.valid) {
        setError(emailValidation.message);
        return;
      }
    }

    setLoading(true);
    try {
      if (mode === "register") {
        const response = await register({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          phone: formData.phone,
          countryCode: formData.countryCode
        });
        setAuth(response.data.user, response.data.token);
        onClose();
      } else {
        const response = await login({
          email: formData.email,
          password: formData.password
        });
        setAuth(response.data.user, response.data.token);
        onClose();
      }
    } catch (error) {
      setError(error.response?.data?.message || error.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white relative">
          <button 
            onClick={onClose} 
            className="absolute top-4 right-4 text-white/80 hover:text-white"
          >
            <i className="fa-solid fa-xmark text-xl"></i>
          </button>
          <h2 className="text-2xl font-bold">
            {mode === "login" ? "Login" : "Create Account"}
          </h2>
          <p className="text-indigo-100 text-sm mt-1">
            {mode === "login" 
              ? "Welcome back! Please login to continue" 
              : "Join LuxeBook today and start booking"}
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Account Type *
                  </label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="customer">Customer</option>
                    <option value="provider">Provider</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Phone (Optional)
                  </label>
                  <div className="flex gap-2">
                    <select
                      name="countryCode"
                      value={formData.countryCode}
                      onChange={handleChange}
                      className="w-32 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      {countries.map(country => (
                        <option key={country.code} value={country.code}>
                          {country.flag} {country.code}
                        </option>
                      ))}
                    </select>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder={getPhonePlaceholder(formData.countryCode)}
                      className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  {formData.phone && (
                    <p className="text-xs text-slate-500 mt-1">
                      {getPhoneFormatHint(formData.countryCode)}
                    </p>
                  )}
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Password *
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
              />
              {mode === "register" && formData.password && (
                <div className="mt-2">
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-2 h-2 rounded-full ${
                      passwordStrength === "strong" ? "bg-emerald-500" :
                      passwordStrength === "medium" ? "bg-yellow-500" :
                      passwordStrength === "weak" ? "bg-red-500" : "bg-slate-300"
                    }`}></div>
                    <span className={`text-xs font-medium ${
                      passwordStrength === "strong" ? "text-emerald-600" :
                      passwordStrength === "medium" ? "text-yellow-600" :
                      passwordStrength === "weak" ? "text-red-600" : "text-slate-500"
                    }`}>
                      {passwordStrength === "strong" ? "Strong password" :
                       passwordStrength === "medium" ? "Medium strength" :
                       passwordStrength === "weak" ? "Weak password" : "Password strength"}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 space-y-1">
                    <div className={formData.password.length >= 8 ? "text-emerald-600" : ""}>
                      {formData.password.length >= 8 ? "✓" : "○"} At least 8 characters
                    </div>
                    <div className={/[A-Z]/.test(formData.password) ? "text-emerald-600" : ""}>
                      {/[A-Z]/.test(formData.password) ? "✓" : "○"} One uppercase letter
                    </div>
                    <div className={/[a-z]/.test(formData.password) ? "text-emerald-600" : ""}>
                      {/[a-z]/.test(formData.password) ? "✓" : "○"} One lowercase letter
                    </div>
                    <div className={/[0-9]/.test(formData.password) ? "text-emerald-600" : ""}>
                      {/[0-9]/.test(formData.password) ? "✓" : "○"} One number
                    </div>
                    <div className={/[!@#$%^&*(),.?":{}|<>]/.test(formData.password) ? "text-emerald-600" : ""}>
                      {/[!@#$%^&*(),.?":{}|<>]/.test(formData.password) ? "✓" : "○"} One special character
                    </div>
                  </div>
                </div>
              )}
            </div>

            {mode === "register" && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Confirm Password *
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <i className="fa-solid fa-circle-notch fa-spin mr-2"></i>
                  {mode === "login" ? "Logging in..." : "Creating account..."}
                </span>
              ) : (
                mode === "login" ? "Login" : "Create Account"
              )}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button
              onClick={() => {
                setMode(mode === "login" ? "register" : "login");
                setError("");
                setFormData({
                  name: "",
                  email: "",
                  password: "",
                  confirmPassword: "",
                  role: "customer",
                  phone: "",
                  countryCode: "+92"
                });
                setPasswordStrength("");
              }}
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
            >
              {mode === "login" 
                ? "Don't have an account? Sign up" 
                : "Already have an account? Login"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

