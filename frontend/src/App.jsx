import { Navigate, Route, Routes } from "react-router-dom";
import Login from "./pages/Login";
import Otp from "./pages/Otp";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Salary from "./pages/Salary";
import Gpf from "./pages/Gpf";
import Requests from "./pages/Requests";
import Certificates from "./pages/Certificates";
import Circulars from "./pages/Circulars";
import Grievances from "./pages/Grievances";
import Tax from "./pages/Tax";
import Pension from "./pages/Pension";
import Faq from "./pages/Faq";
import Reports from "./pages/Reports";
import AuditLog from "./pages/AuditLog";
import Approver from "./pages/Approver";

function RequireAuth({ children }) {
  const token = localStorage.getItem("access_token");
  return token ? children : <Navigate to="/login" replace />;
}

const protectedRoutes = [
  { path: "/dashboard", element: <Dashboard /> },
  { path: "/profile", element: <Profile /> },
  { path: "/salary", element: <Salary /> },
  { path: "/gpf", element: <Gpf /> },
  { path: "/requests", element: <Requests /> },
  { path: "/certificates", element: <Certificates /> },
  { path: "/circulars", element: <Circulars /> },
  { path: "/grievances", element: <Grievances /> },
  { path: "/tax", element: <Tax /> },
  { path: "/pension", element: <Pension /> },
  { path: "/faq", element: <Faq /> },
  { path: "/reports", element: <Reports /> },
  { path: "/audit-log", element: <AuditLog /> },
  { path: "/approver", element: <Approver /> },
];

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/otp" element={<Otp />} />
      <Route path="/register" element={<Register />} />
      {protectedRoutes.map(({ path, element }) => (
        <Route key={path} path={path} element={<RequireAuth>{element}</RequireAuth>} />
      ))}
    </Routes>
  );
}
