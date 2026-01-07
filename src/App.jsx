import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/layout/Layout";
import Dashboard from "./pages/Dashboard";
import VisionMission from "./pages/VisionMission";
import CreateMission from "./pages/CreateMission";
import Objectives from "./pages/Objectives";
import CreateObjective from "./pages/CreateObjective";
import EditObjective from "./pages/EditObjective";
import Activities from "./pages/Activities";
import CreateActivity from "./pages/CreateActivity";
import EditActivity from "./pages/EditActivity";
import Users from "./pages/admin/Users";
import CreateUser from "./pages/admin/CreateUser";
import EditUser from "./pages/admin/EditUser";
import Branches from "./pages/admin/Branches";
import UserRoles from "./pages/admin/UserRoles";
import Positions from "./pages/admin/Positions";
import RoleTypes from "./pages/admin/RoleTypes";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="vision-mission" element={<VisionMission />} />
          <Route path="create-mission" element={<CreateMission />} />
          <Route path="plans" element={<Objectives />} />
          <Route path="objectives" element={<Objectives />} />
          <Route path="create-objective" element={<CreateObjective />} />
          <Route path="edit-objective/:id" element={<EditObjective />} />

          {/* Admin / Lookup Tables Routes */}
          <Route path="admin/users" element={<Users />} />
          <Route path="admin/create-user" element={<CreateUser />} />
          <Route path="admin/edit-user/:id" element={<EditUser />} />
          <Route path="admin/branches" element={<Branches />} />
          <Route path="admin/user-roles" element={<UserRoles />} />
          <Route path="admin/positions" element={<Positions />} />
          <Route path="admin/role-types" element={<RoleTypes />} />

          <Route path="activities" element={<Activities />} />
          <Route path="create-activity" element={<CreateActivity />} />
          <Route path="edit-activity/:id" element={<EditActivity />} />
          <Route
            path="reports"
            element={<div>Reports Page (Coming Soon)</div>}
          />
          <Route
            path="settings"
            element={<div>Settings Page (Coming Soon)</div>}
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
