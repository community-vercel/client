import './globals.css';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import ProtectedRoute from '../components/ProtectedRoute';

export const metadata = {
  title: 'Digital Cashbook',
  description: 'A modern cashbook and expense management system',
};

export default function RootLayout({ children }) {
  const isAuthPage = ['/login', '/register'].includes(typeof window !== 'undefined' ? window.location.pathname : '');

  return (
    <html lang="en">
      <body>
        {isAuthPage ? (
          children
        ) : (
          <>
            <Navbar />
            <div className="flex">
              <Sidebar />
              <main className="flex-1">{children}</main>
            </div>
            </>
            
        )}
      </body>
    </html>
  );
}