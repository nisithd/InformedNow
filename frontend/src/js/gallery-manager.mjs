import authManager from './auth.mjs';
import { getGalleries } from './api.mjs';

class GalleryManager {
    constructor() {
        this.currentGalleryOwner = null; // null = gallery list, "username" = specific gallery
        this.currentPage = 0;
        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.loadGalleryList();
        this.showCurrentView();
    }

    setupEventListeners() {
        // Listen for auth changes
        document.addEventListener('authStateChanged', () => {
            this.showCurrentView();
        });
    }

    async loadGalleryList(page = 0) {
        if (!authManager.isAuthenticated()) return;

        try {
            const data = await new Promise((resolve, reject) => {
                getGalleries(page, reject, resolve);
            });

            this.displayGalleryList(data);
        } catch (error) {
            console.error('Error loading galleries:', error);
        }
    }

    displayGalleryList(data) {
        const container = document.getElementById('gallery-list-container');
        if (!container) return;

        container.innerHTML = `
            <h2>All Galleries</h2>
            <div class="galleries-grid">
                ${data.galleries.map(gallery => `
                    <div class="gallery-card" data-username="${gallery.username}">
                        <h3>${gallery.username}'s Gallery</h3>
                        <p>${gallery.imageCount} image${gallery.imageCount !== 1 ? 's' : ''}</p>
                        <button class="view-gallery-btn">View Gallery</button>
                    </div>
                `).join('')}
            </div>
            <div class="gallery-pagination">
                <button id="prev-galleries" ${data.page === 0 ? 'disabled' : ''}>Previous</button>
                <span>Page ${data.page + 1} of ${data.totalPages}</span>
                <button id="next-galleries" ${data.page >= data.totalPages - 1 ? 'disabled' : ''}>Next</button>
            </div>
        `;

        // Add event listeners to view buttons
        container.querySelectorAll('.view-gallery-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const username = e.target.closest('.gallery-card').dataset.username;
                this.viewUserGallery(username);
            });
        });

        // Pagination
        document.getElementById('prev-galleries')?.addEventListener('click', () => {
            this.loadGalleryList(data.page - 1);
        });

        document.getElementById('next-galleries')?.addEventListener('click', () => {
            this.loadGalleryList(data.page + 1);
        });
    }

    viewUserGallery(username) {
        this.currentGalleryOwner = username;
        this.showCurrentView();
        
        // Dispatch event for image-display to load this gallery
        document.dispatchEvent(new CustomEvent('galleryChanged', { 
            detail: { galleryOwner: username } 
        }));
    }

    viewAllGalleries() {
        this.currentGalleryOwner = null;
        this.showCurrentView();
    }

    viewMyGallery() {
        if (authManager.isAuthenticated()) {
            this.viewUserGallery(authManager.getCurrentUser());
        }
    }

    showCurrentView() {
        const galleryList = document.getElementById('gallery-list-container');
        const imageDisplay = document.getElementById('image-display-container');

        if (!authManager.isAuthenticated()) {
            // Show nothing or login prompt
            if (galleryList) galleryList.style.display = 'none';
            if (imageDisplay) imageDisplay.style.display = 'none';
            return;
        }

        if (this.currentGalleryOwner === null) {
            // Show gallery list
            if (galleryList) galleryList.style.display = 'block';
            if (imageDisplay) imageDisplay.style.display = 'none';
            this.loadGalleryList();
        } else {
            // Show specific gallery
            if (galleryList) galleryList.style.display = 'none';
            if (imageDisplay) imageDisplay.style.display = 'block';
        }

        this.updateHeaderButtons();
    }

    updateHeaderButtons() {
        // Remove existing filter buttons if any
        const existingFilters = document.getElementById('gallery-filters');
        if (existingFilters) existingFilters.remove();

        if (!authManager.isAuthenticated()) return;

        const filterHTML = `
            <div id="gallery-filters">
                <button id="view-all-galleries" class="gallery-filter-btn ${this.currentGalleryOwner === null ? 'active' : ''}">
                    All Galleries
                </button>
                <button id="view-my-gallery" class="gallery-filter-btn ${this.currentGalleryOwner === authManager.getCurrentUser() ? 'active' : ''}">
                    My Gallery
                </button>
            </div>
        `;

        document.querySelector('header').insertAdjacentHTML('afterend', filterHTML);

        // Add event listeners
        document.getElementById('view-all-galleries').addEventListener('click', () => {
            this.viewAllGalleries();
        });

        document.getElementById('view-my-gallery').addEventListener('click', () => {
            this.viewMyGallery();
        });
    }
}

// Create global instance
const galleryManager = new GalleryManager();
export default galleryManager;