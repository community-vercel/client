import LayoutWrapper from '@/components/Layoutwrapper';
import './globals.css';

export const metadata = {
  title: 'Digital Cashbook',
  description: 'A modern cashbook and expense management system',
};


export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
      <LayoutWrapper>{children}</LayoutWrapper>
      </body>
    </html>
  );
}