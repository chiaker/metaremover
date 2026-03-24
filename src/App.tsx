import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { Home } from './pages/Home';

export default function App() {
  return (
    <>
      <Home />
      <Analytics />
      <SpeedInsights />
    </>
  );
}
