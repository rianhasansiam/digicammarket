'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, ShoppingBag, Heart, Truck, Star } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '../../componets/loading/LoadingSpinner';

const LoginPageClient = ({ loginData }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginStatus, setLoginStatus] = useState(null);
  const [errors, setErrors] = useState({});
  const router = useRouter();

  // Check if user is already authenticated
  const { data: session, status } = useSession();

  // Redirect authenticated users away from login page
  useEffect(() => {
    if (status === 'authenticated' && session) {
      router.push('/');
    }
  }, [status, session, router]);

  // Show loading while checking authentication
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  // Don't render login form if user is authenticated
  if (status === 'authenticated') {
    return null;
  }

  // Icon mapping function
  const getIcon = (iconName) => {
    const icons = {
      ShoppingBag,
      Heart,
      Truck,
      Star
    };
    return icons[iconName] || Star;
  };

  // Form validation
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Handle manual login with NextAuth
  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    setLoginStatus(null);

    try {
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        setLoginStatus('error');
        setErrors(prev => ({ 
          ...prev, 
          api: result.error === 'CredentialsSignin' 
            ? 'Invalid email or password' 
            : result.error 
        }));
      } else {
        setLoginStatus('success');
        router.push('/');
      }
    } catch (error) {
      console.error('Login error:', error);
      setLoginStatus('error');
      setErrors(prev => ({ ...prev, api: 'Network error. Please try again.' }));
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Google login with NextAuth
  const handleGoogleLogin = async () => {
    setIsLoading(true);
    
    try {
      const result = await signIn('google', {
        callbackUrl: '/',
        redirect: false
      });

      if (result?.error) {
        setLoginStatus('error');
        setErrors(prev => ({ ...prev, api: 'Google sign-in failed. Please try again.' }));
        setIsLoading(false);
      } else if (result?.url) {
        setLoginStatus('success');
        window.location.href = result.url;
      }
    } catch (error) {
      console.error('Google login error:', error);
      setLoginStatus('error');
      setErrors(prev => ({ ...prev, api: 'Google sign-in failed. Please try again.' }));
      setIsLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 }
    }
  };

  const slideInLeft = {
    hidden: { opacity: 0, x: -50 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.8 }
    }
  };

  const slideInRight = {
    hidden: { opacity: 0, x: 50 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.8 }
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Login Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-white">
        <motion.div
          className="max-w-md w-full space-y-8"
          variants={slideInLeft}
          initial="hidden"
          animate="visible"
        >
          {/* Brand Header */}
          <div className="text-center">
           
           
            <motion.h2
              className="text-3xl font-bold text-gray-900 mb-2"
              variants={itemVariants}
            >
              {loginData.formData.title}
            </motion.h2>
            <motion.p
              className="text-gray-600"
              variants={itemVariants}
            >
              {loginData.formData.subtitle}
            </motion.p>
          </div>

          {/* Google Login Button */}
          {loginData.authConfig.enableGoogleAuth && (
            <motion.div variants={itemVariants}>
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full flex justify-center items-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                {isLoading ? 'Signing in...' : 'Continue with Google'}
              </button>
            </motion.div>
          )}

          {/* Divider */}
          <motion.div
            className="relative"
            variants={itemVariants}
          >
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">or</span>
            </div>
          </motion.div>

          {/* Login Form */}
          <motion.form
            onSubmit={handleLogin}
            className="space-y-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Email Field */}
            <motion.div variants={itemVariants}>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-colors duration-200 ${
                    errors.email ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder={loginData.formData.emailPlaceholder}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </motion.div>

            {/* Password Field */}
            <motion.div variants={itemVariants}>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  className={`block w-full pl-10 pr-10 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-colors duration-200 ${
                    errors.password ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder={loginData.formData.passwordPlaceholder}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
            </motion.div>

            {/* Remember Me & Forgot Password */}
            <motion.div
              className="flex items-center justify-between"
              variants={itemVariants}
            >
              {loginData.authConfig.enableRememberMe && (
                <div className="flex items-center">
                  <input
                    id="rememberMe"
                    name="rememberMe"
                    type="checkbox"
                    checked={formData.rememberMe}
                    onChange={handleChange}
                    className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded"
                  />
                  <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-700">
                    {loginData.formData.rememberMeText}
                  </label>
                </div>
              )}

              {loginData.authConfig.showForgotPassword && (
                <Link
                  href={loginData.formData.forgotPasswordLink}
                  className="text-sm text-black hover:text-gray-700 font-medium"
                >
                  {loginData.formData.forgotPasswordText}
                </Link>
              )}
            </motion.div>

            {/* Login Status */}
            {loginStatus && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 rounded-lg text-center ${
                  loginStatus === 'success'
                    ? 'bg-green-100 text-green-700 border border-green-200'
                    : 'bg-red-100 text-red-700 border border-red-200'
                }`}
              >
                {loginStatus === 'success'
                  ? 'Login successful! Redirecting...'
                  : 'Invalid email or password. Please try again.'
                }
              </motion.div>
            )}

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              variants={itemVariants}
              whileHover={!isLoading ? { scale: 1.02 } : {}}
              whileTap={!isLoading ? { scale: 0.98 } : {}}
            >
              {isLoading ? (
                <div className="flex items-center">
                  <LoadingSpinner size="sm" color="white" />
                  <span className="ml-2">Signing in...</span>
                </div>
              ) : (
                loginData.formData.loginButtonText
              )}
            </motion.button>
          </motion.form>

          {/* Sign Up Link */}
          {loginData.authConfig.showSignUpLink && (
            <motion.div
              className="text-center"
              variants={itemVariants}
            >
              <p className="text-sm text-gray-600">
                {loginData.formData.noAccountText}{' '}
                <Link
                  href={loginData.formData.signUpLink}
                  className="font-medium text-black hover:text-gray-700"
                >
                  {loginData.formData.signUpText}
                </Link>
              </p>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Right Side - Benefits & Background */}
      <div className="hidden lg:flex flex-1 relative">
        {/* Background Image */}
        <div className="absolute inset-0">
          <Image
            src={loginData.backgroundImage}
            alt="Camera Background"
            fill
            className="object-cover"
            priority
            sizes="50vw"
          />
          <div className="absolute inset-0 bg-black bg-opacity-60"></div>
        </div>

        {/* Benefits Content */}
        <motion.div
          className="relative z-10 flex items-center justify-center p-12"
          variants={slideInRight}
          initial="hidden"
          animate="visible"
        >
          <div className="max-w-md text-white">
            <motion.h3
              className="text-3xl font-bold mb-6"
              variants={itemVariants}
            >
              {loginData.brandInfo.description}
            </motion.h3>
            
            <motion.div
              className="space-y-6"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {loginData.benefits.map((benefit, index) => {
                const IconComponent = getIcon(benefit.iconName);
                return (
                  <motion.div
                    key={index}
                    className="flex items-start space-x-4"
                    variants={itemVariants}
                  >
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                        <IconComponent className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold mb-1">
                        {benefit.title}
                      </h4>
                      <p className="text-gray-300">
                        {benefit.description}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPageClient;