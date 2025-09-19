
import React, { useState } from 'react';
import type { User } from '../types.ts';

interface LoginPageProps {
  users: User[];
  setCurrentUser: (user: User | null) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ users, setCurrentUser }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
    if (user) {
      setCurrentUser(user);
    } else {
      setError('Invalid email or password.');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
      <div className="w-full max-w-md">
        <div className="bg-white shadow-xl rounded-lg p-8">
          <h2 className="text-3xl font-bold text-center mb-2 text-transparent bg-clip-text bg-gradient-to-r from-[#10B981] to-emerald-600">
            Welcome Back
          </h2>
          <p className="text-center text-[#6B7280] mb-8">Sign in to continue</p>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#374151]">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full bg-gray-50 border border-gray-300 rounded-md shadow-sm py-2 px-3 text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:border-transparent"
                required
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[#374151]">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full bg-gray-50 border border-gray-300 rounded-md shadow-sm py-2 px-3 text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:border-transparent"
                required
              />
            </div>

            {error && (
              <div className="p-3 rounded-md text-sm bg-red-100 text-red-700">
                {error}
              </div>
            )}
            
            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#10B981] hover:bg-[#059669] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#10B981] transition-colors"
              >
                Sign In
              </button>
            </div>
          </form>
          <div className="mt-6 text-center text-sm text-[#6B7280] space-y-1">
            <p><span className='font-bold'>Admin:</span> admin@gmail.com / @admin_</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;