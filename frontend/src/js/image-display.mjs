import { addImage, deleteImage, getUserImagePosition, addComment } from "./api.mjs";
import authManager from './auth.mjs';

class ImageDisplay {
    constructor() {
        this.currentPosition = 0;
        this.currentGalleryOwner = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        
        // Listen for gallery changes
        document.addEventListener('galleryChanged', (e) => {
            this.currentGalleryOwner = e.detail.galleryOwner;
            this.currentPosition = 0;
            this.loadCurrentImage();
            this.updateUploadFormVisibility();
        });

        // Listen for auth changes
        document.addEventListener('authStateChanged', () => {
            this.currentPosition = 0;
            this.loadCurrentImage();
        });

        // Listen for comment form submission
        document.getElementById("post_comment")?.addEventListener("submit", (e) => {
            this.handleCommentSubmit(e);
        });
    }

    setupEventListeners() {
        // Navigation buttons
        document.querySelector("#prev-btn")?.addEventListener("click", () => {
            this.prevImage();
        });

        document.querySelector("#next-btn")?.addEventListener("click", () => {
            this.nextImage();
        });

        document.querySelector("#delete-btn")?.addEventListener("click", () => {
            this.deleteCurrentImage();
        });

        // Image upload form
        document.getElementById("post_image")?.addEventListener("submit", (e) => {
            this.handleImageUpload(e);
        });

        // Minimize buttons
        document.querySelector("#post_image .minimize_btn")?.addEventListener("click", () => {
            document.querySelector("#post_image .form_body").classList.toggle("minimized");
        });

        document.querySelector("#post_comment .minimize_btn")?.addEventListener("click", () => {
            document.querySelector("#post_comment .form_body").classList.toggle("minimized");
        });
    }

    async handleCommentSubmit(event) {
        event.preventDefault();

        if (!authManager.isAuthenticated()) {
            console.log('Comment failed: User not authenticated');
            return;
        }

        const content = document.querySelector("#comment_content").value;
        const currentImage = await this.getCurrentImageData();

        if (!currentImage) {
            console.log('Comment failed: No image selected');
            return;
        }

        try {
            // Use the updated addComment (no author parameter)
            await new Promise((resolve, reject) => {
                addComment(currentImage._id, content, reject, resolve);
            });

            document.getElementById("post_comment").reset();
            
            // Refresh comments
            document.dispatchEvent(new CustomEvent("imageChanged", { detail: currentImage }));
        } catch (error) {
            console.error('Comment error:', error.message);
        }
    }

    async getCurrentImageData() {
        if (!authManager.isAuthenticated() || !this.currentGalleryOwner) {
            return null;
        }

        try {
            const data = await new Promise((resolve, reject) => {
                getUserImagePosition(this.currentGalleryOwner, this.currentPosition, reject, resolve);
            });
            return data.image;
        } catch (error) {
            console.error('Error getting current image:', error);
            return null;
        }
    }

    async loadCurrentImage() {
        if (!authManager.isAuthenticated() || !this.currentGalleryOwner) {
            this.updateImageDisplay(null);
            return;
        }

        try {
            const data = await new Promise((resolve, reject) => {
                getUserImagePosition(this.currentGalleryOwner, this.currentPosition, reject, resolve);
            });

            if (!data.image && this.currentPosition !== 0) {
                this.currentPosition = 0;
                this.loadCurrentImage();
                return;
            }

            if (data.image) {
                this.updateImageDisplay(data.image);
                this.updateNavigationButtons(data.hasPrev, data.hasNext);
            } else {
                this.updateImageDisplay(null);
                this.updateNavigationButtons(false, false);
            }
        } catch (error) {
            console.error('Error loading image:', error);
            this.updateImageDisplay(null);
        }
    }

