import React, { useMemo, useState } from "react";
import "./dashboard.css"; // reuse same CSS file

const seedUsers = [
  { id: "U-1001", name: "John Doe", email: "john.doe@gov.pg", role: "Administrator", department: "Health", status: "Active" },
  { id: "U-1002", name: "Sarah Lee", email: "sarah.lee@gov.pg", role: "Manager", department: "Education", status: "Active" },
  { id: "U-1003", name: "Michael Chen", email: "michael.chen@gov.pg", role: "Editor", department: "Infrastructure", status: "Suspended" },
  { id: "U-1004", name: "Emily Stone", email: "emily.stone@gov.pg", role: "Viewer", department: "Health", status: "Active" },
];

export default function Users() {
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [deptFilter, setDeptFilter] = useState("All");
  const [users, setUsers] = useState(seedUsers);

  const roles = useMemo(() => ["All", ...Array.from(new Set(seedUsers.map(u => u.role)))], []);
  const depts = useMemo(() => ["All", ...Array.from(new Set(seedUsers.map(u => u.department)))], []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter(u => {
      const matchesQuery =
        !q ||
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.id.toLowerCase().includes(q);

      const matchesRole = roleFilter === "All" || u.role === roleFilter;
      const matchesDept = deptFilter === "All" || u.department === deptFilter;

      return matchesQuery && matchesRole && matchesDept;
    });
  }, [users, query, roleFilter, deptFilter]);

  function onAddUser() {
    // Replace with your modal / route later
    const next = {
      id: `U-${Math.floor(1000 + Math.random() * 9000)}`,
      name: "New User",
      email: "new.user@gov.pg",
      role: "Viewer",
      department: "Health",
      status: "Active",
    };
    setUsers([next, ...users]);
  }

  function onEdit(user) {
    // Replace with modal or navigate: /users/:id/edit
    const name = prompt("Edit name", user.name);
    if (!name) return;

    setUsers(users.map(u => (u.id === user.id ? { ...u, name } : u)));
  }

  function onDelete(user) {
    const ok = confirm(`Delete ${user.name}?`);
    if (!ok) return;
    setUsers(users.filter(u => u.id !== user.id));
  }

  return (
    <div className="content">
      <div className="card tableCard">
        <div className="cardHeader usersHeader">
          <div>
            <h2 className="cardTitle">Users</h2>
            <div className="cardSubtitle">Manage accounts, roles, and access</div>
          </div>

          <div className="headerActions">
            <div className="search usersSearch">
              <span className="searchIcon">⌕</span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name, email, or ID…"
              />
            </div>

            <select className="select" value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}>
              {depts.map(d => <option key={d} value={d}>{d}</option>)}
            </select>

            <select className="select" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
              {roles.map(r => <option key={r} value={r}>{r}</option>)}
            </select>

            <button className="btn primary" onClick={onAddUser}>
              + Add User
            </button>
          </div>
        </div>

        <div className="tableWrap">
          <table className="table">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Department</th>
                <th>Role</th>
                <th>Status</th>
                <th className="num">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="emptyCell">
                    No users found.
                  </td>
                </tr>
              ) : (
                filtered.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div className="userCell">
                        <div className="avatarSm userAvatar">{u.name.split(" ").map(x => x[0]).slice(0,2).join("")}</div>
                        <div className="userCellMeta">
                          <div className="userCellName">{u.name}</div>
                          <div className="userCellId">{u.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="muted">{u.email}</td>
                    <td>{u.department}</td>
                    <td>
                      <span className="badge">{u.role}</span>
                    </td>
                    <td>
                      <span className={`pill ${u.status === "Active" ? "pill--good" : "pill--bad"}`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="num">
                      <div className="rowActions">
                        <button className="btn soft small" onClick={() => onEdit(u)}>✎ Edit</button>
                        <button className="btn danger small" onClick={() => onDelete(u)}>🗑 Delete</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          <div className="tableFooter">
            <div className="muted">{filtered.length} user(s)</div>
            <div className="pager">
              <button className="btn soft small" disabled>‹</button>
              <button className="btn soft small">1</button>
              <button className="btn soft small" disabled>›</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
