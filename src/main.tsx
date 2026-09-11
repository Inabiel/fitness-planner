import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router';
import { App } from './app/App';
import './styles.css';

const root = document.getElementById('root');
if (!root) throw new Error('Application root element is missing.');

createRoot(root).render(<HashRouter><App /></HashRouter>);
