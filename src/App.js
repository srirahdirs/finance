import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import ClientManagement from './components/ClientManagement';
import LoanManagement from './components/LoanManagement';
import TransactionHistory from './components/TransactionHistory';
import Reports from './components/Reports';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    const loginStatus = localStorage.getItem('isLoggedIn');
    if (loginStatus === 'true') {
      setIsLoggedIn(true);
    }
  }, []);

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('loginTime');
    setIsLoggedIn(false);
    setActiveTab('dashboard');
    setMobileMenuOpen(false);
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setMobileMenuOpen(false);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard onNavigate={setActiveTab} />;
      case 'clients':
        return <ClientManagement />;
      case 'loans':
        return <LoanManagement />;
      case 'transactions':
        return <TransactionHistory />;
      case 'reports':
        return <Reports />;
      default:
        return <Dashboard onNavigate={setActiveTab} />;
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'clients', label: 'Clients', icon: '👥' },
    { id: 'loans', label: 'Loans', icon: '💰' },
    { id: 'transactions', label: 'Transactions', icon: '📋' },
    { id: 'reports', label: 'Reports', icon: '📈' }
  ];

  // Show login page if not authenticated
  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-medium border-b border-gray-200">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4 sm:py-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 sm:h-10 sm:w-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-lg sm:text-xl font-bold">🏦</span>
                </div>
              </div>
              <div className="ml-3 sm:ml-4">
                <h1 className="text-lg sm:text-2xl font-bold text-gray-900">Loan Management System</h1>
                <p className="text-xs sm:text-sm text-gray-500 hidden sm:block">Financial Management Platform</p>
              </div>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="hidden lg:flex items-center space-x-2 text-sm text-gray-500">
                <div className="h-2 w-2 bg-green-400 rounded-full"></div>
                <span>System Online</span>
              </div>
              <button
                onClick={handleLogout}
                className="btn btn-outline text-xs sm:text-sm px-3 py-2 sm:px-4"
              >
                <span className="hidden sm:inline">🚪 Logout</span>
                <span className="sm:hidden">🚪</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Mobile menu button */}
          <div className="flex justify-between items-center lg:hidden py-3">
            <div className="flex space-x-1">
              {navItems.slice(0, 3).map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleTabChange(item.id)}
                  className={`nav-link text-xs px-2 py-1 ${activeTab === item.id ? 'active' : ''}`}
                >
                  <span className="mr-1">{item.icon}</span>
                  <span className="hidden sm:inline">{item.label}</span>
                </button>
              ))}
            </div>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="btn btn-outline text-xs px-3 py-2"
            >
              <span className="mr-1">📱</span>
              More
            </button>
          </div>

          {/* Mobile dropdown menu */}
          {mobileMenuOpen && (
            <div className="lg:hidden border-t border-gray-200 py-3">
              <div className="flex flex-wrap gap-2">
                {navItems.slice(3).map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleTabChange(item.id)}
                    className={`nav-link text-sm px-3 py-2 ${activeTab === item.id ? 'active' : ''}`}
                  >
                    <span className="mr-2">{item.icon}</span>
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Desktop navigation */}
          <div className="hidden lg:flex space-x-8">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id)}
                className={`nav-link ${activeTab === item.id ? 'active' : ''}`}
              >
                <span className="mr-2">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 w-full">
        {renderContent()}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0">
            <div className="text-xs sm:text-sm text-gray-500 text-center sm:text-left">
              © 2025 Loan Management System. All rights reserved.
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4 text-xs sm:text-sm text-gray-500">
              <span className="hidden sm:inline">Developed by</span>
              <a
                href="http://www.youngzen.in/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 font-medium transition-colors duration-200"
              >
                YoungZen Technologies
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;