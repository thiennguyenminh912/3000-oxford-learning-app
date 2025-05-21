import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";

interface LayoutProps {
  children: ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-lg font-bold text-blue-600">Oxford 5000+</h1>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-6">
            <NavLink to="/" active={isActive("/")}>
              Home
            </NavLink>
            <NavLink to="/words" active={isActive("/words")}>
              Words List
            </NavLink>
            <NavLink to="/learn" active={isActive("/learn")}>
              Learn
            </NavLink>
            <NavLink to="/progress" active={isActive("/progress")}>
              Progress
            </NavLink>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-6">{children}</main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden bg-white shadow-lg border-t fixed bottom-0 left-0 right-0 z-10">
        <div className="grid grid-cols-4 h-16">
          <MobileNavLink to="/" active={isActive("/")}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            <span>Home</span>
          </MobileNavLink>

          <MobileNavLink to="/words" active={isActive("/words")}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
            <span>Words</span>
          </MobileNavLink>

          <MobileNavLink to="/learn" active={isActive("/learn")}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
            <span>Learn</span>
          </MobileNavLink>

          <MobileNavLink to="/progress" active={isActive("/progress")}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            <span>Progress</span>
          </MobileNavLink>
        </div>
      </nav>

      {/* Add padding at the bottom for mobile to account for fixed navigation */}
      <div className="h-16 md:hidden"></div>
    </div>
  );
};

interface NavLinkProps {
  to: string;
  active: boolean;
  children: ReactNode;
}

const NavLink: React.FC<NavLinkProps> = ({ to, active, children }) => {
  return (
    <Link
      to={to}
      className={`font-medium ${
        active ? "text-blue-600" : "text-gray-600 hover:text-blue-500"
      }`}
    >
      {children}
    </Link>
  );
};

const MobileNavLink: React.FC<NavLinkProps> = ({ to, active, children }) => {
  return (
    <Link
      to={to}
      className={`flex flex-col items-center justify-center text-xs ${
        active ? "text-blue-600" : "text-gray-600 hover:text-blue-500"
      }`}
    >
      {children}
    </Link>
  );
};
