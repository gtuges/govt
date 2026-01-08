import React from "react";
import "./dashboard.css";

const stats = [
  {
    label: "Total Objectives",
    value: "12",
    sub: "+2 this month",
    tone: "success",
    icon: "🎯",
  },
  {
    label: "Active Activities",
    value: "24",
    sub: "On track",
    tone: "info",
    icon: "✅",
  },
  {
    label: "Budget Utilized",
    value: "45%",
    sub: "Within limits",
    tone: "neutral",
    icon: "💰",
  },
  {
    label: "Pending Approvals",
    value: "5",
    sub: "Action needed",
    tone: "danger",
    icon: "⚠️",
  },
];

const departments = [
  {
    name: "Health",
    objectives: 4,
    activities: 12,
    budget: 120000,
    status: "onTrack",
    budgetPct: 72,
  },
  {
    name: "Education",
    objectives: 3,
    activities: 8,
    budget: 85000,
    status: "atRisk",
    budgetPct: 48,
  },
  {
    name: "Infrastructure",
    objectives: 5,
    activities: 15,
    budget: 250000,
    status: "delayed",
    budgetPct: 36,
  },
];

function formatMoney(n) {
  return n.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function StatusPill({ status }) {
  const map = {
    onTrack: { text: "On Track", cls: "pill pill--good" },
    atRisk: { text: "At Risk", cls: "pill pill--warn" },
    delayed: { text: "Delayed", cls: "pill pill--bad" },
  };
  const s = map[status] || { text: "Unknown", cls: "pill" };
  return <span className={s.cls}>{s.text}</span>;
}

export default function Dashboard() {
  return (
    <div className="appShell">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="brand">
          <div className="brandMark">🛡️</div>
          <div className="brandText">
            <div className="brandName">Govt App</div>
            <div className="brandTag">Admin Console</div>
          </div>
          <button className="iconBtn ghost" aria-label="Collapse">
            ☰
          </button>
        </div>

        <nav className="nav">
          <a className="navItem active" href="#dashboard">
            <span className="navIcon">📊</span>
            Dashboard
          </a>
          <a className="navItem" href="#vision">
            <span className="navIcon">🧭</span>
            Vision &amp; Mission
          </a>
          <a className="navItem" href="#plans">
            <span className="navIcon">🗂️</span>
            Plans &amp; Objectives
          </a>
          <a className="navItem" href="#activities">
            <span className="navIcon">📝</span>
            Activities
          </a>

          <div className="navSection">
            <div className="navSectionTitle">Lookup Tables</div>
            <a className="navItem" href="#users">
              <span className="navIcon">👤</span>
              Users
            </a>
            <a className="navItem" href="#branches">
              <span className="navIcon">🏢</span>
              Branches
            </a>
            <a className="navItem" href="#roles">
              <span className="navIcon">🔐</span>
              User Roles
            </a>
            <a className="navItem" href="#positions">
              <span className="navIcon">🧩</span>
              Positions
            </a>
          </div>

          <a className="navItem" href="#reports">
            <span className="navIcon">📈</span>
            Reports &amp; M&amp;E
          </a>
          <a className="navItem" href="#settings">
            <span className="navIcon">⚙️</span>
            Settings
          </a>
        </nav>

        <div className="sidebarFooter">
          <div className="userCard">
            <div className="avatar">AU</div>
            <div className="userMeta">
              <div className="userName">Admin User</div>
              <div className="userRole">System Admin</div>
            </div>
          </div>
          <button className="logoutBtn">
            <span>⟵</span> Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="main">
        {/* Topbar */}
        <header className="topbar">
          <div className="pageTitleWrap">
            <h1 className="pageTitle">Dashboard</h1>
            <div className="pageHint">Overview • Performance • Approvals</div>
          </div>

          <div className="topbarRight">
            <div className="search">
              <span className="searchIcon">⌕</span>
              <input placeholder="Search anything…" />
            </div>

            <button className="chipBtn">
              <span className="chipIcon">📅</span>
              Fiscal Year <strong>FY 2026</strong>
              <span className="chipCaret">▾</span>
            </button>

            <button className="iconBtn" aria-label="Notifications">
              🔔
              <span className="dot" />
            </button>

            <div className="profileMini">
              <div className="avatarSm">AU</div>
              <div className="profileMiniText">
                <div className="profileName">Admin User</div>
                <div className="profileOrg">Head Office</div>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <section className="content">
          {/* Stat cards */}
          <div className="statGrid">
            {stats.map((s) => (
              <div
                key={s.label}
                className={`card statCard statCard--${s.tone}`}
              >
                <div className="statTop">
                  <div className="statLabel">{s.label}</div>
                  <div className="statIcon" aria-hidden="true">
                    {s.icon}
                  </div>
                </div>
                <div className="statValue">{s.value}</div>
                <div className="statSub">{s.sub}</div>
              </div>
            ))}
          </div>

          {/* Table */}
          <div className="card tableCard">
            <div className="cardHeader">
              <div>
                <h2 className="cardTitle">Progress by Department</h2>
                <div className="cardSubtitle">
                  Objectives, activities and budget utilization
                </div>
              </div>

              <div className="headerActions">
                <button className="btn soft">Export</button>
                <button className="btn primary">Create Report</button>
              </div>
            </div>

            <div className="tableWrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Department</th>
                    <th className="num">Objectives</th>
                    <th className="num">Activities</th>
                    <th className="num">Budget</th>
                    <th>Budget Use</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {departments.map((d) => (
                    <tr key={d.name}>
                      <td className="deptCell">
                        <div className="deptName">{d.name}</div>
                        <div className="deptHint">Updated today</div>
                      </td>
                      <td className="num">
                        <span className="badge">{d.objectives}</span>
                      </td>
                      <td className="num">{d.activities}</td>
                      <td className="num">{formatMoney(d.budget)}</td>
                      <td>
                        <div className="meter">
                          <div
                            className="meterBar"
                            style={{ width: `${d.budgetPct}%` }}
                          />
                        </div>
                        <div className="meterText">{d.budgetPct}%</div>
                      </td>
                      <td>
                        <StatusPill status={d.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Optional secondary panel (nice for “not empty” bottom area) */}
          <div className="splitGrid">
            <div className="card miniCard">
              <h3 className="miniTitle">Recent Activity</h3>
              <ul className="timeline">
                <li>
                  <span className="tDot good" />
                  <div>
                    <div className="tText">
                      <strong>Health</strong> added a new activity
                    </div>
                    <div className="tTime">2h ago</div>
                  </div>
                </li>
                <li>
                  <span className="tDot warn" />
                  <div>
                    <div className="tText">
                      <strong>Education</strong> budget updated
                    </div>
                    <div className="tTime">5h ago</div>
                  </div>
                </li>
                <li>
                  <span className="tDot bad" />
                  <div>
                    <div className="tText">
                      <strong>Infrastructure</strong> marked delayed item
                    </div>
                    <div className="tTime">Yesterday</div>
                  </div>
                </li>
              </ul>
            </div>

            <div className="card miniCard">
              <h3 className="miniTitle">Approvals Queue</h3>
              <div className="queue">
                <div className="queueRow">
                  <div>
                    <div className="qTitle">Procurement Request</div>
                    <div className="qMeta">Health • Ref #PR-1042</div>
                  </div>
                  <button className="btn soft small">Review</button>
                </div>
                <div className="queueRow">
                  <div>
                    <div className="qTitle">Travel Authorization</div>
                    <div className="qMeta">Education • Ref #TA-223</div>
                  </div>
                  <button className="btn soft small">Review</button>
                </div>
                <div className="queueRow">
                  <div>
                    <div className="qTitle">Budget Reallocation</div>
                    <div className="qMeta">Infrastructure • Ref #BR-19</div>
                  </div>
                  <button className="btn soft small">Review</button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
