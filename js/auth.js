// Client-side auth shim that delegates to serverless endpoints.
(function(global){
  async function login(username, password) {
    try {
      // include deviceId so server can enforce single-device rule
      let deviceId = null;
      try { deviceId = localStorage.getItem('worm_device_id'); } catch (e) {}
      if (!deviceId) {
        deviceId = 'd-' + Math.random().toString(36).slice(2) + '-' + Date.now();
        try { localStorage.setItem('worm_device_id', deviceId); } catch (e) {}
      }

      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, deviceId })
      });
      if (!res.ok) {
        const err = await res.json().catch(()=>({ message: 'Login failed' }));
        return { ok: false, message: err.message || 'Invalid credentials' };
      }
      const data = await res.json();
      return { ok: true, role: data.role };
    } catch (e) {
      return { ok: false, message: 'Network error' };
    }
  }

  async function logout() {
    try {
      // inform server about our deviceId so it can clear the binding
      let deviceId = null;
      try { deviceId = localStorage.getItem('worm_device_id'); } catch (e) {}
      await fetch('/api/logout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ deviceId }) });
    } catch (e) {}
    try { window.location.href = '/login.html'; } catch(e){}
  }

  async function isAuthenticated() {
    try {
      const res = await fetch('/api/session');
      if (!res.ok) return false;
      const d = await res.json();
      return !!d.authenticated;
    } catch (e) {
      return false;
    }
  }

  async function getUser() {
    try {
      const res = await fetch('/api/session');
      if (!res.ok) return null;
      const d = await res.json();
      return d.user || null;
    } catch (e) {
      return null;
    }
  }

  global.auth = { login, logout, isAuthenticated, getUser };

  // Attach logout button handler if present
  document.addEventListener('DOMContentLoaded', ()=>{
    const btn = document.getElementById('logoutBtn');
    if (btn) btn.addEventListener('click', () => { logout(); });
  });

})(window);
