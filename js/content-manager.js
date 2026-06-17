import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

const pageName = document.body.getAttribute("data-page");
let isAdmin = false;

// Initialize
document.addEventListener("DOMContentLoaded", () => {
    if (pageName) {
        loadContent(pageName);
    }
});

// Check Auth State for Inline Editing (admin page only)
onAuthStateChanged(auth, (user) => {
    if (user && pageName === 'admin') {
        isAdmin = true;
        enableAdminMode();
    } else {
        isAdmin = false;
    }
});

// Fetch content from Firestore and populate the page
export async function loadContent(pageName) {
    try {
        const docRef = doc(db, "pages", pageName);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            const elements = document.querySelectorAll("[data-content-id]");
            elements.forEach(el => {
                const key = el.getAttribute("data-content-id");
                if (data[key] !== undefined) {
                    el.innerHTML = data[key];
                }
            });
        }
    } catch (error) {
        console.error("Error loading content:", error);
    } finally {
        const loader = document.getElementById("global-loader");
        if (loader) {
            loader.style.opacity = "0";
            setTimeout(() => {
                loader.style.display = "none";
            }, 500);
        }
    }
}

function enableAdminMode() {
    // Add visual cues to editable elements
    const style = document.createElement('style');
    style.innerHTML = `
        [data-content-id] {
            outline: 2px dashed transparent;
            transition: outline 0.2s;
            position: relative;
        }
        [data-content-id]:hover {
            outline: 2px dashed var(--accent-primary);
            cursor: text;
        }
        .admin-toolbar {
            position: fixed;
            bottom: 2rem;
            right: 2rem;
            background: var(--bg-card);
            padding: 1rem;
            border: 2px solid var(--accent-secondary);
            box-shadow: 4px 4px 0px var(--accent-secondary);
            display: flex;
            gap: 0.5rem;
            z-index: 9999;
        }
        .admin-toolbar .btn-tool {
            background: var(--bg-secondary);
            border: 1px solid var(--border-dim);
            color: var(--text-primary);
            padding: 0.5rem 0.75rem;
            cursor: pointer;
            font-weight: 700;
            font-size: 0.8rem;
        }
        .admin-toolbar .btn-tool:hover {
            border-color: var(--accent-primary);
        }
    `;
    document.head.appendChild(style);

    // Make elements editable
    const elements = document.querySelectorAll("[data-content-id]");
    elements.forEach(el => {
        el.setAttribute("contenteditable", "true");
    });

    // Create floating toolbar
    const toolbar = document.createElement('div');
    toolbar.className = 'admin-toolbar';
    
    const linkBtn = document.createElement('button');
    linkBtn.className = 'btn-tool';
    linkBtn.innerText = '🔗 Link';
    linkBtn.onclick = () => {
        const url = prompt("Enter the URL (include https://):");
        if (url) {
            document.execCommand('createLink', false, url);
        }
    };

    const saveBtn = document.createElement('button');
    saveBtn.className = 'btn btn-primary';
    saveBtn.style.padding = '0.5rem 1rem';
    saveBtn.style.fontSize = '0.8rem';
    saveBtn.innerText = 'Save Page Changes';
    saveBtn.onclick = savePageContent;

    const logoutBtn = document.createElement('button');
    logoutBtn.className = 'btn';
    logoutBtn.style.background = '#ef4444';
    logoutBtn.style.color = 'white';
    logoutBtn.style.padding = '0.5rem 1rem';
    logoutBtn.style.fontSize = '0.8rem';
    logoutBtn.innerText = 'Log Out';
    logoutBtn.onclick = async () => {
        await signOut(auth);
        window.location.reload();
    };

    toolbar.appendChild(linkBtn);
    toolbar.appendChild(saveBtn);
    toolbar.appendChild(logoutBtn);
    document.body.appendChild(toolbar);
}

async function savePageContent() {
    if (!pageName) return;
    
    const saveBtn = document.querySelector('.admin-toolbar .btn-primary');
    saveBtn.innerText = 'Saving...';
    
    const data = {};
    const elements = document.querySelectorAll("[data-content-id]");
    elements.forEach(el => {
        const key = el.getAttribute("data-content-id");
        data[key] = el.innerHTML;
    });

    try {
        await setDoc(doc(db, "pages", pageName), data, { merge: true });

        // Save Country Overrides if any exist
        const countryElements = document.querySelectorAll("[data-country-code]");
        if (countryElements.length > 0) {
            const overrides = {};
            countryElements.forEach(el => {
                const num = parseInt(el.innerText.replace(/,/g, ''), 10);
                if (!isNaN(num)) {
                    overrides[el.getAttribute("data-country-code")] = num;
                }
            });
            if (Object.keys(overrides).length > 0) {
                await setDoc(doc(db, "data", "countryOverrides"), overrides, { merge: true });
            }
        }

        saveBtn.innerText = 'Saved!';
        setTimeout(() => saveBtn.innerText = 'Save Page Changes', 2000);
    } catch (error) {
        console.error("Error saving content:", error);
        saveBtn.innerText = 'Error saving';
        alert("Make sure you are logged in and have write permissions in Firestore.");
    }
}
