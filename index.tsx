<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <meta name="theme-color" content="#000000" />
    <title>kh.travel</title>
    
    <!-- App Icons (Updated with KH text) -->
    <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect width=%22100%22 height=%22100%22 fill=%22black%22/><g transform=%22translate(0,-5)%22><circle cx=%2250%22 cy=%2250%22 r=%2235%22 stroke=%22white%22 stroke-width=%225%22 fill=%22none%22/><path d=%22M15 50h70M50 15v70M50 15c12 0 20 16 20 35s-8 35-20 35-20-16-20-35 8-35 20-35z%22 stroke=%22white%22 stroke-width=%223%22 fill=%22none%22/></g><text x=%2250%22 y=%2292%22 font-family=%22sans-serif%22 font-weight=%22bold%22 font-size=%2222%22 fill=%22white%22 text-anchor=%22middle%22 letter-spacing=%222%22>KH</text></svg>">
    <link rel="apple-touch-icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect width=%22100%22 height=%22100%22 fill=%22black%22/><g transform=%22translate(0,-5)%22><circle cx=%2250%22 cy=%2250%22 r=%2235%22 stroke=%22white%22 stroke-width=%225%22 fill=%22none%22/><path d=%22M15 50h70M50 15v70M50 15c12 0 20 16 20 35s-8 35-20 35-20-16-20-35 8-35 20-35z%22 stroke=%22white%22 stroke-width=%223%22 fill=%22none%22/></g><text x=%2250%22 y=%2292%22 font-family=%22sans-serif%22 font-weight=%22bold%22 font-size=%2222%22 fill=%22white%22 text-anchor=%22middle%22 letter-spacing=%222%22>KH</text></svg>">
    
    <!-- Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>
    
    <!-- Global Styles -->
    <style>
      body {
        background-color: #000000;
        color: #e5e5e5;
        font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        padding-top: env(safe-area-inset-top);
        padding-bottom: env(safe-area-inset-bottom);
        -webkit-tap-highlight-color: transparent;
      }
      input, textarea, select, button {
        font-family: inherit;
        text-transform: inherit;
        letter-spacing: inherit;
      }
      .no-scrollbar::-webkit-scrollbar { display: none; }
      .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
      .animate-pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
      .animate-fade-in { animation: fadeIn 0.2s ease-out; }
      @keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }

      select { -webkit-appearance: none; }
    </style>

    <!-- Polyfill for process.env to prevent crashes in Preview -->
    <script>
      window.process = window.process || { env: {} };
    </script>

    <!-- Import Map for Preview Environment (Ignored by Vite in production/local dev) -->
    <script type="importmap">
{
  "imports": {
    "react": "https://aistudiocdn.com/react@^19.2.0",
    "@google/genai": "https://aistudiocdn.com/@google/genai@^1.30.0",
    "react-dom/": "https://aistudiocdn.com/react-dom@^19.2.0/",
    "vite": "https://aistudiocdn.com/vite@^7.2.4",
    "@vitejs/plugin-react": "https://aistudiocdn.com/@vitejs/plugin-react@^5.1.1",
    "react/": "https://aistudiocdn.com/react@^19.2.0/"
  }
}
</script>
</head>
<body>
    <div id="root"></div>
    <script type="module" src="./index.tsx"></script>
</body>
</html>