    updateImageDisplay(image) {
        const imageDisplay = document.querySelector("#image-display");
        if (!imageDisplay) return;

        if (image) {
            imageDisplay.style.display = "block";
            document.querySelector("#gallery-image").src = `/uploads/${image.filename}`;
            document.querySelector("#image-title").textContent = image.title;
            document.querySelector("#image-author").textContent = `By: ${image.author}`;
            document.querySelector("#image-date").textContent = `Uploaded: ${new Date(image.createdAt).toLocaleString("en-CA")}`;
            
            // Show comments section
            document.querySelector("#post_comment").style.display = "block";
            document.querySelector("#comments").style.display = "block";
            
            this.updateDeleteButtonVisibility(image);
            this.notifyImageChange(image);
        } else {
            imageDisplay.style.display = "none";
            document.querySelector("#post_comment").style.display = "none";
            document.querySelector("#comments").style.display = "none";
            this.updateNavigationButtons(false, false);
        }
    }

    updateDeleteButtonVisibility(image) {
        const deleteBtn = document.querySelector("#delete-btn");
        if (!deleteBtn) return;

        if (image.userId === authManager.getCurrentUser()) {
            deleteBtn.style.display = "inline-block";
        } else {
            deleteBtn.style.display = "none";
        }
    }

    updateUploadFormVisibility() {
        const uploadForm = document.getElementById('post_image');
        if (!uploadForm) return;

        if (this.currentGalleryOwner === authManager.getCurrentUser()) {
            uploadForm.style.display = 'block';
        } else {
            uploadForm.style.display = 'none';
        }
    }

    updateNavigationButtons(hasPrev, hasNext) {
        const prevBtn = document.querySelector("#prev-btn");
        const nextBtn = document.querySelector("#next-btn");
        
        if (prevBtn) prevBtn.disabled = !hasPrev;
        if (nextBtn) nextBtn.disabled = !hasNext;
    }

    nextImage() {
        this.currentPosition++;
        this.loadCurrentImage();
    }

    prevImage() {
        this.currentPosition--;
        this.loadCurrentImage();
    }

    async deleteCurrentImage() {
        if (!authManager.isAuthenticated()) return;

        try {
            const data = await new Promise((resolve, reject) => {
                getUserImagePosition(this.currentGalleryOwner, this.currentPosition, reject, resolve);
            });

            if (!data.image || data.image.userId !== authManager.getCurrentUser()) {
                alert('You can only delete your own images');
                return;
            }

            await new Promise((resolve, reject) => {
                deleteImage(this.currentGalleryOwner, data.image._id, reject, resolve);
            });

            this.currentPosition = 0;
            this.loadCurrentImage();
        } catch (error) {
            console.error('Error deleting image:', error);
        }
    }

    async handleImageUpload(event) {
        event.preventDefault();

        if (!authManager.isAuthenticated()) {
            console.log('Upload failed: User not authenticated');
            return;
        }

        const uploadUserId = authManager.getCurrentUser();
        const title = document.querySelector("#image_title").value;
        const fileInput = document.querySelector("#image_file");
        const file = fileInput.files[0];

        if (!file) {
            console.log('Upload failed: No file selected');
            return;
        }

        try {
            await new Promise((resolve, reject) => {
                addImage(title, uploadUserId, file, reject, resolve);
            });
            document.getElementById("post_image").reset();
            this.currentPosition = 0;
            this.loadCurrentImage();
        } catch (error) {
            console.error('Upload failed:', error.message);
        }
    }

    animateImageChange(callback) {
        const image = document.querySelector("#gallery-image");
        if (!image) {
            callback();
            return;
        }

        image.classList.add("fade-out", "loading");
        setTimeout(() => {
            callback();
            image.classList.remove("fade-out");
            image.classList.add("fade-in");
            setTimeout(() => {
                image.classList.remove("fade-in", "loading");
            }, 300);
        }, 150);
    }

    notifyImageChange(image) {
        document.dispatchEvent(new CustomEvent("imageChanged", { detail: image }));
    }
}

// Create global instance
const imageDisplay = new ImageDisplay();
export default imageDisplay;