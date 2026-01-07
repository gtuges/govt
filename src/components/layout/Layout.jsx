import React, { useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  ListTodo,
  PieChart,
  Settings,
  LogOut,
  Target,
  Database,
  ChevronDown,
  ChevronRight,
  Users,
  UserCog,
  Briefcase,
  GitBranch,
  Award,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import FiscalYearSelector from "../common/FiscalYearSelector";
import "./Layout.css";

const Layout = () => {
  const location = useLocation();
  const [expandedMenus, setExpandedMenus] = useState({});
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const toggleMenu = (label) => {
    if (isSidebarCollapsed) return; // Disable submenu toggling when collapsed
    setExpandedMenus((prev) => ({
      ...prev,
      [label]: !prev[label],
    }));
  };

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
    // Collapse all open menus when minimizing sidebar
    if (!isSidebarCollapsed) {
      setExpandedMenus({});
    }
  };

  const navItems = [
    { path: "/", label: "Dashboard", icon: <LayoutDashboard size={20} /> },
    {
      path: "/vision-mission",
      label: "Vision & Mission",
      icon: <Target size={20} />,
    },
    {
      path: "/plans",
      label: "Plans & Objectives",
      icon: <FileText size={20} />,
    },
    { path: "/activities", label: "Activities", icon: <ListTodo size={20} /> },
    {
      label: "Lookup Tables",
      icon: <Database size={20} />,
      children: [
        { path: "/admin/users", label: "Users", icon: <Users size={18} /> },
        {
          path: "/admin/branches",
          label: "Branches",
          icon: <GitBranch size={18} />,
        },
        {
          path: "/admin/user-roles",
          label: "User Roles",
          icon: <UserCog size={18} />,
        },
        {
          path: "/admin/positions",
          label: "Positions",
          icon: <Briefcase size={18} />,
        },
        {
          path: "/admin/role-types",
          label: "Role Types",
          icon: <Award size={18} />,
        },
      ],
    },
    { path: "/reports", label: "Reports & M&E", icon: <PieChart size={20} /> },
    { path: "/settings", label: "Settings", icon: <Settings size={20} /> },
  ];

  // Helper to check if a parent menu should be active
  const isParentActive = (item) => {
    if (!item.children) return false;
    return item.children.some((child) => child.path === location.pathname);
  };

  return (
    <div className="layout-container">
      <aside className={`sidebar ${isSidebarCollapsed ? "collapsed" : ""}`}>
        <div className="sidebar-header">
          {!isSidebarCollapsed && <h2>Govt App</h2>}
          <button
            className="sidebar-toggle-btn"
            onClick={toggleSidebar}
            title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isSidebarCollapsed ? (
              <PanelLeftOpen size={20} />
            ) : (
              <PanelLeftClose size={20} />
            )}
          </button>
        </div>
        <nav className="sidebar-nav">
          {navItems.map((item) => {
            if (item.children) {
              const isActive = isParentActive(item);
              // Auto-expand if active, otherwise use state
              const isExpanded =
                !isSidebarCollapsed &&
                (expandedMenus[item.label] !== undefined
                  ? expandedMenus[item.label]
                  : isActive);

              return (
                <div key={item.label} className="nav-group">
                  <button
                    className={`nav-item nav-group-toggle ${
                      isActive ? "active" : ""
                    }`}
                    onClick={() => {
                      if (isSidebarCollapsed) {
                        setIsSidebarCollapsed(false);
                        setExpandedMenus((prev) => ({
                          ...prev,
                          [item.label]: true,
                        }));
                      } else {
                        toggleMenu(item.label);
                      }
                    }}
                    title={isSidebarCollapsed ? item.label : ""}
                  >
                    <div className="nav-item-content">
                      {item.icon}
                      {!isSidebarCollapsed && <span>{item.label}</span>}
                    </div>
                    {!isSidebarCollapsed &&
                      (isExpanded ? (
                        <ChevronDown size={16} />
                      ) : (
                        <ChevronRight size={16} />
                      ))}
                    {isSidebarCollapsed && (
                      <div className="collapsed-tooltip">{item.label}</div>
                    )}
                  </button>
                  {isExpanded && !isSidebarCollapsed && (
                    <div className="nav-group-children">
                      {item.children.map((child) => (
                        <Link
                          key={child.path}
                          to={child.path}
                          className={`nav-item nav-child ${
                            location.pathname === child.path ? "active" : ""
                          }`}
                        >
                          {child.icon}
                          <span>{child.label}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-item ${
                  location.pathname === item.path ? "active" : ""
                }`}
                title={isSidebarCollapsed ? item.label : ""}
              >
                <div className="nav-item-content">
                  {item.icon}
                  {!isSidebarCollapsed && <span>{item.label}</span>}
                </div>
                {isSidebarCollapsed && (
                  <div className="collapsed-tooltip">{item.label}</div>
                )}
              </Link>
            );
          })}
        </nav>
        <div className="sidebar-footer">
          <button
            className="nav-item logout-btn"
            title={isSidebarCollapsed ? "Logout" : ""}
          >
            <div className="nav-item-content">
              <LogOut size={20} />
              {!isSidebarCollapsed && <span>Logout</span>}
            </div>
            {isSidebarCollapsed && (
              <div className="collapsed-tooltip">Logout</div>
            )}
          </button>
        </div>
      </aside>
      <main className="main-content">
        <header className="top-header">
          <h1>
            {navItems.find((i) => i.path === location.pathname)?.label ||
              navItems
                .flatMap((i) => i.children || [])
                .find((c) => c.path === location.pathname)?.label ||
              "Dashboard"}
          </h1>
          <div className="header-right">
            <FiscalYearSelector />
            <div className="user-profile">
              <span>Admin User</span>
            </div>
          </div>
        </header>
        <div className="content-scroll">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
