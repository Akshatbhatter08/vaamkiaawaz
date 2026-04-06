const fs = require('fs');
let code = fs.readFileSync('src/app/page.tsx', 'utf-8');

code = code.replace(
  /const handleLogin = \(event: FormEvent<HTMLFormElement>\) => \{[\s\S]*?setLoginForm\(\{ email: "", password: "" \}\);\n  \};/,
  `const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginForm.email.trim(), password: loginForm.password.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLoginMessage(data.error || "गलत ईमेल या पासवर्ड।");
        return;
      }
      setSessionEmail(data.user.email);
      setLoginMessage(\`स्वागत है \${data.user.email}\`);
      setLoginForm({ email: "", password: "" });
      fetchUsers();
    } catch (err) {
      setLoginMessage("लॉगिन विफल।");
    }
  };`
);

code = code.replace(
  /const handleLogout = \(\) => \{[\s\S]*?setLoginMessage\("सफलतापूर्वक लॉगआउट किया गया।"\);\n  \};/,
  `const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setSessionEmail("");
    setLoginMessage("सफलतापूर्वक लॉगआउट किया गया।");
  };`
);

code = code.replace(
  /const handleAddAdmin = \(event: FormEvent<HTMLFormElement>\) => \{[\s\S]*?setNewAdminForm\(\{ email: "", password: "", permissions: noPermissions\(\) \}\);\n  \};/,
  `const handleAddAdmin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isMaster) return;
    if (!newAdminForm.email.trim() || !newAdminForm.password.trim()) {
      setAdminMessage("नए एडमिन के लिए ईमेल और पासवर्ड आवश्यक है।");
      return;
    }
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: newAdminForm.email.trim(),
          password: newAdminForm.password.trim(),
          role: "ADMIN",
          permissions: newAdminForm.permissions
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setAdminMessage(data.error || "त्रुटि");
        return;
      }
      setAdminMessage("नया एडमिन जोड़ा गया।");
      setNewAdminForm({ email: "", password: "", permissions: noPermissions() });
      fetchUsers();
    } catch (err) {
      setAdminMessage("नेटवर्क त्रुटि");
    }
  };`
);

code = code.replace(
  /const handleAddContributor = \(event: FormEvent<HTMLFormElement>\) => \{[\s\S]*?setNewContributorForm\(\{ email: "", password: "" \}\);\n  \};/,
  `const handleAddContributor = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canManageContributors) return;
    if (!newContributorForm.email.trim() || !newContributorForm.password.trim()) {
      setAdminMessage("योगदानकर्ता के लिए ईमेल और पासवर्ड आवश्यक है।");
      return;
    }
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: newContributorForm.email.trim(),
          password: newContributorForm.password.trim(),
          role: "CONTRIBUTOR"
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setAdminMessage(data.error || "त्रुटि");
        return;
      }
      setAdminMessage("अधिकृत योगदानकर्ता जोड़ा गया।");
      setNewContributorForm({ email: "", password: "" });
      fetchUsers();
    } catch (err) {
      setAdminMessage("नेटवर्क त्रुटि");
    }
  };`
);

code = code.replace(
  /const \[users, setUsers\] = useState<UserAccount\[\]>\(seedUsers\(\)\);/,
  `const [users, setUsers] = useState<UserAccount[]>([]);
  
  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users.map((u: any) => ({
           id: u.id,
           role: u.role === "MASTER_ADMIN" ? "master" : u.role === "ADMIN" ? "admin" : "contributor",
           email: u.email,
           password: "",
           active: u.active,
           permissions: u.permissions || noPermissions()
        })));
      }
    } catch (err) {}
  };`
);

code = code.replace(
  /const savedUsers = localStorage.getItem\(USERS_STORAGE_KEY\);\s+if \(savedUsers\) \{[\s\S]*?localStorage.setItem\(USERS_STORAGE_KEY, JSON.stringify\(seedUsers\(\)\)\);\n    \}/,
  `fetchUsers();
    fetch("/api/auth/me").then(res => res.json()).then(data => {
      if (data.user) {
        setSessionEmail(data.user.email);
      }
    }).catch(() => {});`
);

code = code.replace(
  /useEffect\(\(\) => \{\s+localStorage.setItem\(USERS_STORAGE_KEY, JSON.stringify\(users\)\);\s+\}, \[users\]\);/,
  ``
);

fs.writeFileSync('src/app/page.tsx', code);
console.log("Replaced successfully!");