const state = {
    currentUser: JSON.parse(localStorage.getItem('vendor_session')) || null,
    vendors: JSON.parse(localStorage.getItem('vendors_db')) || [],
    profiles: JSON.parse(localStorage.getItem('profiles_db')) || {},
};

const saveVendors = () => localStorage.setItem('vendors_db', JSON.stringify(state.vendors));
const saveProfiles = () => localStorage.setItem('profiles_db', JSON.stringify(state.profiles));
const saveSession = () => localStorage.setItem('vendor_session', JSON.stringify(state.currentUser));

// --- UI Elements ---
const views = {
    login: document.getElementById('view-login'),
    register: document.getElementById('view-register'),
    authContainer: document.getElementById('auth-container'),
    profileContainer: document.getElementById('profile-container'),
    dashboardContainer: document.getElementById('dashboard-container')
};

// --- Utilities ---
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
        <span>${message}</span>
    `;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
}

function switchAuthView(view) {
    if (view === 'login') {
        views.login.classList.remove('hidden');
        views.register.classList.add('hidden');
        document.getElementById('auth-title').innerText = 'Welcome Back';
        document.getElementById('auth-subtitle').innerText = 'Please enter your details to continue';
    } else {
        views.login.classList.add('hidden');
        views.register.classList.remove('hidden');
        document.getElementById('auth-title').innerText = 'Create Account';
        document.getElementById('auth-subtitle').innerText = 'Join our vendor network today';
    }
}

function navigateTo(view) {
    // Reset all
    views.authContainer.classList.add('hidden');
    views.profileContainer.classList.add('hidden');
    views.dashboardContainer.classList.add('hidden');

    if (view === 'auth') views.authContainer.classList.remove('hidden');
    if (view === 'profile') views.profileContainer.classList.remove('hidden');
    if (view === 'dashboard') views.dashboardContainer.classList.remove('hidden');
}

// --- Auth Logic ---
document.getElementById('go-to-register').onclick = (e) => {
    e.preventDefault();
    switchAuthView('register');
};

document.getElementById('go-to-login').onclick = (e) => {
    e.preventDefault();
    switchAuthView('login');
};

document.getElementById('form-register').onsubmit = (e) => {
    e.preventDefault();
    const email = document.getElementById('reg-email').value;
    const phone = document.getElementById('reg-phone').value;
    const pass = document.getElementById('reg-pass').value;
    const confPass = document.getElementById('reg-conf-pass').value;
    const name = document.getElementById('reg-name').value;

    if (pass !== confPass) {
        return showToast('Passwords do not match!', 'error');
    }

    if (state.vendors.some(v => v.email === email || v.phone === phone)) {
        return showToast('Email or Mobile number already registered!', 'error');
    }

    const newVendor = { id: Date.now(), name, email, phone, pass };
    state.vendors.push(newVendor);
    saveVendors();

    showToast('Registration successful! Please login.');
    switchAuthView('login');
};

document.getElementById('form-login').onsubmit = (e) => {
    e.preventDefault();
    const loginId = document.getElementById('login-id').value;
    const pass = document.getElementById('login-pass').value;

    const vendor = state.vendors.find(v => (v.email === loginId || v.phone === loginId) && v.pass === pass);

    if (!vendor) {
        return showToast('Invalid credentials!', 'error');
    }

    state.currentUser = vendor;
    saveSession();

    if (!state.profiles[vendor.id]) {
        navigateTo('profile');
    } else {
        initDashboard();
        navigateTo('dashboard');
    }
};

// --- Profile Setup Logic ---
let currentStep = 1;
const profileSteps = document.querySelectorAll('.profile-step');
const navItems = document.querySelectorAll('.nav-item');

function updateStepUI() {
    profileSteps.forEach(step => {
        step.classList.add('hidden');
        if (step.dataset.step == currentStep) step.classList.remove('hidden');
    });

    navItems.forEach(item => {
        item.classList.remove('active');
        if (item.dataset.step == currentStep) item.classList.add('active');
    });
}

document.querySelectorAll('.next-step').forEach(btn => {
    btn.onclick = () => {
        const currentEl = document.querySelector(`.profile-step[data-step="${currentStep}"]`);
        const inputs = currentEl.querySelectorAll('input[required], select[required]');

        let valid = true;
        inputs.forEach(input => {
            if (!input.value) {
                input.style.borderColor = 'var(--danger)';
                valid = false;
            } else {
                input.style.borderColor = 'var(--border-color)';
            }
        });

        if (!valid) return showToast('Please fill all required fields', 'error');

        currentStep++;
        updateStepUI();
    };
});

document.querySelectorAll('.prev-step').forEach(btn => {
    btn.onclick = () => {
        currentStep--;
        updateStepUI();
    };
});

document.getElementById('form-profile').onsubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const profileData = Object.fromEntries(formData.entries());

    // Fixed: Corrected the assignment to the state.profiles object
    state.profiles[state.currentUser.id] = {
        ...profileData,
        status: 'Pending Approval',
        submittedAt: new Date().toISOString()
    };
    saveProfiles();

    showToast('Profile Submitted Successfully!', 'success');
    setTimeout(() => {
        showToast('Notification sent to Admin. Your account is now pending approval.', 'success');
        initDashboard();
        navigateTo('dashboard');
    }, 2000);
};

// --- Dashboard Logic ---
function initDashboard() {
    const vendor = state.currentUser;
    const profile = state.profiles[vendor.id] || {};

    document.getElementById('dash-user-name').innerText = vendor.name || 'Vendor';
    document.getElementById('greeting-name').innerText = vendor.name || 'Vendor';

    const statusBadge = document.getElementById('vendor-status-badge');
    if (statusBadge) {
        statusBadge.innerText = profile.status || 'Pending Approval';
    }
}

document.getElementById('btn-logout').onclick = () => {
    state.currentUser = null;
    saveSession();
    navigateTo('auth');
    switchAuthView('login');
};

// --- Init ---
window.onload = () => {
    if (state.currentUser) {
        if (!state.profiles[state.currentUser.id]) {
            navigateTo('profile');
        } else {
            initDashboard();
            navigateTo('dashboard');
        }
    } else {
        navigateTo('auth');
    }
};