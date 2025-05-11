import { Routes, Route, BrowserRouter as Router } from 'react-router-dom';
import DataOverview from './pages/data/DataOverview';
import HomePage from './page';

function App() {
  return (
    <Router>
        <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/dane" element={<DataOverview />} />
        </Routes>
    </Router>
  );
}
export { App }