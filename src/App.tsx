import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { ThemeProvider } from './context/ThemeContext';
import { Home } from './pages/Home';

export default function App() {
  return (
    <ThemeProvider>
      <Home />
      <Analytics />
      <SpeedInsights />
    </ThemeProvider>
  );
}
