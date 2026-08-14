import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import WelcomePage from './pages/WelcomePage';
import SessionPage from './pages/SessionPage';
import CameraPage from './pages/CameraPage';
import ResultPage from './pages/ResultPage';
import PhotoPage from './pages/PhotoPage';
import PrivacyPage from './pages/PrivacyPage';
import TermsPage from './pages/TermsPage';

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route element={<Layout />}>
                    <Route path="/" element={<WelcomePage />} />
                    <Route path="/session/:sessionCode" element={<SessionPage />} />
                    <Route path="/session/:sessionCode/camera" element={<CameraPage />} />
                    <Route path="/session/:sessionCode/result" element={<ResultPage />} />
                    <Route path="/photo/:reference" element={<PhotoPage />} />
                    <Route path="/privacy" element={<PrivacyPage />} />
                    <Route path="/terms" element={<TermsPage />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}

const container = document.getElementById('app');
if (container) {
    const root = createRoot(container);
    root.render(<App />);
}
