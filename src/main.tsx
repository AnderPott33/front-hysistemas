import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './App.css'
import App from './App.tsx'
import { Tooltip } from 'react-tooltip'
import 'react-tooltip/dist/react-tooltip.css'
import { initTheme } from './theme/theme';
import { initDarkMode } from './theme/darkMode';

initTheme();
initDarkMode();

createRoot(document.getElementById('root')!).render(

    <>
        <App />
        <Tooltip
            id="default-tooltip"
            place="top"
            delayShow={300}
        />
    </>
)
