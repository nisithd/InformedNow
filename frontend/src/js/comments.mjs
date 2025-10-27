import { getCommentsPage, addComment, deleteComment } from "./api.mjs";
import authManager from './auth.mjs';

let currentCommentPage = 0;
let currentImage = null;

function updateComments(givenPage = null) {
    if (!currentImage) return;

    // Check authentication
    if (!authManager.isAuthenticated()) {
        document.querySelector("#comments").innerHTML = '<div class="comment">Please login to view comments</div>';
        return;
    }

    const page = givenPage !== null ? givenPage : currentCommentPage;
    
    getCommentsPage(
        currentImage._id,
        page,
        (error) => {
            console.error('Error loading comments:', error);
            if (error.includes('401') || error.includes('access denied')) {
                document.querySelector("#comments").innerHTML = '<div class="comment">Please login to view comments</div>';
            }
        },
        (data) => {
            const { comments, page, totalPages } = data;
            
            document.querySelector("#comments").innerHTML = `
                <div class="comment-nav">
                    <button id="prev-comments" ${page === 0 ? 'disabled' : ''}>Previous 10</button>
                    <div id="page-number">Page ${page + 1} of ${totalPages}</div>
                    <button id="next-comments" ${page >= totalPages - 1 ? 'disabled' : ''}>Next 10</button>
                </div>
            `;

            if (comments.length === 0 && page > 0) {
                updateCommentsWithTransition(page - 1);
                return;
            }

            comments.forEach((item) => {
                const elmt = document.createElement("div");
                elmt.className = "comment";
                
                // Show delete button only if:
                // - User owns the comment OR
                // - User owns the gallery (image)
                const canDelete = authManager.isAuthenticated() && 
                    (item.userId === authManager.getCurrentUser() || 
                     currentImage.userId === authManager.getCurrentUser());
                
                elmt.innerHTML = `
                    <div class="comment_user">
                        <img class="comment_picture" src="media/user.png" alt="${item.author}">
                        <div class="comment_username">${item.author}</div>
                        <div class="comment_date">${new Date(item.createdAt).toLocaleString("en-CA")}</div>
                    </div>
                    <div class="comment_content">${item.content}</div>
                    ${canDelete ? '<button class="delete-icon icon"></button>' : ''}
                `;

                if (canDelete) {
                    elmt.querySelector(".delete-icon").addEventListener("click", function () {
                        if (!authManager.isAuthenticated()) {
                            alert('Please login to delete comments');
                            return;
                        }
                        
                        deleteComment(
                            item._id,
                            (error) => {
                                console.error('Delete error:', error);
                                if (error.includes('401') || error.includes('access denied')) {
                                    alert('Please login to delete comments');
                                } else if (error.includes('403') || error.includes('forbidden')) {
                                    alert('You can only delete your own comments or comments in your gallery');
                                }
                            },
                            () => updateCommentsWithTransition(page)
                        );
                    });
                }

                document.querySelector("#comments").appendChild(elmt);
            });

            currentCommentPage = page;
        }
    );
}

function updateCommentsWithTransition(givenPage = null) {
    const commentsContainer = document.querySelector("#comments");

    Array.from(commentsContainer.children).forEach(c => c.classList.add("fade-out"));

    setTimeout(() => {
        updateComments(givenPage);

        Array.from(commentsContainer.querySelectorAll(".comment")).forEach(c => {
            c.classList.add("fade-in");
            setTimeout(() => c.classList.add("show"), 20);
            setTimeout(() => c.classList.remove("fade-in", "show"), 400);
        });
    }, 250);
}

// Listen for image changes from image-display controller
document.addEventListener("imageChanged", (e) => {
    currentImage = e.detail;
    currentCommentPage = 0;
    updateCommentsWithTransition(0);
});

document.addEventListener("click", (e) => {
    if (e.target.id === "prev-comments") {
        if (currentCommentPage > 0) {
            updateCommentsWithTransition(currentCommentPage - 1);
        }
    }

    if (e.target.id === "next-comments") {
        updateCommentsWithTransition(currentCommentPage + 1);
    }
});

document.querySelector("#post_comment .minimize_btn").addEventListener("click", () => {
    document.querySelector("#post_comment .form_body").classList.toggle("minimized");
});