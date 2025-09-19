
import React from 'react';
import type { Page, User } from '../types.ts';

interface HeaderProps {
  user: User | null;
  setPage: (page: Page) => void;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, setPage, onLogout }) => {
  const handleHomeClick = () => {
    if (user) {
      switch(user.role) {
        case 'ADMIN': setPage('ADMIN_DASHBOARD'); break;
        case 'LECTURER': setPage('LECTURER_DASHBOARD'); break;
        case 'STUDENT': setPage('STUDENT_DASHBOARD'); break;
      }
    }
  };

  return (
    <header className="bg-[#1C1F24] shadow-lg">
      <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
        <div className="text-2xl font-bold text-white cursor-pointer" onClick={handleHomeClick}>
          <span className="text-[#10B981]">Face</span>Attendance
        </div>
        {user && (
          <div className="flex items-center space-x-6">
            <span className="text-gray-300">Welcome, {user.name}</span>
            {user.role === 'LECTURER' && (
               <>
                 <button onClick={() => setPage('LECTURER_DASHBOARD')} className="text-gray-300 hover:text-[#10B981] transition duration-300">Home</button>
                 <button onClick={() => setPage('VIEW_ATTENDANCE')} className="text-gray-300 hover:text-[#10B981] transition duration-300">View Records</button>
               </>
            )}
            {user.role === 'ADMIN' && (
                <>
                  <button onClick={() => setPage('ADMIN_DASHBOARD')} className="text-gray-300 hover:text-[#10B981] transition duration-300">Dashboard</button>
                  <button onClick={() => setPage('ADD_STUDENT')} className="text-gray-300 hover:text-[#10B981] transition duration-300">Manage Students</button>
                </>
            )}
             {user.role === 'STUDENT' && (
                <button onClick={() => setPage('STUDENT_DASHBOARD')} className="text-gray-300 hover:text-[#10B981] transition duration-300">Dashboard</button>
            )}
            <button 
              onClick={onLogout} 
              className="bg-[#10B981] hover:bg-[#059669] text-white font-bold py-2 px-4 rounded transition-colors"
            >
              Logout
            </button>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Header;
