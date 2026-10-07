import './globals.css';

export const metadata = {
  title: 'Shortly — simple, fast link shortening',
  description: 'Shorten links and track clicks with a clean dashboard.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div className="shell">
          <header className="nav">
            <a href="/" className="brand">Shortly</a>
            <nav>
              <a href="/dashboard">Dashboard</a>
              <a href="/login">Log in</a>
              <a href="/register" className="cta">Sign up</a>
            </nav>
          </header>
          <main>{children}</main>
          <footer className="footer">Built with Express, PostgreSQL and Next.js</footer>
        </div>
      </body>
    </html>
  );
}
