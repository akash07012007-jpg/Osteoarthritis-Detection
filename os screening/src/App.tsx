import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { ScreeningProvider } from './context/ScreeningContext';

import LoginScreen from './screens/LoginScreen';
import HomeScreen from './screens/HomeScreen';
import PatientEntryScreen from './screens/PatientEntryScreen';
import ConsentScreen from './screens/ConsentScreen';
import PatientHubScreen from './screens/PatientHubScreen';
import QuestionnaireScreen from './screens/QuestionnaireScreen';
import SitToStandScreen from './screens/SitToStandScreen';
import ResultsScreen from './screens/ResultsScreen';
import ScreeningCompleteScreen from './screens/ScreeningCompleteScreen';
import MyPatientsScreen from './screens/MyPatientsScreen';
import GuidanceScreen from './screens/GuidanceScreen';
import PatientHomeScreen from './screens/PatientHomeScreen';
import AdminDashboardScreen from './screens/AdminDashboardScreen';

export default function App() {
  return (
    <AppProvider>
      <ScreeningProvider>
        <Router>
          <Routes>
            <Route path="/" element={<LoginScreen />} />
            <Route path="/home" element={<HomeScreen />} />
            <Route path="/patient-entry" element={<PatientEntryScreen />} />
            <Route path="/consent" element={<ConsentScreen />} />
            <Route path="/patient-hub" element={<PatientHubScreen />} />
            <Route path="/questionnaire" element={<QuestionnaireScreen />} />
            <Route path="/sit-to-stand" element={<SitToStandScreen />} />
            <Route path="/results" element={<ResultsScreen />} />
            <Route path="/complete" element={<ScreeningCompleteScreen />} />
            <Route path="/my-patients" element={<MyPatientsScreen />} />
            <Route path="/guidance" element={<GuidanceScreen />} />
            <Route path="/patient-home" element={<PatientHomeScreen />} />
            <Route path="/admin" element={<AdminDashboardScreen />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </ScreeningProvider>
    </AppProvider>
  );
}
